import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  db,
  documents,
  projectCollaborators,
  projects,
  writingSessions,
} from "@/lib/db";
import { markdownToLexical } from "@/lib/editor-utils";
import { getDocument, isAppInstalled } from "@/lib/github-app";
import { injectMarkdownIntoLiveblocksRoom } from "@/lib/liveblocks-server";
import { createSession, createShareLink, updateSession } from "@/lib/session";
import { SharedSessionView } from "../../../s/[slug]/SharedSessionView";

interface EditorPageProps {
  params: Promise<{
    projectId: string;
    docId: string;
  }>;
}

function hasGitHubBackedSource(githubRepo: string | null): githubRepo is string {
  return !!(
    githubRepo &&
    githubRepo.includes("/") &&
    !githubRepo.startsWith("__NEW__")
  );
}

function getSessionSourceKeys(
  projectId: string,
  githubRepo: string | null,
  docPath: string,
  docId: string,
) {
  if (hasGitHubBackedSource(githubRepo)) {
    return {
      sourceRepo: githubRepo,
      sourcePath: docPath,
    };
  }

  return {
    sourceRepo: `project:${projectId}`,
    sourcePath: `document:${docId}`,
  };
}

async function loadInitialDocumentContent(params: {
  githubRepo: string | null;
  githubBranch: string | null;
  path: string;
  draftContent: string | null;
}): Promise<{ markdown: string; lastGithubSha: string | null }> {
  if (params.draftContent) {
    return {
      markdown: params.draftContent,
      lastGithubSha: null,
    };
  }

  if (!hasGitHubBackedSource(params.githubRepo)) {
    return {
      markdown: "",
      lastGithubSha: null,
    };
  }

  const [owner, repo] = params.githubRepo.split("/");
  const installed = await isAppInstalled(owner);

  if (!installed) {
    return {
      markdown: "",
      lastGithubSha: null,
    };
  }

  try {
    const document = await getDocument(
      owner,
      repo,
      params.path,
      params.githubBranch || "main",
    );

    return {
      markdown: document.content,
      lastGithubSha: document.sha,
    };
  } catch (error) {
    console.error("Failed to load GitHub document for shared session:", error);
    return {
      markdown: "",
      lastGithubSha: null,
    };
  }
}

export default async function EditorPage({ params }: EditorPageProps) {
  const { projectId, docId } = await params;
  const authSession = await auth();

  if (!db) {
    notFound();
  }

  const project = await db.query.projects.findFirst({
    where: eq(projects.slug, projectId),
  });

  if (!project) {
    notFound();
  }

  const document = await db.query.documents.findFirst({
    where: and(eq(documents.id, docId), eq(documents.projectId, project.id)),
  });

  if (!document) {
    notFound();
  }

  const { sourceRepo, sourcePath } = getSessionSourceKeys(
    project.id,
    project.githubRepo,
    document.path,
    document.id,
  );

  let projectDocSession = await db.query.writingSessions.findFirst({
    where: and(
      eq(writingSessions.githubRepo, sourceRepo),
      eq(writingSessions.githubPath, sourcePath),
    ),
  });

  if (!projectDocSession) {
    const initialContent = await loadInitialDocumentContent({
      githubRepo: project.githubRepo,
      githubBranch: project.githubBranch,
      path: document.path,
      draftContent: document.draftContent,
    });

    const createdSession = await createSession({
      title:
        document.title ||
        document.path.split("/").pop()?.replace(/\.md$/, "") ||
        "Untitled",
      type: "book",
      content: JSON.stringify(markdownToLexical(initialContent.markdown)),
    });

    const updatedSession = await updateSession(createdSession.id, {
      githubRepo: sourceRepo,
      githubPath: sourcePath,
      lastGithubSha:
        hasGitHubBackedSource(project.githubRepo)
          ? document.lastCommitSha ?? initialContent.lastGithubSha
          : null,
    });

    if (!updatedSession) {
      notFound();
    }

    const sharedSession = await createShareLink(updatedSession.id);
    projectDocSession = sharedSession ?? updatedSession;

    await injectMarkdownIntoLiveblocksRoom(
      projectDocSession.id,
      initialContent.markdown,
    );
  } else if (!projectDocSession.shareSlug) {
    projectDocSession =
      (await createShareLink(projectDocSession.id)) ?? projectDocSession;
  }

  let canCommitToGitHub = false;

  if (hasGitHubBackedSource(project.githubRepo) && authSession?.user?.id) {
    if (project.userId === authSession.user.id) {
      canCommitToGitHub = true;
    } else {
      const collaborator = await db.query.projectCollaborators.findFirst({
        where: and(
          eq(projectCollaborators.projectId, project.id),
          eq(projectCollaborators.userId, authSession.user.id),
        ),
      });

      canCommitToGitHub =
        collaborator?.role === "editor" || collaborator?.role === "admin";
    }
  }

  const serializedSession = {
    id: projectDocSession.id,
    title: projectDocSession.title,
    type: projectDocSession.type ?? "book",
    content: projectDocSession.content,
    formatConfig: projectDocSession.formatConfig as Record<string, unknown> | null,
    passwordProtected: !!projectDocSession.passwordHash,
    createdAt: projectDocSession.createdAt.toISOString(),
    updatedAt: projectDocSession.updatedAt.toISOString(),
  };

  return (
    <SharedSessionView
      session={serializedSession}
      canCommitToGitHub={canCommitToGitHub}
    />
  );
}
