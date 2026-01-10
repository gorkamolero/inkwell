import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, projects, accounts } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getFileAtCommit } from "@/lib/github";

interface RouteParams {
  params: Promise<{
    projectId: string;
    docPath: string;
    commitSha: string;
  }>;
}

// GET - Fetch document content at a specific commit
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { projectId, docPath, commitSha } = await params;
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
    const documentPath = decodeURIComponent(docPath);

    const documentData = await getFileAtCommit(
      accessToken,
      owner,
      repo,
      documentPath,
      commitSha
    );

    return NextResponse.json({
      content: documentData.content,
      sha: documentData.sha,
    });
  } catch (error) {
    console.error("GET version error:", error);
    return NextResponse.json(
      { error: "Failed to fetch version" },
      { status: 500 }
    );
  }
}
