import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getInstallationId, getInstallationOctokit } from "@/lib/github-app";

export const dynamic = "force-dynamic";

interface TreeNode {
  name: string;
  path: string;
  type: "tree" | "blob";
  children?: TreeNode[];
}

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const repo = searchParams.get("repo");

  if (!repo) {
    return NextResponse.json({ error: "Missing repo parameter" }, { status: 400 });
  }

  const [owner, repoName] = repo.split("/");
  if (!owner || !repoName) {
    return NextResponse.json({ error: "Invalid repo format" }, { status: 400 });
  }

  try {
    const installationId = await getInstallationId(owner);
    if (!installationId) {
      return NextResponse.json({ error: "GitHub App not installed" }, { status: 403 });
    }

    const octokit = await getInstallationOctokit(installationId);

    // Get default branch
    const { data: repoData } = await octokit.repos.get({ owner, repo: repoName });
    const branch = repoData.default_branch;

    // Get tree
    const { data: ref } = await octokit.git.getRef({
      owner,
      repo: repoName,
      ref: `heads/${branch}`,
    });

    const { data: treeData } = await octokit.git.getTree({
      owner,
      repo: repoName,
      tree_sha: ref.object.sha,
      recursive: "true",
    });

    // Build nested tree structure (folders only)
    const nodeMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = [];

    // First pass: create all nodes
    for (const item of treeData.tree) {
      if (!item.path || item.type !== "tree") continue;

      const node: TreeNode = {
        name: item.path.split("/").pop() || item.path,
        path: item.path,
        type: "tree",
        children: [],
      };
      nodeMap.set(item.path, node);
    }

    // Second pass: build hierarchy
    for (const [path, node] of nodeMap) {
      const parentPath = path.includes("/")
        ? path.substring(0, path.lastIndexOf("/"))
        : null;

      if (parentPath && nodeMap.has(parentPath)) {
        nodeMap.get(parentPath)!.children!.push(node);
      } else {
        rootNodes.push(node);
      }
    }

    return NextResponse.json({ tree: rootNodes });
  } catch (error) {
    console.error("Error fetching tree:", error);
    return NextResponse.json({ error: "Failed to fetch tree" }, { status: 500 });
  }
}
