"use client";

import { AlertCircle, Check, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SyncButtonProps {
  projectSlug: string;
}

export function SyncButton({ projectSlug }: SyncButtonProps) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  async function handleSync() {
    setSyncing(true);
    setResult(null);

    try {
      const response = await fetch(`/api/projects/${projectSlug}/sync`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setResult({ success: false, message: data.error || "Sync failed" });
        return;
      }

      setResult({ success: true, message: data.message });
      router.refresh();
    } catch {
      setResult({ success: false, message: "Failed to sync" });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleSync}
        disabled={syncing}
        className={cn(
          "flex items-center gap-2 border-3 border-black px-4 py-2 font-bold transition-all",
          syncing
            ? "cursor-not-allowed bg-gray-100 text-gray-500"
            : "bg-white text-black hover:bg-gray-100",
        )}
      >
        <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
        {syncing ? "Syncing..." : "Sync from GitHub"}
      </button>

      {result && (
        <span
          className={cn(
            "flex items-center gap-1 text-sm font-medium",
            result.success ? "text-green-600" : "text-red-600",
          )}
        >
          {result.success ? (
            <Check className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {result.message}
        </span>
      )}
    </div>
  );
}
