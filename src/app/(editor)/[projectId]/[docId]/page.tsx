import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db, documents, projects, projectCollaborators, accounts } from "@/lib/db";
import { eq, and, or } from "drizzle-orm";
import { LazyDocumentEditor } from "@/components/editor/LazyEditor";
import { getDocument } from "@/lib/github";

interface EditorPageProps {
  params: Promise<{
    projectId: string;
    docId: string;
  }>;
}

export default async function EditorPage({ params }: EditorPageProps) {
  const { projectId, docId } = await params;
  const session = await auth();

  if (!session?.user?.id || !db) {
    notFound();
  }

  // Get user's GitHub access token
  const userAccount = await db
    .select({ accessToken: accounts.access_token })
    .from(accounts)
    .where(
      and(eq(accounts.userId, session.user.id), eq(accounts.provider, "github"))
    )
    .limit(1);

  const accessToken = userAccount[0]?.accessToken;

  if (!accessToken) {
    // User doesn't have GitHub connected
    notFound();
  }

  // Check project access - owner or public
  let project = await db.query.projects.findFirst({
    where: or(
      and(eq(projects.slug, projectId), eq(projects.userId, session.user.id)),
      and(eq(projects.slug, projectId), eq(projects.isPublic, true))
    ),
  });

  if (!project) {
    // Check if user is a collaborator
    const projectBySlug = await db.query.projects.findFirst({
      where: eq(projects.slug, projectId),
    });

    if (projectBySlug) {
      const collaboration = await db.query.projectCollaborators.findFirst({
        where: and(
          eq(projectCollaborators.userId, session.user.id),
          eq(projectCollaborators.projectId, projectBySlug.id)
        ),
      });

      if (collaboration) {
        project = projectBySlug;
      }
    }

    if (!project) {
      notFound();
    }
  }

  // Get the document from our database
  const documentPath = decodeURIComponent(docId);
  const document = await db.query.documents.findFirst({
    where: and(
      eq(documents.path, documentPath),
      eq(documents.projectId, project.id)
    ),
  });

  if (!document) {
    notFound();
  }

  // Project must have a GitHub repo connected
  if (!project.githubRepo) {
    notFound();
  }

  // Parse GitHub repo info
  const [owner, repo] = project.githubRepo.split("/");
  const branch = project.githubBranch || "main";

  // Fetch document content from GitHub
  let content: string;
  let sha: string;

  try {
    const documentData = await getDocument(
      accessToken,
      owner,
      repo,
      document.path,
      branch
    );
    content = documentData.content;
    sha = documentData.sha;
  } catch (error) {
    console.error("Failed to fetch document from GitHub:", error);
    // Return a fallback for new or inaccessible documents
    content = "";
    sha = "";
  }

  // Extract title from document path or content
  const documentTitle =
    document.title ||
    document.path.split("/").pop()?.replace(/\.md$/, "") ||
    "Untitled";

  return (
    <LazyDocumentEditor
      projectId={project.id}
      projectName={project.name}
      projectSlug={project.slug}
      documentPath={document.path}
      documentTitle={documentTitle}
      initialContent={content}
      initialSha={sha}
    />
  );
}
