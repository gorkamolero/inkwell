import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CreateProjectForm } from "./create-project-form";

export const metadata = {
  title: "Create Project",
  description: "Create a new writing project",
};

export default async function NewProjectPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Pass accessToken to the client component for GitHub API calls
  const accessToken = session.accessToken ?? null;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black uppercase tracking-tight text-black">
          Create Project
        </h1>
        <p className="mt-1 text-gray-600">
          Start a new writing project or connect an existing GitHub repository
        </p>
      </div>

      {/* Form */}
      <CreateProjectForm accessToken={accessToken} />
    </div>
  );
}
