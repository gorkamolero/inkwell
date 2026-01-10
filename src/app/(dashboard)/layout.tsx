import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { getUserTier } from "@/lib/subscription";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const tier = await getUserTier(session.user.id);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <DashboardSidebar user={session.user} tier={tier} />
      <div className="flex flex-1 flex-col">
        {/* Upgrade Banner for Free Users */}
        {tier === "free" && (
          <div className="border-b-4 border-black bg-brutal-yellow px-6 py-3">
            <div className="flex items-center justify-between">
              <p className="font-bold text-black">
                You&apos;re on the Free plan. Upgrade for unlimited projects and
                collaborators.
              </p>
              <Link
                href="/settings"
                className="border-3 border-black bg-black px-4 py-1.5 text-sm font-bold text-white transition-all hover:bg-white hover:text-black"
              >
                Upgrade Now
              </Link>
            </div>
          </div>
        )}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
