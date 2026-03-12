import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ApiError,
  type ProjectContext,
  validateBody,
  withProject,
} from "@/lib/api-utils";
import { db, documents } from "@/lib/db";
import {
  ensureUniqueDocumentSlug,
  getDocumentByIdentifier,
} from "@/lib/document-routing";
import { countWords, extractTitle } from "@/lib/editor-utils";
import {
  deleteDocument,
  getDocument,
  isAppInstalled,
  saveDocument,
} from "@/lib/github-app";
import { buildPublicDocumentPath, buildPublicDocumentUrl } from "@/lib/urls";

// ============================================================================
// Schemas
// ============================================================================

const updateDocumentSchema = z.object({
  content: z.string(),
  sha: z.string().nullable().optional(),
  message: z.string().max(200).optional(),
});

const updateDocumentSlugSchema = z.object({
  slug: z.string().trim().min(1, "URL slug is required").max(120),
});

const deleteDocumentSchema = z.object({
  sha: z.string().min(1, "SHA is required"),
});

// ============================================================================
// Route context type with docId
// ============================================================================

interface DocRouteContext {
  params: Promise<{ projectId: string; docId: string }>;
}

// ============================================================================
// GET /api/projects/[projectId]/documents/[docId] - Get document content
// ============================================================================

async function getDocumentHandler(
  request: NextRequest,
  context: ProjectContext,
  docId: string,
) {
  const { project } = context;

  if (!db) {
    throw ApiError.internal("Database not configured");
  }

  const document = await getDocumentByIdentifier(project.id, docId);
  if (!document) {
    throw ApiError.notFound("Document not found");
  }

  // If project has a GitHub repo, fetch content using GitHub App
  if (project.githubRepo) {
    const [owner, repo] = project.githubRepo.split("/");
    const branch = project.githubBranch || "main";

    // Check if GitHub App is installed
    const installed = await isAppInstalled(owner);
    if (!installed) {
      return NextResponse.json({
        document: {
          id: document.id,
          slug: document.slug,
          path: document.path,
          title: document.title,
          wordCount: document.wordCount,
          lastSyncedAt: document.lastSyncedAt,
          publicPath: buildPublicDocumentPath(project, document),
          publicUrl: buildPublicDocumentUrl(
            request.nextUrl.origin,
            project,
            document,
          ),
        },
        content: null as string | null,
        sha: null as string | null,
        needsInstall: true,
        warning: "GitHub App not installed - please install to access content",
      });
    }

    try {
      const documentData = await getDocument(
        owner,
        repo,
        document.path,
        branch,
      );

      return NextResponse.json({
        document: {
          id: document.id,
          slug: document.slug,
          path: document.path,
          title: document.title,
          wordCount: document.wordCount,
          lastSyncedAt: document.lastSyncedAt,
          publicPath: buildPublicDocumentPath(project, document),
          publicUrl: buildPublicDocumentUrl(
            request.nextUrl.origin,
            project,
            document,
          ),
        },
        content: documentData.content,
        sha: documentData.sha,
      });
    } catch (error) {
      console.error("Error fetching from GitHub:", error);
      throw ApiError.internal("Failed to fetch document from GitHub");
    }
  }

  // No GitHub repo configured
  return NextResponse.json({
    document: {
      id: document.id,
      slug: document.slug,
      path: document.path,
      title: document.title,
      wordCount: document.wordCount,
      lastSyncedAt: document.lastSyncedAt,
      publicPath: buildPublicDocumentPath(project, document),
      publicUrl: buildPublicDocumentUrl(
        request.nextUrl.origin,
        project,
        document,
      ),
    },
    content: null as string | null,
    sha: null as string | null,
    warning: "No GitHub repo connected",
  });
}

// ============================================================================
// PUT /api/projects/[projectId]/documents/[docId] - Save document
// ============================================================================

async function saveDocumentHandler(
  request: NextRequest,
  context: ProjectContext,
  docId: string,
) {
  const { project, role, isOwner } = context;

  if (!db) {
    throw ApiError.internal("Database not configured");
  }

  // Check permissions - need at least editor role
  if (!isOwner && role !== "editor" && role !== "admin") {
    throw ApiError.forbidden("You need editor permissions to save documents");
  }

  // Require GitHub repo for saving
  if (!project.githubRepo) {
    throw ApiError.forbidden("No GitHub repo connected to save to");
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
  const body = await validateBody(request, updateDocumentSchema);

  try {
    const newSha = await saveDocument(
      owner,
      repo,
      document.path,
      body.content,
      body.sha || null,
      body.message || `Update ${document.path}`,
      branch,
    );

    // Update local document metadata
    const wordCount = countWords(body.content);
    const title = extractTitle(body.content);

    await db
      .update(documents)
      .set({
        wordCount,
        title: title || document.title,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(documents.id, document.id));

    return NextResponse.json({
      sha: newSha,
      wordCount,
      title: title || document.title,
    });
  } catch (error) {
    console.error("Error saving to GitHub:", error);

    // Check for conflict error
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("conflict")
    ) {
      throw ApiError.conflict(
        "The document has been modified. Please refresh and try again.",
      );
    }

    throw ApiError.internal("Failed to save document");
  }
}

// ============================================================================
// PATCH /api/projects/[projectId]/documents/[docId] - Update document URL slug
// ============================================================================

async function updateDocumentSlugHandler(
  request: NextRequest,
  context: ProjectContext,
  docId: string,
) {
  const { project, role, isOwner } = context;

  if (!db) {
    throw ApiError.internal("Database not configured");
  }

  if (!isOwner && role !== "editor" && role !== "admin") {
    throw ApiError.forbidden(
      "You need editor permissions to update document URLs",
    );
  }

  const document = await getDocumentByIdentifier(project.id, docId);
  if (!document) {
    throw ApiError.notFound("Document not found");
  }

  const body = await validateBody(request, updateDocumentSlugSchema);
  const slug = await ensureUniqueDocumentSlug({
    excludeDocumentId: document.id,
    projectId: project.id,
    value: body.slug,
  });

  if (slug === document.slug) {
    return NextResponse.json({
      document: {
        id: document.id,
        slug: document.slug,
        path: document.path,
        title: document.title,
        wordCount: document.wordCount,
        lastSyncedAt: document.lastSyncedAt,
        publicPath: buildPublicDocumentPath(project, document),
        publicUrl: buildPublicDocumentUrl(
          request.nextUrl.origin,
          project,
          document,
        ),
      },
      publicPath: buildPublicDocumentPath(project, document),
      publicUrl: buildPublicDocumentUrl(
        request.nextUrl.origin,
        project,
        document,
      ),
    });
  }

  const [updatedDocument] = await db
    .update(documents)
    .set({
      slug,
      updatedAt: new Date(),
    })
    .where(eq(documents.id, document.id))
    .returning();

  if (!updatedDocument) {
    throw ApiError.internal("Failed to update document URL");
  }

  return NextResponse.json({
    document: {
      id: updatedDocument.id,
      slug: updatedDocument.slug,
      path: updatedDocument.path,
      title: updatedDocument.title,
      wordCount: updatedDocument.wordCount,
      lastSyncedAt: updatedDocument.lastSyncedAt,
      publicPath: buildPublicDocumentPath(project, updatedDocument),
      publicUrl: buildPublicDocumentUrl(
        request.nextUrl.origin,
        project,
        updatedDocument,
      ),
    },
    publicPath: buildPublicDocumentPath(project, updatedDocument),
    publicUrl: buildPublicDocumentUrl(
      request.nextUrl.origin,
      project,
      updatedDocument,
    ),
  });
}

// ============================================================================
// DELETE /api/projects/[projectId]/documents/[docId] - Delete document
// ============================================================================

async function deleteDocumentHandler(
  request: NextRequest,
  context: ProjectContext,
  docId: string,
) {
  const { project, isOwner } = context;

  if (!db) {
    throw ApiError.internal("Database not configured");
  }

  // Only owners can delete documents
  if (!isOwner) {
    throw ApiError.forbidden("Only the project owner can delete documents");
  }

  const document = await getDocumentByIdentifier(project.id, docId);
  if (!document) {
    throw ApiError.notFound("Document not found");
  }
  const body = await validateBody(request, deleteDocumentSchema);

  // Delete from GitHub if repo is connected
  if (project.githubRepo) {
    const [owner, repo] = project.githubRepo.split("/");
    const branch = project.githubBranch || "main";

    const installed = await isAppInstalled(owner);
    if (installed) {
      try {
        await deleteDocument(owner, repo, document.path, body.sha, branch);
      } catch (error) {
        console.error("Error deleting from GitHub:", error);
        throw ApiError.internal("Failed to delete document from GitHub");
      }
    }
  }

  // Delete from local database
  await db.delete(documents).where(eq(documents.id, document.id));

  return NextResponse.json({ success: true, message: "Document deleted" });
}

// ============================================================================
// Route Exports with proper parameter handling
// ============================================================================

export async function GET(request: NextRequest, routeContext: DocRouteContext) {
  const { projectId, docId } = await routeContext.params;

  // Create a handler that uses withProject and passes docId
  const handler = withProject((req, ctx) =>
    getDocumentHandler(req, ctx, docId),
  );

  return handler(request, { params: Promise.resolve({ projectId }) });
}

export async function PUT(request: NextRequest, routeContext: DocRouteContext) {
  const { projectId, docId } = await routeContext.params;

  const handler = withProject(
    (req, ctx) => saveDocumentHandler(req, ctx, docId),
    { minRole: "editor" },
  );

  return handler(request, { params: Promise.resolve({ projectId }) });
}

export async function PATCH(
  request: NextRequest,
  routeContext: DocRouteContext,
) {
  const { projectId, docId } = await routeContext.params;

  const handler = withProject(
    (req, ctx) => updateDocumentSlugHandler(req, ctx, docId),
    { minRole: "editor" },
  );

  return handler(request, { params: Promise.resolve({ projectId }) });
}

export async function DELETE(
  request: NextRequest,
  routeContext: DocRouteContext,
) {
  const { projectId, docId } = await routeContext.params;

  const handler = withProject(
    (req, ctx) => deleteDocumentHandler(req, ctx, docId),
    { requireOwner: true },
  );

  return handler(request, { params: Promise.resolve({ projectId }) });
}
