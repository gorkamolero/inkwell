import { count, desc, eq } from "drizzle-orm";
import { BookOpen, FolderOpen, Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import {
  ProjectCard,
  ProjectCardSkeleton,
} from "@/components/dashboard/ProjectCard";
import { auth } from "@/lib/auth";
import { db, documents, projects } from "@/lib/db";

export const metadata = {
  title: "Projects",
  description: "Manage your writing projects",
};

export default async function ProjectsPage() {
  return (
    <div>
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight text-black">
            Your Projects
          </h1>
          <p className="mt-1 text-gray-600">
            Create and manage your writing projects
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 border-3 border-black bg-brutal-yellow px-6 py-3 font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          <Plus className="h-5 w-5" strokeWidth={3} />
          NEW PROJECT
        </Link>
      </div>

      {/* Projects Grid */}
      <Suspense fallback={<ProjectsGridSkeleton />}>
        <ProjectsGrid />
      </Suspense>
    </div>
  );
}

async function ProjectsGrid() {
  const session = await auth();

  if (!session?.user?.id || !db) {
    return <EmptyState />;
  }

  // Fetch projects with document count
  const userProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      slug: projects.slug,
      isPublic: projects.isPublic,
      updatedAt: projects.updatedAt,
      documentCount: count(documents.id),
    })
    .from(projects)
    .leftJoin(documents, eq(documents.projectId, projects.id))
    .where(eq(projects.userId, session.user.id))
    .groupBy(projects.id)
    .orderBy(desc(projects.updatedAt));

  if (userProjects.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {userProjects.map((project) => (
        <ProjectCard
          key={project.id}
          project={{
            ...project,
            _count: { documents: project.documentCount },
          }}
        />
      ))}
    </div>
  );
}

function ProjectsGridSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="border-4 border-dashed border-gray-300 bg-white p-16 text-center">
      {/* Illustration */}
      <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center border-4 border-black bg-brutal-yellow">
        <BookOpen className="h-12 w-12 text-black" strokeWidth={2.5} />
      </div>

      <h3 className="mb-2 text-2xl font-black text-black">No projects yet</h3>
      <p className="mx-auto mb-8 max-w-md text-gray-600">
        Create your first project to start writing. Connect a GitHub repo or
        start fresh - your call.
      </p>

      <Link
        href="/projects/new"
        className="inline-flex items-center gap-2 border-3 border-black bg-brutal-yellow px-8 py-4 text-lg font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
      >
        <Plus className="h-6 w-6" strokeWidth={3} />
        Create Your First Project
      </Link>

      {/* Help text */}
      <p className="mt-8 text-sm text-gray-500">
        <FolderOpen className="mr-1 inline-block h-4 w-4" />
        Projects are containers for your documents. You can connect them to
        GitHub repos.
      </p>
    </div>
  );
}
