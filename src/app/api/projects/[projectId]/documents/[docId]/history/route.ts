import { type NextRequest, NextResponse } from "next/server";
import { ApiError, type ProjectContext, withProject } from "@/lib/api-utils";
import { getDocumentByIdentifier } from "@/lib/document-routing";
import { db } from "@/lib/db";
import { getCommitHistory, isAppInstalled } from "@/lib/github-app";

// ============================================================================
// Route context type with docId
// ============================================================================

interface DocRouteContext {
  params: Promise<{ projectId: string; docId: string }>;
}

// ============================================================================
// GET /api/projects/[projectId]/documents/[docId]/history
// ============================================================================

async function getHistoryHandler(
  _request: NextRequest,
  context: ProjectContext,
  docId: string,
) {
  const { project } = context;

  if (!db) {
    throw ApiError.internal("Database not configured");
  }

  // Require GitHub repo for history
  if (!project.githubRepo) {
    throw ApiError.badRequest("No GitHub repo connected - cannot get history");
  }

  const [owner, repo] = project.githubRepo.split("/");
  const branch = project.githubBranch || "main";

  // Check if GitHub App is installed
  const installed = await isAppInstalled(owner);
  if (!installed) {
    throw ApiError.forbidden(
      "GitHub App not installed. Please install the Hotpress app on your repository.",
    );
  }

  const document = await getDocumentByIdentifier(project.id, docId);
  if (!document) {
    throw ApiError.notFound("Document not found");
  }

  try {
    const history = await getCommitHistory(owner, repo, document.path, branch);

    return NextResponse.json({
      document: {
        id: document.id,
        slug: document.slug,
        path: document.path,
        title: document.title,
      },
      history,
    });
  } catch (error) {
    console.error("Error fetching commit history:", error);
    throw ApiError.internal("Failed to fetch document history from GitHub");
  }
}

// ============================================================================
// Route Export
// ============================================================================

export async function GET(request: NextRequest, routeContext: DocRouteContext) {
  const { projectId, docId } = await routeContext.params;

  const handler = withProject((req, ctx) => getHistoryHandler(req, ctx, docId));

  return handler(request, { params: Promise.resolve({ projectId }) });
}
