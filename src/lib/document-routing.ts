import { and, eq, or } from "drizzle-orm";
import { ApiError } from "@/lib/api-utils";
import { db, documents, projects } from "@/lib/db";
import {
  addNumericSlugSuffix,
  generateDocumentSlug,
  generateProjectPublicSlugBase,
} from "@/lib/slugs";

export async function findProjectByRouteSegment(routeSegment: string) {
  if (!db) {
    throw ApiError.internal("Database not configured");
  }

  const byPublicSlug = await db.query.projects.findFirst({
    where: eq(projects.publicSlug, routeSegment),
  });
  if (byPublicSlug) {
    return byPublicSlug;
  }

  const byInternalSlug = await db.query.projects.findFirst({
    where: eq(projects.slug, routeSegment),
  });
  if (byInternalSlug) {
    return byInternalSlug;
  }

  return db.query.projects.findFirst({
    where: eq(projects.id, routeSegment),
  });
}

export async function getDocumentByIdentifier(
  projectId: string,
  identifier: string,
) {
  if (!db) {
    throw ApiError.internal("Database not configured");
  }

  const document = await db.query.documents.findFirst({
    where: and(
      eq(documents.projectId, projectId),
      or(eq(documents.id, identifier), eq(documents.slug, identifier)),
    ),
  });

  if (document) {
    return document;
  }

  const decodedPath = decodeURIComponent(identifier);
  return db.query.documents.findFirst({
    where: and(
      eq(documents.projectId, projectId),
      eq(documents.path, decodedPath),
    ),
  });
}

export async function getDocumentById(documentId: string) {
  if (!db) {
    throw ApiError.internal("Database not configured");
  }

  return db.query.documents.findFirst({
    where: eq(documents.id, documentId),
  });
}

export async function ensureUniqueProjectPublicSlug(params: {
  excludeProjectId?: string;
  value: string;
}) {
  if (!db) {
    throw ApiError.internal("Database not configured");
  }

  const base = generateProjectPublicSlugBase(params.value);

  for (let suffix = 1; ; suffix += 1) {
    const candidate = suffix === 1 ? base : addNumericSlugSuffix(base, suffix);
    const existing = await db.query.projects.findFirst({
      where: eq(projects.publicSlug, candidate),
    });

    if (!existing || existing.id === params.excludeProjectId) {
      return candidate;
    }
  }
}

export async function ensureUniqueDocumentSlug(params: {
  excludeDocumentId?: string;
  path?: string | null;
  projectId: string;
  title?: string | null;
  value?: string | null;
}) {
  if (!db) {
    throw ApiError.internal("Database not configured");
  }

  const base = generateDocumentSlug({
    path: params.path,
    title: params.value ?? params.title,
  });

  for (let suffix = 1; ; suffix += 1) {
    const candidate = suffix === 1 ? base : addNumericSlugSuffix(base, suffix);
    const existing = await db.query.documents.findFirst({
      where: and(
        eq(documents.projectId, params.projectId),
        eq(documents.slug, candidate),
      ),
    });

    if (!existing || existing.id === params.excludeDocumentId) {
      return candidate;
    }
  }
}
