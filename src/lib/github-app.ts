import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";
import * as fs from "fs";
import * as path from "path";

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
export async function getInstallationId(username: string): Promise<number | null> {
  const octokit = getAppOctokit();

  try {
    // List all installations and find one for the user
    const { data: installations } = await octokit.apps.listInstallations();

    console.log(`[github-app] Looking for installation for user: ${username}`);
    console.log(`[github-app] Found ${installations.length} installations:`,
      installations.map(i => i.account?.login));

    for (const installation of installations) {
      if (installation.account?.login?.toLowerCase() === username.toLowerCase()) {
        console.log(`[github-app] Found matching installation: ${installation.id}`);
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
export async function getInstallationOctokit(installationId: number): Promise<Octokit> {
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
export async function getOctokitForUser(username: string): Promise<Octokit | null> {
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
  description?: string
): Promise<{ owner: string; repo: string; defaultBranch: string } | null> {
  const octokit = new Octokit({ auth: accessToken });

  try {
    const { data: repo } = await octokit.repos.createForAuthenticatedUser({
      name: repoName,
      private: isPrivate,
      description: description || `Created by Inkwell`,
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
