import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { ApiError, requireDatabase } from "@/lib/api-utils";
import { auth } from "@/lib/auth";
import { projects } from "@/lib/db";
import { getCommitHistory, isAppInstalled } from "@/lib/github-app";

interface RouteParams {
  params: Promise<{
    projectId: string;
    docPath: string;
  }>;
}

// ============================================================================
// GET - Fetch commit history for a document
// ============================================================================

export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const { projectId, docPath } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      throw ApiError.unauthorized();
    }

    const database = requireDatabase();

    const project = await database.query.projects.findFirst({
      where: eq(projects.id, projectId),
    });

    if (!project?.githubRepo) {
      throw ApiError.notFound("Project not found or no GitHub repo connected");
    }

    const [owner, repo] = project.githubRepo.split("/");
    const branch = project.githubBranch || "main";
    const documentPath = decodeURIComponent(docPath);

    // Check if GitHub App is installed
    const installed = await isAppInstalled(owner);
    if (!installed) {
      throw ApiError.forbidden(
        "GitHub App not installed. Please install the Hotpress app on your repository.",
      );
    }

    const commits = await getCommitHistory(owner, repo, documentPath, branch);

    return NextResponse.json({ commits });
  } catch (error) {
    if (error instanceof ApiError) {
      return error.toResponse();
    }
    console.error("GET history error:", error);
    return ApiError.internal("Failed to fetch history").toResponse();
  }
}
