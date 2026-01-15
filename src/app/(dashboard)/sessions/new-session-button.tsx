"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function NewSessionButton() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const handleNewSession = async () => {
    setIsCreating(true);
    try {
      // Create new session
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "book" }),
      });

      if (!response.ok) {
        throw new Error("Failed to create session");
      }

      const data = await response.json();

      // Create share link immediately
      const shareResponse = await fetch(
        `/api/sessions/${data.session.id}/share`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      if (!shareResponse.ok) {
        throw new Error("Failed to create share link");
      }

      const shareData = await shareResponse.json();

      // Navigate to the full-screen editor
      router.push(`/s/${shareData.shareSlug}`);
    } catch (error) {
      console.error("Failed to create session:", error);
      setIsCreating(false);
    }
  };

  return (
    <button
      onClick={handleNewSession}
      disabled={isCreating}
      className="flex items-center gap-2 border-3 border-black bg-brutal-yellow px-4 py-3 font-black uppercase tracking-wide shadow-[4px_4px_0_0_#000] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#000] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Plus
        className={`h-5 w-5 ${isCreating ? "animate-spin" : ""}`}
        strokeWidth={3}
      />
      {isCreating ? "Creating..." : "NEW SESSION"}
    </button>
  );
}
