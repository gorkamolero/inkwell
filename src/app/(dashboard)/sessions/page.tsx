import { Clock, ExternalLink, FileEdit, Github, Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getUserSessions } from "@/lib/session";
import { NewSessionButton } from "./new-session-button";
import { DeleteSessionButton } from "./delete-session-button";

export const metadata = {
  title: "Sessions - Hotpress",
  description: "Manage your writing sessions",
};

export default async function SessionsPage() {
  return (
    <div>
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight text-black">
            Your Sessions
          </h1>
          <p className="mt-1 text-gray-600">
            Your writing sessions from Hotpress
          </p>
        </div>
        <NewSessionButton />
      </div>

      {/* Sessions Grid */}
      <Suspense fallback={<SessionsGridSkeleton />}>
        <SessionsGrid />
      </Suspense>
    </div>
  );
}

async function SessionsGrid() {
  const session = await auth();

  if (!session?.user?.id) {
    return <EmptyState />;
  }

  const sessions = await getUserSessions(session.user.id);

  if (sessions.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {sessions.map((s) => (
        <SessionCard key={s.id} session={s} />
      ))}
    </div>
  );
}

function SessionCard({
  session,
}: {
  session: {
    id: string;
    title: string | null;
    type: string | null;
    shareSlug: string | null;
    githubRepo: string | null;
    updatedAt: Date;
  };
}) {
  const typeLabel =
    {
      book: "Book",
      article: "Article",
      thread: "Thread",
      newsletter: "Newsletter",
      docs: "Docs",
    }[session.type || "book"] || "Book";

  const updatedDate = new Date(session.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const editUrl = session.shareSlug ? `/s/${session.shareSlug}` : `/`;

  return (
    <div className="group relative border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      {/* Type badge */}
      <div className="absolute -right-2 -top-2 border-3 border-black bg-brutal-yellow px-2 py-0.5 text-xs font-bold uppercase">
        {typeLabel}
      </div>

      <div className="p-5">
        {/* Title */}
        <h3 className="mb-2 text-xl font-bold text-black line-clamp-1">
          {session.title || "Untitled"}
        </h3>

        {/* Meta */}
        <div className="mb-4 flex items-center gap-3 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {updatedDate}
          </span>
          {session.githubRepo && (
            <span className="flex items-center gap-1">
              <Github className="h-4 w-4" />
              Saved
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href={editUrl}
            className="flex flex-1 items-center justify-center gap-2 border-3 border-black bg-white py-2 font-bold transition-colors hover:bg-gray-50"
          >
            <FileEdit className="h-4 w-4" />
            Edit
          </Link>
          {session.shareSlug && (
            <Link
              href={`/s/${session.shareSlug}`}
              target="_blank"
              className="flex items-center justify-center border-3 border-black bg-brutal-blue p-2 text-white transition-colors hover:bg-blue-600"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
          )}
          <DeleteSessionButton sessionId={session.id} />
        </div>
      </div>
    </div>
  );
}

function SessionsGridSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse border-4 border-black bg-white p-5"
        >
          <div className="mb-4 h-6 w-3/4 bg-gray-200" />
          <div className="mb-4 h-4 w-1/2 bg-gray-200" />
          <div className="h-10 w-full bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="border-4 border-dashed border-gray-300 bg-white p-16 text-center">
      {/* Illustration */}
      <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center border-4 border-black bg-brutal-yellow">
        <FileEdit className="h-12 w-12 text-black" strokeWidth={2.5} />
      </div>

      <h3 className="mb-2 text-2xl font-black text-black">No sessions yet</h3>
      <p className="mx-auto mb-8 max-w-md text-gray-600">
        Start writing on the homepage and your sessions will appear here.
        Sessions are automatically saved.
      </p>

      <Link
        href="/"
        className="inline-flex items-center gap-2 border-3 border-black bg-brutal-yellow px-8 py-4 text-lg font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
      >
        <Plus className="h-6 w-6" strokeWidth={3} />
        Start Writing
      </Link>

      <p className="mt-8 text-sm text-gray-500">
        Your writing is saved automatically and synced to GitHub when ready.
      </p>
    </div>
  );
}
