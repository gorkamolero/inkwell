import * as fs from "node:fs";
import * as path from "node:path";
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";

// Read private key from file
function getPrivateKey(): string {
  const keyPath = process.env.GITHUB_APP_PRIVATE_KEY_PATH;
  if (!keyPath) {
    throw new Error("GITHUB_APP_PRIVATE_KEY_PATH not set");
  }

  const absolutePath = path.resolve(process.cwd(), keyPath);
  return fs.readFileSync(absolutePath, "utf8");
}

// Create an Octokit instance authenticated as the GitHub App
export function getAppOctokit(): Octokit {
  const appId = process.env.GITHUB_APP_ID;
  if (!appId) {
    throw new Error("GITHUB_APP_ID not set");
  }

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: parseInt(appId, 10),
      privateKey: getPrivateKey(),
    },
  });
}

// Get installation ID for a user
export async function getInstallationId(
  username: string,
): Promise<number | null> {
  const octokit = getAppOctokit();

  try {
    // List all installations and find one for the user
    const { data: installations } = await octokit.apps.listInstallations();

    console.log(`[github-app] Looking for installation for user: ${username}`);
    console.log(
      `[github-app] Found ${installations.length} installations:`,
      installations.map((i) => i.account?.login),
    );

    for (const installation of installations) {
      if (
        installation.account?.login?.toLowerCase() === username.toLowerCase()
      ) {
        console.log(
          `[github-app] Found matching installation: ${installation.id}`,
        );
        return installation.id;
      }
    }

    console.log(`[github-app] No installation found for ${username}`);
    return null;
  } catch (error) {
    console.error("[github-app] Error getting installation:", error);
    return null;
  }
}

// Create an Octokit instance with an installation token
export async function getInstallationOctokit(
  installationId: number,
): Promise<Octokit> {
  const appId = process.env.GITHUB_APP_ID;
  if (!appId) {
    throw new Error("GITHUB_APP_ID not set");
  }

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: parseInt(appId, 10),
      privateKey: getPrivateKey(),
      installationId,
    },
  });
}

// Get an Octokit instance for a specific user (finds their installation)
export async function getOctokitForUser(
  username: string,
): Promise<Octokit | null> {
  const installationId = await getInstallationId(username);
  if (!installationId) {
    return null;
  }

  return getInstallationOctokit(installationId);
}

// List repositories accessible to an installation
export async function listInstallationRepos(installationId: number) {
  const octokit = await getInstallationOctokit(installationId);

  const { data } = await octokit.apps.listReposAccessibleToInstallation({
    per_page: 100,
  });

  return data.repositories.map((repo) => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    private: repo.private,
    defaultBranch: repo.default_branch,
  }));
}

// Create a new repository for a user using their OAuth token
export async function createRepository(
  accessToken: string,
  repoName: string,
  isPrivate: boolean,
  description?: string,
): Promise<{ owner: string; repo: string; defaultBranch: string } | null> {
  const octokit = new Octokit({ auth: accessToken });

  try {
    const { data: repo } = await octokit.repos.createForAuthenticatedUser({
      name: repoName,
      private: isPrivate,
      description: description || `Created by Hotpress`,
      auto_init: true, // Create with README so we have a branch
    });

    console.log(`[github-app] Created repo: ${repo.full_name}`);
    return {
      owner: repo.owner.login,
      repo: repo.name,
      defaultBranch: repo.default_branch,
    };
  } catch (error) {
    console.error("[github-app] Error creating repository:", error);
    return null;
  }
}

// ============================================================================
// Content Operations using OAuth Token
// ============================================================================

interface CommitFileResult {
  sha: string;
  commitUrl: string;
}

/**
 * Get the SHA of a file if it exists
 */
export async function getFileSha(
  accessToken: string,
  owner: string,
  repo: string,
  path: string,
  branch: string,
): Promise<string | null> {
  const octokit = new Octokit({ auth: accessToken });

  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });

    if ("sha" in data) {
      return data.sha;
    }
    return null;
  } catch {
    // File doesn't exist
    return null;
  }
}

/**
 * Create or update a file in a repository
 */
export async function commitFile(
  accessToken: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  branch: string = "main",
): Promise<CommitFileResult | null> {
  const octokit = new Octokit({ auth: accessToken });

  try {
    // Check if file exists to get SHA for update
    const existingSha = await getFileSha(
      accessToken,
      owner,
      repo,
      path,
      branch,
    );

    const { data } = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: Buffer.from(content).toString("base64"),
      branch,
      ...(existingSha ? { sha: existingSha } : {}),
    });

    console.log(`[github-app] Committed file: ${path} to ${owner}/${repo}`);
    return {
      sha: data.commit.sha!,
      commitUrl: data.commit.html_url!,
    };
  } catch (error) {
    console.error("[github-app] Error committing file:", error);
    return null;
  }
}

/**
 * Commit multiple files in a single commit using the Git Data API
 */
export async function commitMultipleFiles(
  accessToken: string,
  owner: string,
  repo: string,
  files: Array<{ path: string; content: string }>,
  message: string,
  branch: string = "main",
): Promise<CommitFileResult | null> {
  const octokit = new Octokit({ auth: accessToken });

  try {
    // Get the current reference
    const { data: ref } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });

    const currentCommitSha = ref.object.sha;

    // Get the current commit's tree
    const { data: currentCommit } = await octokit.git.getCommit({
      owner,
      repo,
      commit_sha: currentCommitSha,
    });

    const baseTreeSha = currentCommit.tree.sha;

    // Create blobs for each file
    const blobs = await Promise.all(
      files.map(async (file) => {
        const { data: blob } = await octokit.git.createBlob({
          owner,
          repo,
          content: Buffer.from(file.content).toString("base64"),
          encoding: "base64",
        });
        return { path: file.path, sha: blob.sha };
      }),
    );

    // Create new tree with the blobs
    const { data: newTree } = await octokit.git.createTree({
      owner,
      repo,
      base_tree: baseTreeSha,
      tree: blobs.map((blob) => ({
        path: blob.path,
        mode: "100644" as const,
        type: "blob" as const,
        sha: blob.sha,
      })),
    });

    // Create the commit
    const { data: newCommit } = await octokit.git.createCommit({
      owner,
      repo,
      message,
      tree: newTree.sha,
      parents: [currentCommitSha],
    });

    // Update the reference
    await octokit.git.updateRef({
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: newCommit.sha,
    });

    console.log(
      `[github-app] Committed ${files.length} files to ${owner}/${repo}`,
    );
    return {
      sha: newCommit.sha,
      commitUrl: newCommit.html_url!,
    };
  } catch (error) {
    console.error("[github-app] Error committing multiple files:", error);
    return null;
  }
}
