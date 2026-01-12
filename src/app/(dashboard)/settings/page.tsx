import { eq } from "drizzle-orm";
import {
  AlertTriangle,
  CheckCircle,
  CreditCard,
  Github,
  Mail,
  User,
} from "lucide-react";
import { Suspense } from "react";
import { BillingSection } from "@/components/layout/billing-section";
import { SettingsForm } from "@/components/layout/settings-form";
import { auth } from "@/lib/auth";
import { db, users } from "@/lib/db";
import type { UserWithSubscription } from "@/types";

export const metadata = {
  title: "Settings",
  description: "Manage your account settings",
};

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id || !db) {
    return null;
  }

  // Fetch user with subscription data
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    with: {
      subscription: true,
      accounts: true,
    },
  });

  if (!user) {
    return null;
  }

  // Transform to UserWithSubscription type
  const userWithSubscription: UserWithSubscription = {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    subscription: user.subscription
      ? {
          stripeCustomerId: user.subscription.stripeCustomerId,
          stripePriceId: user.subscription.stripePriceId,
          stripeSubscriptionId: user.subscription.stripeSubscriptionId,
          status: user.subscription.status,
          currentPeriodEnd: user.subscription.currentPeriodEnd,
          cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
        }
      : null,
  };

  // Get connected accounts
  const connectedAccounts = user.accounts.map((acc) => ({
    provider: acc.provider,
    email: acc.providerAccountId,
  }));

  const hasGitHub = connectedAccounts.some((acc) => acc.provider === "github");

  return (
    <div className="mx-auto max-w-3xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black uppercase tracking-tight text-black">
          Settings
        </h1>
        <p className="mt-1 text-gray-600">
          Manage your account and preferences
        </p>
      </div>

      <div className="space-y-8">
        {/* Profile Section */}
        <section className="border-3 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="mb-6 flex items-center gap-2">
            <User className="h-6 w-6" />
            <h2 className="text-xl font-black text-black">Profile</h2>
          </div>
          <Suspense fallback={<ProfileSkeleton />}>
            <SettingsForm user={user} />
          </Suspense>
        </section>

        {/* Connected Accounts Section */}
        <section className="border-3 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="mb-6 flex items-center gap-2">
            <Mail className="h-6 w-6" />
            <h2 className="text-xl font-black text-black">
              Connected Accounts
            </h2>
          </div>

          <div className="space-y-4">
            {/* GitHub */}
            <div className="flex items-center justify-between border-3 border-gray-200 p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center border-2 border-black bg-gray-900">
                  <Github className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-black">GitHub</p>
                  <p className="text-sm text-gray-500">
                    {hasGitHub
                      ? "Connected - can sync repositories"
                      : "Not connected"}
                  </p>
                </div>
              </div>
              {hasGitHub ? (
                <span className="flex items-center gap-1.5 border-2 border-brutal-green bg-green-50 px-3 py-1.5 text-xs font-bold text-brutal-green">
                  <CheckCircle className="h-4 w-4" />
                  Connected
                </span>
              ) : (
                <button className="border-3 border-black bg-brutal-yellow px-4 py-2 font-bold text-black transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  Connect
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Billing Section */}
        <section className="border-3 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="mb-6 flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            <h2 className="text-xl font-black text-black">
              Billing & Subscription
            </h2>
          </div>
          <Suspense fallback={<BillingSkeleton />}>
            <BillingSection user={userWithSubscription} />
          </Suspense>
        </section>

        {/* Danger Zone */}
        <section className="border-3 border-brutal-red bg-white p-6">
          <div className="mb-6 flex items-center gap-2 text-brutal-red">
            <AlertTriangle className="h-6 w-6" />
            <h2 className="text-xl font-black">Danger Zone</h2>
          </div>

          <div className="space-y-6">
            {/* Export Data */}
            <div className="flex items-center justify-between border-3 border-gray-200 p-4">
              <div>
                <p className="font-bold text-black">Export Your Data</p>
                <p className="text-sm text-gray-600">
                  Download all your projects and documents
                </p>
              </div>
              <button className="border-3 border-black bg-white px-4 py-2 font-bold text-black transition-colors hover:bg-gray-100">
                Export
              </button>
            </div>

            {/* Delete Account */}
            <div className="flex items-center justify-between border-3 border-brutal-red/30 bg-red-50 p-4">
              <div>
                <p className="font-bold text-black">Delete Account</p>
                <p className="text-sm text-gray-600">
                  Permanently delete your account and all data
                </p>
              </div>
              <button
                type="button"
                className="border-3 border-brutal-red bg-white px-4 py-2 font-bold text-brutal-red transition-colors hover:bg-brutal-red hover:text-white"
              >
                Delete Account
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-4 w-20 animate-pulse bg-gray-200" />
        <div className="h-10 w-full animate-pulse bg-gray-100" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-16 animate-pulse bg-gray-200" />
        <div className="h-10 w-full animate-pulse bg-gray-100" />
      </div>
    </div>
  );
}

function BillingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-20 w-full animate-pulse bg-yellow-100" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-6 w-64 animate-pulse bg-gray-100" />
        ))}
      </div>
    </div>
  );
}
