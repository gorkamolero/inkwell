import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import {
  withProject,
  validateBody,
  ApiError,
  generateId,
  type ProjectContext,
} from "@/lib/api-utils";
import { db, documents } from "@/lib/db";
import {
  listDocuments,
  listDocumentsInPath,
  saveDocument,
} from "@/lib/github";
import { canAddDocument } from "@/lib/subscription";

// ============================================================================
// Schemas
// ============================================================================

const createDocumentSchema = z.object({
  path: z
    .string()
    .min(1, "Path is required")
    .max(500, "Path must be 500 characters or less")
    .regex(/\.md$/, "Document must be a markdown file (.md)"),
  title: z.string().max(200).optional(),
  content: z.string().optional(),
});

// ============================================================================
// GET /api/projects/[projectId]/documents - List documents
// ============================================================================

async function listDocumentsHandler(
  request: NextRequest,
  { project, accessToken }: ProjectContext
) {
  if (!db) {
    throw ApiError.internal("Database not configured");
  }

  // Get documents from local database first
  const localDocs = await db.query.documents.findMany({
    where: eq(documents.projectId, project.id),
    columns: {
      id: true,
      path: true,
      title: true,
      wordCount: true,
      lastSyncedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // If GitHub is connected and project has a repo, sync from GitHub
  let githubDocs: Array<{ path: string; name: string; sha: string }> = [];

  if (accessToken && project.githubRepo) {
    const [owner, repo] = project.githubRepo.split("/");
    const branch = project.githubBranch || "main";

    try {
      if (project.chaptersPath) {
        githubDocs = await listDocumentsInPath(
          accessToken,
          owner,
          repo,
          project.chaptersPath,
          branch
        );
      } else {
        githubDocs = await listDocuments(accessToken, owner, repo, branch);
      }

      // Merge GitHub docs with local docs
      const localDocPaths = new Set(localDocs.map((d) => d.path));
      const now = new Date();

      for (const ghDoc of githubDocs) {
        if (!localDocPaths.has(ghDoc.path)) {
          // Insert new document into local database
          const docId = generateId();
          await db.insert(documents).values({
            id: docId,
            projectId: project.id,
            path: ghDoc.path,
            title: ghDoc.name.replace(/\.md$/, ""),
            lastSyncedAt: now,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      // Re-fetch local docs after sync
      const updatedDocs = await db.query.documents.findMany({
        where: eq(documents.projectId, project.id),
        columns: {
          id: true,
          path: true,
          title: true,
          wordCount: true,
          lastSyncedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Add SHA info from GitHub
      const docsWithSha = updatedDocs.map((doc) => {
        const ghDoc = githubDocs.find((g) => g.path === doc.path);
        return {
          ...doc,
          sha: ghDoc?.sha,
          existsOnGitHub: !!ghDoc,
        };
      });

      return NextResponse.json({ documents: docsWithSha });
    } catch (error) {
      console.error("Error syncing with GitHub:", error);
      // Return local docs if GitHub sync fails
      return NextResponse.json({
        documents: localDocs.map((doc) => ({
          ...doc,
          existsOnGitHub: false,
        })),
        warning: "Failed to sync with GitHub",
      });
    }
  }

  // No GitHub connected, return local docs only
  return NextResponse.json({
    documents: localDocs.map((doc) => ({
      ...doc,
      existsOnGitHub: false,
    })),
  });
}

export const GET = withProject(listDocumentsHandler);

// ============================================================================
// POST /api/projects/[projectId]/documents - Create document
// ============================================================================

async function createDocumentHandler(
  request: NextRequest,
  { project, accessToken, role, isOwner }: ProjectContext
) {
  if (!db) {
    throw ApiError.internal("Database not configured");
  }

  // Check permissions - need at least editor role
  if (!isOwner && role !== "editor" && role !== "admin") {
    throw ApiError.forbidden("You need editor permissions to create documents");
  }

  // Check subscription limits
  const canAdd = await canAddDocument(project.id);
  if (!canAdd) {
    throw ApiError.limitExceeded(
      "You have reached your document limit for this project. Please upgrade your plan."
    );
  }

  const body = await validateBody(request, createDocumentSchema);

  // Build the full path
  let fullPath = body.path;
  if (project.chaptersPath && !body.path.startsWith(project.chaptersPath)) {
    fullPath = `${project.chaptersPath}/${body.path}`.replace(/\/+/g, "/");
  }

  // Check if document already exists
  const existingDoc = await db.query.documents.findFirst({
    where: eq(documents.path, fullPath),
  });

  if (existingDoc && existingDoc.projectId === project.id) {
    throw ApiError.conflict("A document with this path already exists");
  }

  // If GitHub is connected with a valid repo, create the file on GitHub
  let sha: string | undefined;
  const content = body.content || `# ${body.title || "New Document"}\n`;

  const hasValidGitHubRepo = accessToken && project.githubRepo && 
    project.githubRepo.includes("/") && 
    !project.githubRepo.startsWith("__NEW__");

  if (hasValidGitHubRepo) {
    const [owner, repo] = project.githubRepo!.split("/");
    const branch = project.githubBranch || "main";

    try {
      sha = await saveDocument(
        accessToken,
        owner,
        repo,
        fullPath,
        content,
        null, // null sha for new file
        `Create ${fullPath}`,
        branch
      );
    } catch (error) {
      console.error("Error creating document on GitHub:", error);
      throw ApiError.internal("Failed to create document on GitHub");
    }
  }

  // Create document in local database
  const docId = generateId();
  const now = new Date();

  const [newDocument] = await db
    .insert(documents)
    .values({
      id: docId,
      projectId: project.id,
      path: fullPath,
      title: body.title || fullPath.split("/").pop()?.replace(/\.md$/, ""),
      wordCount: content.split(/\s+/).filter(Boolean).length,
      lastCommitSha: sha || null,
      lastSyncedAt: sha ? now : null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return NextResponse.json(
    {
      document: {
        ...newDocument,
        sha,
        existsOnGitHub: !!sha,
      },
    },
    { status: 201 }
  );
}

export const POST = withProject(createDocumentHandler, { minRole: "editor" });
