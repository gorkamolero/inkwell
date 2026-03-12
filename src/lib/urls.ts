type ProjectRouteRef = {
  publicSlug?: string | null;
  slug: string;
};

type DocumentRouteRef = {
  id?: string;
  slug?: string | null;
};

export function getProjectPublicSegment(project: ProjectRouteRef): string {
  return project.publicSlug || project.slug;
}

export function getDocumentPublicSegment(document: DocumentRouteRef): string {
  return document.slug || document.id || "";
}

export function buildPublicDocumentPath(
  project: ProjectRouteRef,
  document: DocumentRouteRef,
): string {
  return `/${getProjectPublicSegment(project)}/${getDocumentPublicSegment(document)}`;
}

export function buildPublicDocumentUrl(
  baseUrl: string,
  project: ProjectRouteRef,
  document: DocumentRouteRef,
): string {
  return new URL(buildPublicDocumentPath(project, document), baseUrl).toString();
}

