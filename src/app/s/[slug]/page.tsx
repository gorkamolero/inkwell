import { notFound } from "next/navigation";
import { getSessionByShareSlug, isSessionExpired } from "@/lib/session";
import { SharedSessionView } from "./SharedSessionView";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const session = await getSessionByShareSlug(slug);

  if (!session || isSessionExpired(session)) {
    return {
      title: "Session Not Found - Hotpress",
    };
  }

  return {
    title: `${session.title || "Untitled"} - Hotpress`,
    description: "Collaborative writing session on Hotpress",
  };
}

export default async function SharedSessionPage({ params }: PageProps) {
  const { slug } = await params;

  // Fetch session data
  const session = await getSessionByShareSlug(slug);

  // Handle not found
  if (!session) {
    notFound();
  }

  // Handle expired session
  if (isSessionExpired(session)) {
    return (
      <div className="min-h-screen bg-white py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-md border-4 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h1 className="mb-4 text-2xl font-black">Link Expired</h1>
            <p className="text-gray-600">
              This shared link has expired and is no longer available.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Serialize session for client
  const serializedSession = {
    id: session.id,
    title: session.title,
    type: session.type ?? "book",
    content: session.content,
    formatConfig: session.formatConfig as Record<string, unknown> | null,
    passwordProtected: !!session.passwordHash,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };

  return <SharedSessionView session={serializedSession} />;
}
