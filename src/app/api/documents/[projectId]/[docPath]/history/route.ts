import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, projects, accounts } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getCommitHistory } from "@/lib/github";

interface RouteParams {
  params: Promise<{
    projectId: string;
    docPath: string;
  }>;
}

// GET - Fetch commit history for a document
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

    const commits = await getCommitHistory(
      accessToken,
      owner,
      repo,
      documentPath,
      branch
    );

    return NextResponse.json({ commits });
  } catch (error) {
    console.error("GET history error:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}
