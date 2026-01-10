import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { withProject, ApiError, type ProjectContext } from "@/lib/api-utils";
import { db, documents } from "@/lib/db";
import { getCommitHistory } from "@/lib/github";

// ============================================================================
// Route context type with docId
// ============================================================================

interface DocRouteContext {
  params: Promise<{ projectId: string; docId: string }>;
}

// ============================================================================
// Helper: Get document by ID or path
// ============================================================================

async function getDocumentRecord(projectId: string, docId: string) {
  if (!db) {
    throw ApiError.internal("Database not configured");
  }

  // docId could be either the document ID or the URL-encoded path
  const document = await db.query.documents.findFirst({
    where: eq(documents.id, docId),
  });

  if (document && document.projectId === projectId) {
    return document;
  }

  // Try finding by path (URL-decoded)
  const decodedPath = decodeURIComponent(docId);
  const docByPath = await db.query.documents.findFirst({
    where: and(
      eq(documents.projectId, projectId),
      eq(documents.path, decodedPath)
    ),
  });

  if (docByPath) {
    return docByPath;
  }

  throw ApiError.notFound("Document not found");
}

// ============================================================================
// GET /api/projects/[projectId]/documents/[docId]/history - Get commit history
// ============================================================================

async function getHistoryHandler(
  request: NextRequest,
  context: ProjectContext,
  docId: string
) {
  const { project, accessToken } = context;

  if (!db) {
    throw ApiError.internal("Database not configured");
  }

  // Require GitHub for history
  if (!accessToken || !project.githubRepo) {
    throw ApiError.forbidden(
      "GitHub must be connected to view document history"
    );
  }

  const document = await getDocumentRecord(project.id, docId);

  const [owner, repo] = project.githubRepo.split("/");
  const branch = project.githubBranch || "main";

  try {
    const commits = await getCommitHistory(
      accessToken,
      owner,
      repo,
      document.path,
      branch
    );

    return NextResponse.json({
      document: {
        id: document.id,
        path: document.path,
        title: document.title,
      },
      commits,
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    throw ApiError.internal("Failed to fetch document history");
  }
}

// ============================================================================
// Route Export
// ============================================================================

export async function GET(
  request: NextRequest,
  routeContext: DocRouteContext
) {
  const { projectId, docId } = await routeContext.params;

  const handler = withProject(
    (req, ctx) => getHistoryHandler(req, ctx, docId),
    { requireGitHub: true }
  );

  return handler(request, { params: Promise.resolve({ projectId }) });
}
