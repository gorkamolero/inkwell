import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getInstallationId, getInstallationOctokit } from "@/lib/github-app";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const repo = searchParams.get("repo");

  if (!repo) {
    return NextResponse.json(
      { error: "Missing repo parameter" },
      { status: 400 }
    );
  }

  const [owner, repoName] = repo.split("/");
  if (!owner || !repoName) {
    return NextResponse.json(
      { error: "Invalid repo format. Expected owner/repo" },
      { status: 400 }
    );
  }

  try {
    // Get installation for the repo owner
    const installationId = await getInstallationId(owner);
    if (!installationId) {
      return NextResponse.json(
        { error: "GitHub App not installed for this account. Please install the app first." },
        { status: 403 }
      );
    }

    const octokit = await getInstallationOctokit(installationId);

    // Get repo info to find default branch
    const { data: repoData } = await octokit.repos.get({ owner, repo: repoName });
    const branch = repoData.default_branch;

    // Get the tree
    const { data: ref } = await octokit.git.getRef({
      owner,
      repo: repoName,
      ref: `heads/${branch}`,
    });

    const { data: tree } = await octokit.git.getTree({
      owner,
      repo: repoName,
      tree_sha: ref.object.sha,
      recursive: "true",
    });

    const mdFiles = tree.tree.filter(
      (item) => item.type === "blob" && item.path?.endsWith(".md") && item.path
    );

    // Common project files to exclude
    const projectFiles = [
      "readme", "license", "claude", "contributing",
      "changelog", "code_of_conduct", "security",
    ];

    // Check for root-level .md files (kept for future use)
    const _rootMdFiles = mdFiles.filter((item) => {
      const p = item.path!;
      const fileName = p.toLowerCase();
      return !p.includes("/") && !projectFiles.some((pf) => fileName.includes(pf));
    });

    // Check for chapters folder (kept for future use)
    const _chaptersFiles = mdFiles.filter(
      (item) => item.path?.startsWith("chapters/") && !item.path.includes("/", 9)
    );

    // Look for multi-book structure
    const bookCandidates = new Map<string, string[]>();

    for (const item of mdFiles) {
      if (!item.path) continue;
      const parts = item.path.split("/");
      if (parts.length < 2) continue;

      const topDir = parts[0];
      if (["node_modules", ".git", ".github", "docs", "scripts"].includes(topDir) || topDir.startsWith(".")) {
        continue;
      }
      if (parts.some((p) => p.startsWith("."))) continue;

      if (!bookCandidates.has(topDir)) {
        bookCandidates.set(topDir, []);
      }
      bookCandidates.get(topDir)!.push(item.path);
    }

    const books: { name: string; path: string }[] = [];
    bookCandidates.forEach((files, dir) => {
      if (files.length >= 2) {
        books.push({
          name: dir.split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" "),
          path: dir,
        });
      }
    });

    // Determine structure type
    let structure: { type: "single" | "multi"; books?: { name: string; path: string }[] };

    if (books.length > 1) {
      structure = { type: "multi", books };
    } else {
      structure = { type: "single" };
    }

    return NextResponse.json({ structure });
  } catch (error) {
    console.error("Error detecting repo structure:", error);
    return NextResponse.json(
      { error: "Failed to detect repository structure" },
      { status: 500 }
    );
  }
}
