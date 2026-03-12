import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { generateId } from "@/lib/api-utils";
import { auth } from "@/lib/auth";
import { db, documents, projects } from "@/lib/db";
import { ensureUniqueDocumentSlug } from "@/lib/document-routing";
import { getInstallationId, getInstallationOctokit } from "@/lib/github-app";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  if (!db) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 },
    );
  }

  // Get project
  const project = await db.query.projects.findFirst({
    where: eq(projects.slug, projectId),
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Check ownership
  if (project.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!project.githubRepo) {
    return NextResponse.json(
      { error: "Project not connected to GitHub" },
      { status: 400 },
    );
  }

  const [owner, repoName] = project.githubRepo.split("/");

  try {
    // Get GitHub App installation
    const installationId = await getInstallationId(owner);
    if (!installationId) {
      return NextResponse.json(
        { error: "GitHub App not installed" },
        { status: 403 },
      );
    }

    const octokit = await getInstallationOctokit(installationId);

    // Get repo info and use stored branch or fall back to default
    const { data: repoData } = await octokit.repos.get({
      owner,
      repo: repoName,
    });
    const branch = project.githubBranch || repoData.default_branch;

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

    // Filter to markdown files in the chapters path
    const chaptersPath = project.chaptersPath || "";
    const mdFiles = treeData.tree.filter((item) => {
      if (item.type !== "blob" || !item.path?.endsWith(".md")) return false;

      // If chaptersPath is set, only include files in that path
      if (chaptersPath) {
        return item.path.startsWith(`${chaptersPath}/`);
      }

      // Otherwise include all .md files except common project files
      const fileName = item.path.toLowerCase();
      const excludePatterns = [
        "readme",
        "license",
        "contributing",
        "changelog",
        "claude",
      ];
      return !excludePatterns.some((p) => fileName.includes(p));
    });

    // Get existing documents
    const existingDocs = await db.query.documents.findMany({
      where: eq(documents.projectId, project.id),
    });
    const existingPaths = new Set(existingDocs.map((d) => d.path));

    // Create new documents
    const now = new Date();
    const newDocs = [];

    for (const item of mdFiles) {
      if (!item.path || existingPaths.has(item.path)) {
        continue;
      }

      newDocs.push({
        id: generateId(),
        projectId: project.id,
        slug: await ensureUniqueDocumentSlug({
          projectId: project.id,
          path: item.path,
          title: extractTitle(item.path),
        }),
        path: item.path,
        title: extractTitle(item.path),
        lastSyncedAt: now,
        wordCount: null,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (newDocs.length > 0) {
      await db.insert(documents).values(newDocs);
    }

    // Update project's updatedAt
    await db
      .update(projects)
      .set({ updatedAt: now })
      .where(eq(projects.id, project.id));

    return NextResponse.json({
      synced: newDocs.length,
      total: existingDocs.length + newDocs.length,
      message:
        newDocs.length > 0
          ? `Synced ${newDocs.length} new document(s)`
          : "Already up to date",
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync from GitHub" },
      { status: 500 },
    );
  }
}

function extractTitle(path: string): string {
  const filename = path.split("/").pop() || path;
  return filename
    .replace(/\.md$/, "")
    .replace(/^\d+[-_]?/, "") // Remove leading numbers like "01-" or "1_"
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
