import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import type { Document, Project } from "@/lib/db/schema";

const columnSupportCache = new Map<string, Promise<boolean>>();

type ProjectRow = {
  id: string;
  name: string;
  slug: string;
  publicSlug: string | null;
  description: string | null;
  githubRepo: string | null;
  githubBranch: string | null;
  chaptersPath: string | null;
  isPublic: boolean | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

type DocumentRow = {
  id: string;
  projectId: string;
  slug: string | null;
  path: string;
  title: string | null;
  draftContent: string | null;
  lastSyncedAt: Date | null;
  lastCommitSha: string | null;
  wordCount: number | null;
  createdAt: Date;
  updatedAt: Date;
};

async function hasColumn(
  tableName: string,
  columnName: string,
): Promise<boolean> {
  if (!db) {
    throw new Error("Database not configured");
  }

  const cacheKey = `${tableName}.${columnName}`;
  const cached = columnSupportCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const promise = db
    .execute<{ exists: boolean }>(sql`
      select exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = ${tableName}
          and column_name = ${columnName}
      ) as "exists"
    `)
    .then((rows) => Boolean(rows[0]?.exists));

  columnSupportCache.set(cacheKey, promise);
  return promise;
}

function normalizeProject(row: ProjectRow | undefined): Project | null {
  if (!row) {
    return null;
  }

  return {
    ...row,
    publicSlug: row.publicSlug ?? row.slug,
  };
}

function normalizeDocument(row: DocumentRow | undefined): Document | null {
  if (!row) {
    return null;
  }

  return {
    ...row,
    slug: row.slug ?? row.id,
  };
}

async function findProjectBySql(whereClause: ReturnType<typeof sql>) {
  if (!db) {
    throw new Error("Database not configured");
  }

  const supportsPublicSlug = await hasColumn("projects", "public_slug");
  const rows = await db.execute<ProjectRow>(sql`
    select
      id,
      name,
      slug,
      ${supportsPublicSlug ? sql`public_slug` : sql`null`} as "publicSlug",
      description,
      github_repo as "githubRepo",
      github_branch as "githubBranch",
      chapters_path as "chaptersPath",
      is_public as "isPublic",
      user_id as "userId",
      created_at as "createdAt",
      updated_at as "updatedAt"
    from projects
    where ${whereClause}
    limit 1
  `);

  return normalizeProject(rows[0]);
}

async function findDocumentBySql(whereClause: ReturnType<typeof sql>) {
  if (!db) {
    throw new Error("Database not configured");
  }

  const supportsSlug = await hasColumn("documents", "slug");
  const rows = await db.execute<DocumentRow>(sql`
    select
      id,
      project_id as "projectId",
      ${supportsSlug ? sql`slug` : sql`null`} as "slug",
      path,
      title,
      draft_content as "draftContent",
      last_synced_at as "lastSyncedAt",
      last_commit_sha as "lastCommitSha",
      word_count as "wordCount",
      created_at as "createdAt",
      updated_at as "updatedAt"
    from documents
    where ${whereClause}
    limit 1
  `);

  return normalizeDocument(rows[0]);
}

export async function findProjectByRouteSegmentCompat(routeSegment: string) {
  const supportsPublicSlug = await hasColumn("projects", "public_slug");

  if (supportsPublicSlug) {
    const project = await findProjectBySql(sql`public_slug = ${routeSegment}`);
    if (project) {
      return project;
    }
  }

  const byInternalSlug = await findProjectBySql(sql`slug = ${routeSegment}`);
  if (byInternalSlug) {
    return byInternalSlug;
  }

  return findProjectBySql(sql`id = ${routeSegment}`);
}

export async function getProjectByIdentifierCompat(identifier: string) {
  const supportsPublicSlug = await hasColumn("projects", "public_slug");

  if (supportsPublicSlug) {
    const project = await findProjectBySql(
      sql`id = ${identifier} or slug = ${identifier} or public_slug = ${identifier}`,
    );
    if (project) {
      return project;
    }
  }

  return findProjectBySql(sql`id = ${identifier} or slug = ${identifier}`);
}

export async function getProjectByIdCompat(projectId: string) {
  return findProjectBySql(sql`id = ${projectId}`);
}

export async function getDocumentByIdentifierCompat(
  projectId: string,
  identifier: string,
) {
  const supportsSlug = await hasColumn("documents", "slug");

  const document = supportsSlug
    ? await findDocumentBySql(
        sql`project_id = ${projectId} and (id = ${identifier} or slug = ${identifier})`,
      )
    : await findDocumentBySql(
        sql`project_id = ${projectId} and id = ${identifier}`,
      );

  if (document) {
    return document;
  }

  const decodedPath = decodeURIComponent(identifier);
  return findDocumentBySql(
    sql`project_id = ${projectId} and path = ${decodedPath}`,
  );
}

export async function getDocumentByIdCompat(documentId: string) {
  return findDocumentBySql(sql`id = ${documentId}`);
}
