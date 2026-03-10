import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import NewDocumentPageClient from "./NewDocumentPageClient";

interface NewDocumentPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function NewDocumentPage({ params }: NewDocumentPageProps) {
  const { projectId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/${projectId}/new`);
  }

  return <NewDocumentPageClient projectId={projectId} />;
}
