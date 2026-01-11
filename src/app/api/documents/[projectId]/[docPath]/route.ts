import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, projects, documents, accounts } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import {
  getDocument,
  deleteDocument,
} from "@/lib/github";
import { countWords, extractTitle } from "@/lib/editor-utils";

interface RouteParams {
  params: Promise<{
    projectId: string;
    docPath: string;
  }>;
}

// GET - Fetch document content
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, docPath } = await params;
    const session = await auth();

    if (!session?.user?.id || !db) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const [owner, repo] = project.githubRepo.split("/");
    const branch = project.githubBranch || "main";
    const documentPath = decodeURIComponent(docPath);

    const documentData = await getDocument(
      accessToken,
      owner,
      repo,
      documentPath,
      branch
    );

    return NextResponse.json({
      content: documentData.content,
      sha: documentData.sha,
    });
  } catch (error) {
    console.error("GET document error:", error);
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 }
    );
  }
}

// PUT - Save document content
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, docPath } = await params;
    const session = await auth();

    if (!session?.user?.id || !db) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body;

    if (typeof content !== "string") {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

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

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const documentPath = decodeURIComponent(docPath);

    // Update local document with draft content (no GitHub commit)
    const wordCount = countWords(content);
    const title = extractTitle(content);

    await db
      .update(documents)
      .set({
        draftContent: content,
        wordCount,
        title: title || undefined,
        updatedAt: new Date(),
      })
      .where(
        and(eq(documents.projectId, projectId), eq(documents.path, documentPath))
      );

    return NextResponse.json({
      saved: true,
      wordCount,
      title,
    });
  } catch (error) {
    console.error("PUT document error:", error);

    // Check for conflict error
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("conflict")
    ) {
      return NextResponse.json(
        {
          error: "Conflict detected",
          message:
            "The document has been modified. Please refresh and try again.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to save document" },
      { status: 500 }
    );
  }
}

// DELETE - Delete document
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, docPath } = await params;
    const session = await auth();

    if (!session?.user?.id || !db) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sha } = body;

    if (!sha) {
      return NextResponse.json({ error: "SHA is required" }, { status: 400 });
    }

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

    // Get project and verify ownership
    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, projectId),
        eq(projects.userId, session.user.id)
      ),
    });

    if (!project || !project.githubRepo) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const [owner, repo] = project.githubRepo.split("/");
    const branch = project.githubBranch || "main";
    const documentPath = decodeURIComponent(docPath);

    // Delete from GitHub
    await deleteDocument(accessToken, owner, repo, documentPath, sha, branch);

    // Delete from local database
    await db
      .delete(documents)
      .where(
        and(eq(documents.projectId, projectId), eq(documents.path, documentPath))
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE document error:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
