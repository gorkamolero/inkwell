import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { BrutalCard } from "@/components/ui";
import { AuthButtons } from "@/components/layout/auth-buttons";

export const metadata = {
  title: "Sign Up - Inkwell",
  description: "Create your Inkwell account",
};

export default async function SignupPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/projects");
  }

  return (
    <div className="w-full max-w-md">
      <BrutalCard padding="lg" accent="yellow">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-black uppercase tracking-tight text-black">
              CREATE ACCOUNT
            </h1>
            <p className="text-sm text-gray-600">
              Start writing with GitHub sync
            </p>
          </div>

          <AuthButtons />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-black/20" />
            </div>
          </div>

          <p className="text-center text-sm text-gray-700">
            Have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-black underline underline-offset-2 hover:text-brutal-blue"
            >
              Sign in
            </Link>
          </p>

          <p className="text-center text-xs text-gray-500">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-black">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-black">
              Privacy Policy
            </Link>
          </p>
        </div>
      </BrutalCard>
    </div>
  );
}
