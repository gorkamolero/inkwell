import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      {children}
    </div>
  );
}
