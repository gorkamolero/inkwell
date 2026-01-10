"use client";

import { Github } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const handleGitHubSignIn = () => {
    signIn("github", { callbackUrl: "/projects" });
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleGitHubSignIn}
        className="flex w-full items-center justify-center gap-3 border-4 border-black bg-black px-6 py-3 font-bold text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]"
      >
        <Github className="h-5 w-5" />
        Continue with GitHub
      </button>

      <p className="text-center text-sm text-gray-700">
        {mode === "login" ? (
          <>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-bold text-black hover:underline">
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-black hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
