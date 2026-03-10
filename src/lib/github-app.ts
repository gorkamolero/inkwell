import * as fs from "node:fs";
import * as path from "node:path";
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";

// ============================================================================
// Types
// ============================================================================

export interface RepoInfo {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  defaultBranch: string;
}

export interface DocumentInfo {
  path: string;
  name: string;
  sha: string;
}

export interface DocumentContent {
  content: string;
  sha: string;
}

export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: string;
}

export interface CommitResult {
  sha: string;
  commitUrl: string;
}

// ============================================================================
// GitHub App Authentication
// ============================================================================

// Read private key from file
function getPrivateKey(): string {
  const inlineKey = process.env.GITHUB_APP_PRIVATE_KEY;
  if (inlineKey) {
    return inlineKey.replace(/\\n/g, "\n").trim();
  }

  const keyPath = process.env.GITHUB_APP_PRIVATE_KEY_PATH;
  if (!keyPath) {
    throw new Error(
      "GITHUB_APP_PRIVATE_KEY or GITHUB_APP_PRIVATE_KEY_PATH not set",
    );
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

// Get installation ID for a user/org
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

// Get an Octokit instance for a specific repo owner (finds their installation)
export async function getOctokitForOwner(
  owner: string,
): Promise<Octokit | null> {
  const installationId = await getInstallationId(owner);
  if (!installationId) {
    return null;
  }

  return getInstallationOctokit(installationId);
}

// ============================================================================
// Repository Operations
// ============================================================================

// List repositories accessible to an installation
export async function listInstallationRepos(
  installationId: number,
): Promise<RepoInfo[]> {
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

/**
 * Create a new repository for a user using their OAuth token.
 * This still requires OAuth because GitHub Apps can't create repos for users.
 * Falls back gracefully if user doesn't have repo create permission.
 */
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
// Document Operations (using GitHub App installation tokens)
// ============================================================================

/**
 * List all markdown files in a repository.
 */
export async function listDocuments(
  owner: string,
  repo: string,
  branch: string,
): Promise<DocumentInfo[]> {
  const octokit = await getOctokitForOwner(owner);
  if (!octokit) {
    throw new Error(`GitHub App not installed for ${owner}`);
  }

  const { data: ref } = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${branch}`,
  });

  const { data: tree } = await octokit.git.getTree({
    owner,
    repo,
    tree_sha: ref.object.sha,
    recursive: "true",
  });

  return tree.tree
    .filter(
      (item): item is typeof item & { path: string; sha: string } =>
        item.type === "blob" &&
        item.path !== undefined &&
        item.path.endsWith(".md") &&
        item.sha !== undefined,
    )
    .map((item) => ({
      path: item.path,
      name: item.path.split("/").pop() ?? item.path,
      sha: item.sha,
    }));
}

/**
 * List markdown files in a specific path.
 */
export async function listDocumentsInPath(
  owner: string,
  repo: string,
  dirPath: string,
  branch: string,
): Promise<DocumentInfo[]> {
  const maybeOctokit = await getOctokitForOwner(owner);
  if (!maybeOctokit) {
    throw new Error(`GitHub App not installed for ${owner}`);
  }
  
  // Assign to a const that TypeScript knows is non-null
  const octokit = maybeOctokit;
  const documents: DocumentInfo[] = [];

  async function listRecursive(currentPath: string): Promise<void> {
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: currentPath,
        ref: branch,
      });

      if (!Array.isArray(data)) return;

      for (const item of data) {
        if (item.type === "file" && item.name.endsWith(".md")) {
          documents.push({
            path: item.path,
            name: item.name,
            sha: item.sha,
          });
        } else if (item.type === "dir") {
          await listRecursive(item.path);
        }
      }
    } catch (error) {
      // Ignore 404 errors for empty directories
      if ((error as { status?: number }).status !== 404) {
        throw error;
      }
    }
  }

  await listRecursive(dirPath);
  return documents;
}

/**
 * Get the content of a document.
 */
export async function getDocument(
  owner: string,
  repo: string,
  filePath: string,
  branch: string,
): Promise<DocumentContent> {
  const octokit = await getOctokitForOwner(owner);
  if (!octokit) {
    throw new Error(`GitHub App not installed for ${owner}`);
  }

  const { data } = await octokit.repos.getContent({
    owner,
    repo,
    path: filePath,
    ref: branch,
  });

  if (Array.isArray(data) || data.type !== "file") {
    throw new Error(`Path "${filePath}" is not a file`);
  }

  const content = Buffer.from(data.content, "base64").toString("utf-8");

  return {
    content,
    sha: data.sha,
  };
}

/**
 * Save (create or update) a document.
 */
export async function saveDocument(
  owner: string,
  repo: string,
  filePath: string,
  content: string,
  sha: string | null,
  message: string,
  branch: string,
): Promise<string> {
  const octokit = await getOctokitForOwner(owner);
  if (!octokit) {
    throw new Error(`GitHub App not installed for ${owner}`);
  }

  const { data } = await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: filePath,
    message,
    content: Buffer.from(content).toString("base64"),
    branch,
    sha: sha ?? undefined,
  });

  return data.content?.sha ?? "";
}

/**
 * Delete a document.
 */
export async function deleteDocument(
  owner: string,
  repo: string,
  filePath: string,
  sha: string,
  branch: string,
): Promise<void> {
  const octokit = await getOctokitForOwner(owner);
  if (!octokit) {
    throw new Error(`GitHub App not installed for ${owner}`);
  }

  await octokit.repos.deleteFile({
    owner,
    repo,
    path: filePath,
    message: `Delete ${filePath}`,
    sha,
    branch,
  });
}

// ============================================================================
// Version History Operations
// ============================================================================

/**
 * Get commit history for a file.
 */
export async function getCommitHistory(
  owner: string,
  repo: string,
  filePath: string,
  branch: string,
): Promise<CommitInfo[]> {
  const octokit = await getOctokitForOwner(owner);
  if (!octokit) {
    throw new Error(`GitHub App not installed for ${owner}`);
  }

  const { data } = await octokit.repos.listCommits({
    owner,
    repo,
    path: filePath,
    sha: branch,
    per_page: 100,
  });

  return data.map((commit) => ({
    sha: commit.sha,
    message: commit.commit.message,
    author: commit.commit.author?.name ?? commit.author?.login ?? "Unknown",
    date: commit.commit.author?.date ?? new Date().toISOString(),
  }));
}

/**
 * Get file content at a specific commit.
 */
export async function getFileAtCommit(
  owner: string,
  repo: string,
  filePath: string,
  commitSha: string,
): Promise<DocumentContent> {
  const octokit = await getOctokitForOwner(owner);
  if (!octokit) {
    throw new Error(`GitHub App not installed for ${owner}`);
  }

  // Get the commit's tree
  const { data: commit } = await octokit.git.getCommit({
    owner,
    repo,
    commit_sha: commitSha,
  });

  // Get the tree recursively
  const { data: tree } = await octokit.git.getTree({
    owner,
    repo,
    tree_sha: commit.tree.sha,
    recursive: "true",
  });

  // Find the file in the tree
  const file = tree.tree.find((item) => item.path === filePath);
  if (!file || !file.sha) {
    throw new Error(`File "${filePath}" not found at commit ${commitSha}`);
  }

  // Get the blob content
  const { data: blob } = await octokit.git.getBlob({
    owner,
    repo,
    file_sha: file.sha,
  });

  const content = Buffer.from(blob.content, "base64").toString("utf-8");

  return {
    content,
    sha: file.sha,
  };
}

// ============================================================================
// Multi-file Commit Operations
// ============================================================================

/**
 * Get the SHA of a file if it exists.
 */
export async function getFileSha(
  owner: string,
  repo: string,
  filePath: string,
  branch: string,
): Promise<string | null> {
  const octokit = await getOctokitForOwner(owner);
  if (!octokit) {
    throw new Error(`GitHub App not installed for ${owner}`);
  }

  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: filePath,
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
 * Commit a single file.
 */
export async function commitFile(
  owner: string,
  repo: string,
  filePath: string,
  content: string,
  message: string,
  branch: string = "main",
): Promise<CommitResult | null> {
  const octokit = await getOctokitForOwner(owner);
  if (!octokit) {
    throw new Error(`GitHub App not installed for ${owner}`);
  }

  try {
    const existingSha = await getFileSha(owner, repo, filePath, branch);

    const { data } = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      message,
      content: Buffer.from(content).toString("base64"),
      branch,
      ...(existingSha ? { sha: existingSha } : {}),
    });

    console.log(`[github-app] Committed file: ${filePath} to ${owner}/${repo}`);
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
 * Commit multiple files in a single commit using the Git Data API.
 */
export async function commitMultipleFiles(
  owner: string,
  repo: string,
  files: Array<{ path: string; content: string }>,
  message: string,
  branch: string = "main",
): Promise<CommitResult | null> {
  const octokit = await getOctokitForOwner(owner);
  if (!octokit) {
    throw new Error(`GitHub App not installed for ${owner}`);
  }

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

// ============================================================================
// Helper: Check if GitHub App is installed for a repo
// ============================================================================

export async function isAppInstalled(owner: string): Promise<boolean> {
  const installationId = await getInstallationId(owner);
  return installationId !== null;
}

/**
 * Get the installation URL for users who need to install the app.
 */
export function getInstallUrl(): string {
  const appSlug = process.env.GITHUB_APP_SLUG || "hotpress-app";
  return `https://github.com/apps/${appSlug}/installations/new`;
}
