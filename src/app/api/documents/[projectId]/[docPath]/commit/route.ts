import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, projects, documents, accounts } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { saveDocument } from "@/lib/github";

interface RouteParams {
  params: Promise<{
    projectId: string;
    docPath: string;
  }>;
}

// POST - Commit draft to GitHub
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, docPath } = await params;
    const session = await auth();

    if (!session?.user?.id || !db) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { message } = body;

    // Get user's GitHub access token
    const userAccount = await db
      .select({ accessToken: accounts.access_token })
      .from(accounts)
      .where(
        and(
          eq(accounts.userId, session.user.id),
          eq(accounts.provider, "github")
        )
      )
      .limit(1);

    const accessToken = userAccount[0]?.accessToken;
    if (!accessToken) {
      return NextResponse.json(
        { error: "GitHub not connected" },
        { status: 403 }
      );
    }

    // Get project
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    });

    if (!project || !project.githubRepo) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const documentPath = decodeURIComponent(docPath);

    // Get document with draft content
    const document = await db.query.documents.findFirst({
      where: and(
        eq(documents.projectId, projectId),
        eq(documents.path, documentPath)
      ),
    });

    if (!document || !document.draftContent) {
      return NextResponse.json(
        { error: "No draft to commit" },
        { status: 400 }
      );
    }

    const [owner, repo] = project.githubRepo.split("/");
    const branch = project.githubBranch || "main";

    // Commit to GitHub
    const newSha = await saveDocument(
      accessToken,
      owner,
      repo,
      documentPath,
      document.draftContent,
      document.lastCommitSha || null,
      message || `Update ${documentPath}`,
      branch
    );

    // Update document - clear draft, store new SHA
    await db
      .update(documents)
      .set({
        draftContent: null,
        lastCommitSha: newSha,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(eq(documents.projectId, projectId), eq(documents.path, documentPath))
      );

    return NextResponse.json({ sha: newSha, success: true });
  } catch (error) {
    console.error("Commit error:", error);
    return NextResponse.json(
      { error: "Failed to commit to GitHub" },
      { status: 500 }
    );
  }
}
