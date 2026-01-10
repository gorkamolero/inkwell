"use client";

import { Github } from "lucide-react";
import { signIn } from "next-auth/react";
import { BrutalButton } from "@/components/ui";

export function AuthButtons() {
  const handleGitHubSignIn = () => {
    signIn("github", { callbackUrl: "/projects" });
  };

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
