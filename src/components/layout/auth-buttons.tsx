"use client";

import { Github } from "lucide-react";
import { signIn } from "next-auth/react";
import { BrutalButton } from "@/components/ui";

function handleGitHubSignIn(): void {
  signIn("github", { callbackUrl: "/projects" });
}

export function AuthButtons(): React.ReactNode {
  return (
    <BrutalButton
      type="button"
      onClick={handleGitHubSignIn}
      className="w-full bg-black text-white hover:bg-gray-900"
      size="lg"
    >
      <Github className="h-5 w-5" />
      Continue with GitHub
    </BrutalButton>
  );
}
