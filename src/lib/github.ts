import { Octokit } from "@octokit/rest";

// ============================================================================
// Types
// ============================================================================

export interface GitHubRepo {
  owner: string;
  repo: string;
  branch: string;
}

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

export interface RepoStructure {
  type: "single" | "multi";
  books?: { name: string; path: string }[];
}

// ============================================================================
// Custom Error Class
// ============================================================================

export type GitHubErrorCode =
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "RATE_LIMITED"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "SERVER_ERROR"
  | "NETWORK_ERROR"
  | "UNKNOWN";

interface OctokitError {
  status: number;
  message?: string;
  response?: {
    headers?: Record<string, string>;
  };
}

function isOctokitError(error: unknown): error is OctokitError {
  return (
    error !== null &&
    typeof error === "object" &&
    "status" in error &&
    typeof error.status === "number"
  );
}

function extractErrorDetails(error: OctokitError): {
  status: number;
  message: string;
  retryAfter: number | undefined;
} {
  const status = error.status;
  const message =
    typeof error.message === "string" ? error.message : "GitHub API error";

  const headers = error.response?.headers;
  let retryAfter: number | undefined;

  if (headers?.["retry-after"]) {
    retryAfter = parseInt(headers["retry-after"], 10) * 1000;
  } else if (headers?.["x-ratelimit-reset"]) {
    const resetTime = parseInt(headers["x-ratelimit-reset"], 10) * 1000;
    retryAfter = Math.max(0, resetTime - Date.now());
  }

  return { status, message, retryAfter };
}

function createErrorFromStatus(
  status: number,
  message: string,
  retryAfter: number | undefined,
): GitHubError {
  switch (status) {
    case 401:
      return new GitHubError(
        "Authentication failed. Please reconnect your GitHub account.",
        "UNAUTHORIZED",
        status,
      );
    case 403:
      if (message.toLowerCase().includes("rate limit")) {
        return new GitHubError(
          "GitHub API rate limit exceeded. Please try again later.",
          "RATE_LIMITED",
          status,
          retryAfter,
        );
      }
      return new GitHubError(
        "Access forbidden. You may not have permission to perform this action.",
        "FORBIDDEN",
        status,
      );
    case 404:
      return new GitHubError(
        "Resource not found. The repository or file may have been deleted.",
        "NOT_FOUND",
        status,
      );
    case 409:
      return new GitHubError(
        "Conflict detected. The file may have been modified by someone else.",
        "CONFLICT",
        status,
      );
    case 422:
      return new GitHubError(
        "Validation failed. Please check your input.",
        "VALIDATION_ERROR",
        status,
      );
    default:
      if (status >= 500) {
        return new GitHubError(
          "GitHub server error. Please try again later.",
          "SERVER_ERROR",
          status,
        );
      }
      return new GitHubError(message, "UNKNOWN", status);
  }
}

export class GitHubError extends Error {
  code: GitHubErrorCode;
  status?: number;
  retryAfter?: number;

  constructor(
    message: string,
    code: GitHubErrorCode,
    status?: number,
    retryAfter?: number,
  ) {
    super(message);
    this.name = "GitHubError";
    this.code = code;
    this.status = status;
    this.retryAfter = retryAfter;
  }

  static fromOctokitError(error: unknown): GitHubError {
    if (error instanceof GitHubError) {
      return error;
    }

    if (error instanceof Error) {
      const isNetworkError =
        error.message.includes("fetch") || error.message.includes("network");
      if (isNetworkError) {
        return new GitHubError(
          "Network error. Please check your connection.",
          "NETWORK_ERROR",
        );
      }
    }

    if (!isOctokitError(error)) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred";
      return new GitHubError(message, "UNKNOWN");
    }

    const { status, message, retryAfter } = extractErrorDetails(error);
    return createErrorFromStatus(status, message, retryAfter);
  }
}

// ============================================================================
// Retry Logic
// ============================================================================

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BASE_DELAY = 1000;
const MAX_RETRY_DELAY = 60000;

const NON_RETRYABLE_ERRORS = new Set<GitHubErrorCode>([
  "NOT_FOUND",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "VALIDATION_ERROR",
  "CONFLICT",
]);

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = DEFAULT_MAX_RETRIES,
  baseDelay = DEFAULT_BASE_DELAY,
): Promise<T> {
  let lastError: GitHubError | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = GitHubError.fromOctokitError(error);

      if (NON_RETRYABLE_ERRORS.has(lastError.code) || attempt === maxRetries) {
        throw lastError;
      }

      const delay =
        lastError.code === "RATE_LIMITED" && lastError.retryAfter
          ? Math.min(lastError.retryAfter, MAX_RETRY_DELAY)
          : baseDelay * 2 ** attempt + Math.random() * 1000;

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError ?? new GitHubError("Retry failed", "UNKNOWN");
}

// ============================================================================
// Client Factory
// ============================================================================

/**
 * Creates a configured Octokit instance with the given access token.
 */
export function getGitHubClient(accessToken: string): Octokit {
  return new Octokit({
    auth: accessToken,
  });
}

// Legacy alias for backwards compatibility
export const createOctokit = getGitHubClient;

// ============================================================================
// Repository Operations
// ============================================================================

/**
 * Lists all repositories accessible to the authenticated user.
 * Includes both public and private repositories.
 */
export async function listUserRepos(accessToken: string): Promise<RepoInfo[]> {
  const octokit = getGitHubClient(accessToken);

  return withRetry(async () => {
    const repos: RepoInfo[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const { data } = await octokit.repos.listForAuthenticatedUser({
        sort: "updated",
        direction: "desc",
        per_page: perPage,
        page,
        visibility: "all", // Include private repos
      });

      if (data.length === 0) break;

      repos.push(
        ...data.map((repo) => ({
          id: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          private: repo.private,
          defaultBranch: repo.default_branch,
        })),
      );

      if (data.length < perPage) break;
      page++;
    }

    return repos;
  });
}

/**
 * Creates a new repository for the authenticated user.
 * Optionally initializes with a README.
 */
export async function createRepo(
  accessToken: string,
  name: string,
  isPrivate: boolean,
): Promise<RepoInfo> {
  const octokit = getGitHubClient(accessToken);

  return withRetry(async () => {
    const { data } = await octokit.repos.createForAuthenticatedUser({
      name,
      private: isPrivate,
      auto_init: true, // Initialize with README
      description: "Created with Hotpress",
    });

    return {
      id: data.id,
      name: data.name,
      fullName: data.full_name,
      private: data.private,
      defaultBranch: data.default_branch,
    };
  });
}

// ============================================================================
// Document Operations
// ============================================================================

/**
 * Recursively lists all markdown files in a repository.
 */
export async function listDocuments(
  accessToken: string,
  owner: string,
  repo: string,
  branch: string,
): Promise<DocumentInfo[]> {
  const octokit = getGitHubClient(accessToken);

  return withRetry(async () => {
    // Use the Git Trees API for efficient recursive listing
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
  });
}

/**
 * Lists markdown files in a specific path (for chaptersPath support).
 */
export async function listDocumentsInPath(
  accessToken: string,
  owner: string,
  repo: string,
  path: string,
  branch: string,
): Promise<DocumentInfo[]> {
  const octokit = getGitHubClient(accessToken);

  return withRetry(async () => {
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
        const ghError = GitHubError.fromOctokitError(error);
        // Ignore 404 errors for empty directories
        if (ghError.code !== "NOT_FOUND") {
          throw ghError;
        }
      }
    }

    await listRecursive(path);
    return documents;
  });
}

/**
 * Fetches the content of a document.
 */
export async function getDocument(
  accessToken: string,
  owner: string,
  repo: string,
  path: string,
  branch: string,
): Promise<DocumentContent> {
  const octokit = getGitHubClient(accessToken);

  return withRetry(async () => {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });

    if (Array.isArray(data) || data.type !== "file") {
      throw new GitHubError(`Path "${path}" is not a file`, "VALIDATION_ERROR");
    }

    // Content is base64 encoded
    const content = Buffer.from(data.content, "base64").toString("utf-8");

    return {
      content,
      sha: data.sha,
    };
  });
}

/**
 * Creates or updates a file in the repository.
 * If sha is null, creates a new file.
 */
export async function saveDocument(
  accessToken: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  sha: string | null,
  message: string,
  branch: string,
): Promise<string> {
  const octokit = getGitHubClient(accessToken);

  return withRetry(async () => {
    const { data } = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: Buffer.from(content).toString("base64"),
      branch,
      sha: sha ?? undefined,
    });

    return data.content?.sha ?? "";
  });
}

/**
 * Deletes a file from the repository.
 */
export async function deleteDocument(
  accessToken: string,
  owner: string,
  repo: string,
  path: string,
  sha: string,
  branch: string,
): Promise<void> {
  const octokit = getGitHubClient(accessToken);

  return withRetry(async () => {
    await octokit.repos.deleteFile({
      owner,
      repo,
      path,
      message: `Delete ${path}`,
      sha,
      branch,
    });
  });
}

// ============================================================================
// Version History Operations
// ============================================================================

/**
 * Gets the commit history for a specific file.
 */
export async function getCommitHistory(
  accessToken: string,
  owner: string,
  repo: string,
  path: string,
  branch: string,
): Promise<CommitInfo[]> {
  const octokit = getGitHubClient(accessToken);

  return withRetry(async () => {
    const { data } = await octokit.repos.listCommits({
      owner,
      repo,
      path,
      sha: branch,
      per_page: 100,
    });

    return data.map((commit) => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: commit.commit.author?.name ?? commit.author?.login ?? "Unknown",
      date: commit.commit.author?.date ?? new Date().toISOString(),
    }));
  });
}

/**
 * Gets the content of a file at a specific commit.
 */
export async function getFileAtCommit(
  accessToken: string,
  owner: string,
  repo: string,
  path: string,
  commitSha: string,
): Promise<DocumentContent> {
  const octokit = getGitHubClient(accessToken);

  return withRetry(async () => {
    // Get the tree at the commit
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
    const file = tree.tree.find((item) => item.path === path);
    if (!file || !file.sha) {
      throw new GitHubError(
        `File "${path}" not found at commit ${commitSha}`,
        "NOT_FOUND",
      );
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
  });
}

// ============================================================================
// Repository Structure Detection
// ============================================================================

const PROJECT_FILE_PATTERNS = [
  "readme",
  "license",
  "claude",
  "contributing",
  "changelog",
  "code_of_conduct",
  "security",
] as const;

const EXCLUDED_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  ".github",
  "docs",
  "scripts",
]);

function isProjectFile(path: string): boolean {
  const fileName = path.toLowerCase();
  return PROJECT_FILE_PATTERNS.some((pattern) => fileName.includes(pattern));
}

function isExcludedDirectory(dir: string): boolean {
  return EXCLUDED_DIRECTORIES.has(dir) || dir.startsWith(".");
}

function groupFilesByTopDirectory(
  files: Array<{ path?: string }>,
): Map<string, string[]> {
  const candidates = new Map<string, string[]>();

  for (const item of files) {
    if (!item.path) continue;

    const parts = item.path.split("/");
    if (parts.length < 2) continue;

    const topDir = parts[0];
    if (isExcludedDirectory(topDir)) continue;
    if (parts.some((p) => p.startsWith("."))) continue;

    if (!candidates.has(topDir)) {
      candidates.set(topDir, []);
    }
    candidates.get(topDir)!.push(item.path);
  }

  return candidates;
}

/**
 * Analyzes repository structure to detect if it's single-book or multi-book.
 *
 * Single-book structure:
 * - Has .md files at root
 * - Has .md files in a "chapters" folder
 *
 * Multi-book structure:
 * - Has subfolders that each contain .md files
 * - Example: book-a/output/chapters/*.md, book-b/output/chapters/*.md
 */
export async function detectRepoStructure(
  accessToken: string,
  owner: string,
  repo: string,
  branch: string,
): Promise<RepoStructure> {
  const octokit = getGitHubClient(accessToken);

  return withRetry(async () => {
    // Get the full tree
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

    const mdFiles = tree.tree.filter(
      (item) => item.type === "blob" && item.path?.endsWith(".md") && item.path,
    );

    const rootMdFiles = mdFiles.filter((item) => {
      const path = item.path!;
      return !path.includes("/") && !isProjectFile(path);
    });

    const chaptersFiles = mdFiles.filter(
      (item) =>
        item.path?.startsWith("chapters/") && !item.path.includes("/", 9),
    );

    const bookCandidates = groupFilesByTopDirectory(mdFiles);

    const books: { name: string; path: string }[] = [];
    bookCandidates.forEach((files, dir) => {
      if (files.length >= 2) {
        books.push({
          name: formatBookName(dir),
          path: findChaptersPath(files, dir),
        });
      }
    });

    if (books.length > 1) {
      return { type: "multi", books };
    }

    if (rootMdFiles.length > 0 || chaptersFiles.length > 0) {
      return { type: "single" };
    }

    return { type: "single" };
  });
}

/**
 * Finds the common chapters path from a list of file paths.
 */
function findChaptersPath(files: string[], topDir: string): string {
  const patterns = [
    `${topDir}/output/chapters`,
    `${topDir}/chapters`,
    `${topDir}/content`,
    `${topDir}/src`,
    topDir,
  ];

  for (const pattern of patterns) {
    if (files.some((f) => f.startsWith(`${pattern}/`))) {
      return pattern;
    }
  }

  const sortedFiles = [...files].sort();
  const first = sortedFiles[0];
  const last = sortedFiles[sortedFiles.length - 1];

  let commonPrefix = "";
  for (let i = 0; i < first.length; i++) {
    if (first[i] === last[i]) {
      commonPrefix += first[i];
    } else {
      break;
    }
  }

  const lastSlash = commonPrefix.lastIndexOf("/");
  return lastSlash > 0 ? commonPrefix.substring(0, lastSlash) : topDir;
}

/**
 * Formats a directory name as a book title.
 */
function formatBookName(dirName: string): string {
  return dirName
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// ============================================================================
// Legacy Functions (for backwards compatibility)
// ============================================================================

/**
 * Parses a GitHub URL into owner, repo, and branch.
 */
export function parseGitHubUrl(url: string): GitHubRepo | null {
  const match = url.match(
    /github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/tree\/([^/]+))?$/,
  );
  if (!match) return null;

  return {
    owner: match[1],
    repo: match[2],
    branch: match[3] || "main",
  };
}

/**
 * Gets repository contents at a given path.
 * @deprecated Use listDocuments or getDocument instead
 */
export async function getRepoContents(
  octokit: Octokit,
  { owner, repo, branch }: GitHubRepo,
  path: string = "",
): Promise<
  | {
      type: string;
      size: number;
      name: string;
      path: string;
      content?: string;
      sha: string;
      url: string;
      git_url: string | null;
      html_url: string | null;
      download_url: string | null;
    }
  | Array<{
      type: string;
      size: number;
      name: string;
      path: string;
      sha: string;
      url: string;
      git_url: string | null;
      html_url: string | null;
      download_url: string | null;
    }>
> {
  const { data } = await octokit.repos.getContent({
    owner,
    repo,
    path,
    ref: branch,
  });

  return data;
}

/**
 * Gets file content from a repository.
 * @deprecated Use getDocument instead
 */
export async function getFileContent(
  octokit: Octokit,
  { owner, repo, branch }: GitHubRepo,
  path: string,
): Promise<{ content: string; sha: string; path: string }> {
  const { data } = await octokit.repos.getContent({
    owner,
    repo,
    path,
    ref: branch,
  });

  if (Array.isArray(data) || data.type !== "file") {
    throw new Error("Path is not a file");
  }

  const content = Buffer.from(data.content, "base64").toString("utf-8");

  return {
    content,
    sha: data.sha,
    path: data.path,
  };
}

/**
 * Creates or updates a file.
 * @deprecated Use saveDocument instead
 */
export async function createOrUpdateFile(
  octokit: Octokit,
  { owner, repo, branch }: GitHubRepo,
  {
    path,
    content,
    message,
    sha,
  }: {
    path: string;
    content: string;
    message: string;
    sha?: string;
  },
) {
  const { data } = await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: Buffer.from(content).toString("base64"),
    branch,
    sha,
  });

  return data;
}

/**
 * Lists branches in a repository.
 */
export async function listBranches(
  octokit: Octokit,
  { owner, repo }: Pick<GitHubRepo, "owner" | "repo">,
) {
  const { data } = await octokit.repos.listBranches({
    owner,
    repo,
    per_page: 100,
  });

  return data;
}

/**
 * Creates a new branch from an existing one.
 */
export async function createBranch(
  octokit: Octokit,
  { owner, repo }: Pick<GitHubRepo, "owner" | "repo">,
  {
    branchName,
    sourceBranch,
  }: {
    branchName: string;
    sourceBranch: string;
  },
) {
  const { data: ref } = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${sourceBranch}`,
  });

  const { data } = await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: ref.object.sha,
  });

  return data;
}

/**
 * Creates a pull request.
 */
export async function createPullRequest(
  octokit: Octokit,
  { owner, repo }: Pick<GitHubRepo, "owner" | "repo">,
  {
    title,
    body,
    head,
    base,
  }: {
    title: string;
    body: string;
    head: string;
    base: string;
  },
) {
  const { data } = await octokit.pulls.create({
    owner,
    repo,
    title,
    body,
    head,
    base,
  });

  return data;
}
