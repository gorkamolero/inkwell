import { and, eq } from "drizzle-orm";
import { Octokit } from "@octokit/rest";
import { notFound, unstable_rethrow } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  db,
  documents,
  projectCollaborators,
  projects,
  writingSessions,
} from "@/lib/db";
import { isEditorStateEmpty, markdownToLexical } from "@/lib/editor-utils";
import { getDocument, isAppInstalled } from "@/lib/github-app";
import {
  injectMarkdownIntoLiveblocksRoom,
  resetLiveblocksRoomWithMarkdown,
} from "@/lib/liveblocks-server";
import { createSession, createShareLink, updateSession } from "@/lib/session";
import { SharedSessionView } from "../../../s/[slug]/SharedSessionView";

interface EditorPageProps {
  params: Promise<{
    projectId: string;
    docId: string;
  }>;
}

function RepoDocError({
  projectId,
  docId,
  error,
}: {
  projectId: string;
  docId: string;
  error: unknown;
}) {
  const message =
    error instanceof Error ? error.message : "Unknown server exception";

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-3xl border-4 border-black bg-white p-8 shadow-[8px_8px_0_0_#000]">
        <div className="mb-4 inline-block border-3 border-black bg-brutal-red px-3 py-1 font-black uppercase tracking-wide text-white">
          Exception
        </div>

        <h1 className="mb-4 text-3xl font-black text-black">
          Repo Document Failed To Load
        </h1>

        <p className="mb-6 text-gray-700">
          The shared repo document route threw an exception while loading this page.
        </p>

        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <div className="border-2 border-black bg-gray-50 p-3">
            <div className="text-xs font-bold uppercase text-gray-500">Project</div>
            <div className="font-mono text-sm text-black">{projectId}</div>
          </div>
          <div className="border-2 border-black bg-gray-50 p-3">
            <div className="text-xs font-bold uppercase text-gray-500">Document</div>
            <div className="font-mono text-sm text-black">{docId}</div>
          </div>
        </div>

        <div className="border-3 border-black bg-black p-4 text-sm text-white">
          <div className="mb-2 text-xs font-bold uppercase text-gray-300">
            Exception Message
          </div>
          <pre className="whitespace-pre-wrap break-words font-mono">{message}</pre>
        </div>
      </div>
    </div>
  );
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

  try {
    const installed = await isAppInstalled(owner);

    if (installed) {
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
    }
  } catch (error) {
    console.error("Failed to load GitHub App document for shared session:", error);
  }

  try {
    const octokit = new Octokit();
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: params.path,
      ref: params.githubBranch || "main",
    });

    if (Array.isArray(data) || data.type !== "file" || !("content" in data)) {
      throw new Error("Expected file content, received non-file GitHub object");
    }

    return {
      markdown: Buffer.from(data.content, "base64").toString("utf8"),
      lastGithubSha: data.sha,
    };
  } catch (error) {
    console.error("Failed to load public GitHub document for shared session:", error);
    return {
      markdown: "",
      lastGithubSha: null,
    };
  }
}

function sessionContentIsEmpty(content: string | null): boolean {
  if (!content) {
    return true;
  }

  try {
    return isEditorStateEmpty(JSON.parse(content));
  } catch {
    return content.trim().length === 0;
  }
}

export default async function EditorPage({ params }: EditorPageProps) {
  const { projectId, docId } = await params;
  try {
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

      if (
        hasGitHubBackedSource(project.githubRepo) &&
        !document.draftContent &&
        !initialContent.markdown.trim()
      ) {
        throw new Error(
          `Unable to load repo document content for ${project.githubRepo}/${document.path}`,
        );
      }

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

    if (
      sessionContentIsEmpty(projectDocSession.content) &&
      hasGitHubBackedSource(project.githubRepo) &&
      !document.draftContent
    ) {
      const recoveredContent = await loadInitialDocumentContent({
        githubRepo: project.githubRepo,
        githubBranch: project.githubBranch,
        path: document.path,
        draftContent: document.draftContent,
      });

      if (recoveredContent.markdown.trim()) {
        const recoveredSession = await updateSession(projectDocSession.id, {
          title:
            document.title ||
            document.path.split("/").pop()?.replace(/\.md$/, "") ||
            projectDocSession.title,
          content: JSON.stringify(markdownToLexical(recoveredContent.markdown)),
          githubRepo: sourceRepo,
          githubPath: sourcePath,
          lastGithubSha:
            document.lastCommitSha ?? recoveredContent.lastGithubSha ?? null,
        });

        if (recoveredSession) {
          await resetLiveblocksRoomWithMarkdown(
            recoveredSession.id,
            recoveredContent.markdown,
          );
          projectDocSession = recoveredSession;
        }
      }
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
  } catch (error) {
    unstable_rethrow(error);
    console.error("[repo-doc-page] failed to load", { projectId, docId, error });
    return <RepoDocError projectId={projectId} docId={docId} error={error} />;
  }
}
