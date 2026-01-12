import { eq } from "drizzle-orm";
import {
  ArrowLeft,
  Clock,
  Edit3,
  ExternalLink,
  FileText,
  Github,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SyncButton } from "@/components/dashboard/SyncButton";
import { auth } from "@/lib/auth";
import { db, projectCollaborators, projects } from "@/lib/db";
import { cn } from "@/lib/utils";

interface ProjectPageProps {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export async function generateMetadata({ params }: ProjectPageProps) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  return {
    title: project ? `${project.name} - Hotpress` : "Project - Hotpress",
    description: project?.description ?? "Manage your project",
  };
}

async function getProject(slugOrId: string) {
  if (!db) return null;

  return db.query.projects.findFirst({
    where: eq(projects.slug, slugOrId),
    with: {
      documents: {
        orderBy: (documents, { asc }) => [asc(documents.path)],
      },
    },
  });
}

export default async function ProjectPage({
  params,
  searchParams,
}: ProjectPageProps) {
  const { projectId } = await params;
  const { tab = "documents" } = await searchParams;

  const session = await auth();

  if (!session?.user?.id) {
    notFound();
  }

  const project = await getProject(projectId);

  if (!project) {
    notFound();
  }

  // Check ownership (TODO: Add collaborator access check)
  if (project.userId !== session.user.id) {
    notFound();
  }

  const tabs = [
    { id: "documents", label: "Documents", icon: FileText },
    { id: "collaborators", label: "Collaborators", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div>
      {/* Back Link */}
      <Link
        href="/projects"
        className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-black"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      {/* Project Header */}
      <div className="mb-8 border-3 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black text-black">{project.name}</h1>
            {project.description && (
              <p className="mt-2 text-gray-600">{project.description}</p>
            )}

            {/* Metadata */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
              {project.githubRepo && (
                <a
                  href={`https://github.com/${project.githubRepo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 font-medium text-gray-700 hover:text-black hover:underline"
                >
                  <Github className="h-4 w-4" />
                  {project.githubRepo}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <span className="flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                {project.documents.length} documents
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                Updated {formatDate(project.updatedAt)}
              </span>
            </div>
          </div>

          <Link
            href={`/projects/${project.slug}/edit`}
            className="flex items-center gap-2 border-3 border-black bg-white px-4 py-2 font-bold text-black transition-all hover:bg-gray-100"
          >
            <Edit3 className="h-4 w-4" />
            Edit
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b-3 border-black">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={`/projects/${project.slug}?tab=${t.id}`}
            className={cn(
              "flex items-center gap-2 border-3 border-b-0 px-6 py-3 font-bold transition-colors",
              tab === t.id
                ? "border-black bg-brutal-yellow text-black"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-black",
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </Link>
        ))}
      </div>

      {/* Tab Content */}
      <Suspense fallback={<TabContentSkeleton />}>
        {tab === "documents" && <DocumentsTab project={project} />}
        {tab === "collaborators" && <CollaboratorsTab projectId={project.id} />}
        {tab === "settings" && <SettingsTab project={project} />}
      </Suspense>
    </div>
  );
}

// Documents Tab
interface DocumentsTabProps {
  project: {
    id: string;
    slug: string;
    githubRepo: string | null;
    documents: Array<{
      id: string;
      path: string;
      title: string | null;
      wordCount: number | null;
      updatedAt: Date;
    }>;
  };
}

function DocumentsTab({ project }: DocumentsTabProps) {
  if (project.documents.length === 0) {
    return (
      <div className="border-3 border-dashed border-gray-300 bg-white p-12 text-center">
        <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <h3 className="mb-2 text-xl font-black text-black">No documents yet</h3>
        <p className="mx-auto mb-6 max-w-md text-gray-600">
          {project.githubRepo
            ? "Sync documents from your GitHub repository to get started."
            : "Create your first document to get started."}
        </p>
        <div className="flex justify-center gap-4">
          {project.githubRepo && <SyncButton projectSlug={project.slug} />}
          <Link
            href={`/${project.slug}/new`}
            className="inline-flex items-center gap-2 border-3 border-black bg-brutal-yellow px-6 py-3 font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
          >
            <Plus className="h-5 w-5" strokeWidth={3} />
            New Document
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="border-3 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 border-b-3 border-black bg-gray-100 px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-700">
        <div className="col-span-6">Document</div>
        <div className="col-span-2">Words</div>
        <div className="col-span-3">Last Updated</div>
        <div className="col-span-1"></div>
      </div>

      {/* Table Body */}
      <div className="divide-y-2 divide-gray-100">
        {project.documents.map((doc) => (
          <Link
            key={doc.id}
            href={`/${project.slug}/${doc.id}`}
            className="grid grid-cols-12 items-center gap-4 px-4 py-4 transition-colors hover:bg-gray-50"
          >
            <div className="col-span-6 flex items-center gap-3">
              <FileText className="h-5 w-5 text-gray-400" />
              <span className="font-bold text-black">
                {doc.title ?? getFilename(doc.path)}
              </span>
            </div>
            <div className="col-span-2 text-sm text-gray-600">
              {doc.wordCount ? `${doc.wordCount.toLocaleString()} words` : "-"}
            </div>
            <div className="col-span-3 text-sm text-gray-500">
              {formatDate(doc.updatedAt)}
            </div>
            <div className="col-span-1 text-right">
              <Edit3 className="inline-block h-4 w-4 text-gray-400" />
            </div>
          </Link>
        ))}
      </div>

      {/* Footer with Add Document button */}
      <div className="flex items-center justify-between border-t-3 border-black p-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/${project.slug}/new`}
            className="inline-flex items-center gap-2 border-3 border-black bg-brutal-yellow px-4 py-2 font-bold text-black transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
          >
            <Plus className="h-4 w-4" strokeWidth={3} />
            New Document
          </Link>
        </div>
        {project.githubRepo && <SyncButton projectSlug={project.slug} />}
      </div>
    </div>
  );
}

// Collaborators Tab
async function CollaboratorsTab({ projectId }: { projectId: string }) {
  if (!db) return null;

  const collaborators = await db.query.projectCollaborators.findMany({
    where: eq(projectCollaborators.projectId, projectId),
    with: {
      user: true,
    },
  });

  return (
    <div className="border-3 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-black text-black">Collaborators</h2>
        <button className="flex items-center gap-2 border-3 border-black bg-brutal-yellow px-4 py-2 font-bold text-black transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <Plus className="h-4 w-4" strokeWidth={3} />
          Invite
        </button>
      </div>

      {collaborators.length === 0 ? (
        <div className="border-3 border-dashed border-gray-300 p-8 text-center">
          <Users className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 font-bold text-black">No collaborators yet</h3>
          <p className="text-sm text-gray-600">
            Invite team members to collaborate on this project.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {collaborators.map((collab) => (
            <div
              key={collab.id}
              className="flex items-center justify-between border-2 border-gray-200 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center border-2 border-black bg-gray-200 font-bold">
                  {collab.user.name?.charAt(0) ?? "U"}
                </div>
                <div>
                  <p className="font-bold text-black">{collab.user.name}</p>
                  <p className="text-sm text-gray-500">{collab.user.email}</p>
                </div>
              </div>
              <span className="border-2 border-black bg-gray-100 px-2 py-1 text-xs font-bold uppercase text-gray-700">
                {collab.role}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Settings Tab
interface SettingsTabProps {
  project: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    githubRepo: string | null;
    githubBranch: string | null;
    chaptersPath: string | null;
    isPublic: boolean | null;
  };
}

function SettingsTab({ project }: SettingsTabProps) {
  return (
    <div className="space-y-6">
      {/* General Settings */}
      <div className="border-3 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="mb-6 text-xl font-black text-black">General Settings</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 border-b-2 border-gray-100 pb-4">
            <div className="text-sm font-bold uppercase tracking-wider text-gray-500">
              Project Name
            </div>
            <div className="col-span-2 font-medium text-black">
              {project.name}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 border-b-2 border-gray-100 pb-4">
            <div className="text-sm font-bold uppercase tracking-wider text-gray-500">
              Slug
            </div>
            <div className="col-span-2 font-mono text-sm text-gray-600">
              {project.slug}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 border-b-2 border-gray-100 pb-4">
            <div className="text-sm font-bold uppercase tracking-wider text-gray-500">
              Visibility
            </div>
            <div className="col-span-2">
              <span
                className={cn(
                  "border-2 border-black px-2 py-1 text-xs font-bold uppercase",
                  project.isPublic
                    ? "bg-brutal-green text-black"
                    : "bg-gray-100 text-gray-700",
                )}
              >
                {project.isPublic ? "Public" : "Private"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* GitHub Settings */}
      {project.githubRepo && (
        <div className="border-3 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-black text-black">
            <Github className="h-5 w-5" />
            GitHub Settings
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 border-b-2 border-gray-100 pb-4">
              <div className="text-sm font-bold uppercase tracking-wider text-gray-500">
                Repository
              </div>
              <div className="col-span-2">
                <a
                  href={`https://github.com/${project.githubRepo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-black hover:underline"
                >
                  {project.githubRepo}
                  <ExternalLink className="ml-1 inline-block h-3 w-3" />
                </a>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 border-b-2 border-gray-100 pb-4">
              <div className="text-sm font-bold uppercase tracking-wider text-gray-500">
                Branch
              </div>
              <div className="col-span-2 font-mono text-sm text-gray-600">
                {project.githubBranch ?? "main"}
              </div>
            </div>
            {project.chaptersPath && (
              <div className="grid grid-cols-3 gap-4 border-b-2 border-gray-100 pb-4">
                <div className="text-sm font-bold uppercase tracking-wider text-gray-500">
                  Chapters Path
                </div>
                <div className="col-span-2 font-mono text-sm text-gray-600">
                  {project.chaptersPath}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="border-3 border-brutal-red bg-white p-6">
        <h2 className="mb-4 text-xl font-black text-brutal-red">Danger Zone</h2>
        <p className="mb-4 text-gray-700">
          Once you delete a project, there is no going back. Please be certain.
        </p>
        <button
          type="button"
          className="border-3 border-brutal-red bg-white px-6 py-2 font-bold text-brutal-red transition-colors hover:bg-red-50"
        >
          Delete Project
        </button>
      </div>
    </div>
  );
}

function TabContentSkeleton() {
  return (
    <div className="border-3 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse bg-gray-100" />
        ))}
      </div>
    </div>
  );
}

function getFilename(path: string): string {
  return path.split("/").pop()?.replace(/\.md$/, "") ?? path;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
