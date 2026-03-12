const RESERVED_PROJECT_SEGMENTS = new Set([
  "_next",
  "api",
  "favicon.ico",
  "login",
  "pricing",
  "projects",
  "robots.txt",
  "s",
  "sessions",
  "signup",
  "sitemap.xml",
  "test",
]);

const RESERVED_DOCUMENT_SEGMENTS = new Set(["new"]);

function normalizeSlug(value: string, fallback: string): string {
  const slug = generateSlug(value);
  return slug || fallback;
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function addNumericSlugSuffix(base: string, suffix: number): string {
  return `${base}-${suffix}`;
}

export function generateProjectPublicSlugBase(nameOrSlug: string): string {
  const base = normalizeSlug(nameOrSlug, "project");
  return RESERVED_PROJECT_SEGMENTS.has(base) ? `${base}-project` : base;
}

function getFilenameStem(path: string): string {
  const filename = path.split("/").pop() || path;
  return filename.replace(/\.md$/i, "").replace(/^\d+[-_\s]?/, "");
}

export function generateDocumentSlug(input: {
  path?: string | null;
  title?: string | null;
}): string {
  const source = input.title?.trim() || (input.path ? getFilenameStem(input.path) : "");
  const base = normalizeSlug(source, "document");
  return RESERVED_DOCUMENT_SEGMENTS.has(base) ? "document" : base;
}

