"use client";

import { AlertTriangle, History, RotateCcw, Wrench } from "lucide-react";
import { useState } from "react";

interface RevisionItem {
  id: string;
  sessionId: string;
  source: string;
  actorUserId: string | null;
  actorUser?: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  hasContent: boolean;
  createdAt: string;
}

export function RecoveryTools() {
  const [sessionId, setSessionId] = useState("");
  const [revisions, setRevisions] = useState<RevisionItem[]>([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [backfilling, setBackfilling] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadRevisions = async () => {
    if (!sessionId.trim()) return;
    setLoadingRevisions(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/sessions/${sessionId.trim()}/revisions`);
      const data = (await response.json()) as { revisions?: RevisionItem[]; error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Failed to load revisions");
      }
      setRevisions(data.revisions || []);
      if (!data.revisions?.length) {
        setMessage("No revisions found for that session.");
      }
    } catch (error) {
      setRevisions([]);
      setMessage(error instanceof Error ? error.message : "Failed to load revisions");
    } finally {
      setLoadingRevisions(false);
    }
  };

  const restoreRevision = async (revisionId: string) => {
    setRestoringId(revisionId);
    setMessage(null);
    try {
      const response = await fetch(
        `/api/sessions/${sessionId.trim()}/revisions/${revisionId}/restore`,
        { method: "POST" },
      );
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Failed to restore revision");
      }
      setMessage(`Restored revision ${revisionId}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to restore revision");
    } finally {
      setRestoringId(null);
    }
  };

  const runBackfill = async () => {
    setBackfilling(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/recovery/backfill", {
        method: "POST",
      });
      const data = (await response.json()) as {
        scanned?: number;
        candidates?: number;
        repaired?: Array<{ sessionId: string }>;
        failed?: Array<{ sessionId: string; error: string }>;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error || "Failed to run backfill");
      }
      setMessage(
        `Scanned ${data.scanned ?? 0}, repaired ${data.repaired?.length ?? 0}, failed ${data.failed?.length ?? 0}.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to run backfill");
    } finally {
      setBackfilling(false);
    }
  };

  return (
    <section className="border-3 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="mb-6 flex items-center gap-2">
        <Wrench className="h-6 w-6" />
        <h2 className="text-xl font-black text-black">Recovery Tools</h2>
      </div>

      <div className="space-y-6">
        <div className="border-3 border-gray-200 p-4">
          <div className="mb-3 flex items-center gap-2">
            <History className="h-4 w-4" />
            <p className="font-bold text-black">Session Revisions</p>
          </div>
          <p className="mb-4 text-sm text-gray-600">
            Load recent stored revisions for a session and restore one into the
            live room.
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="Session ID"
              className="flex-1 border-3 border-black px-4 py-2 font-mono text-sm focus:outline-none"
            />
            <button
              type="button"
              onClick={loadRevisions}
              disabled={loadingRevisions || !sessionId.trim()}
              className="border-3 border-black bg-brutal-yellow px-4 py-2 font-bold text-black disabled:opacity-50"
            >
              {loadingRevisions ? "Loading..." : "Load"}
            </button>
          </div>

          {revisions.length > 0 && (
            <div className="mt-4 space-y-2">
              {revisions.map((revision) => (
                <div
                  key={revision.id}
                  className="flex items-center justify-between border-2 border-gray-200 p-3"
                >
                  <div className="min-w-0">
                    <div className="font-mono text-xs text-gray-500">
                      {revision.id}
                    </div>
                    <div className="text-sm font-bold text-black">
                      {revision.source}
                    </div>
                    <div className="text-xs text-gray-600">
                      {new Date(revision.createdAt).toLocaleString()} ·{" "}
                      {revision.actorUser?.name ||
                        revision.actorUser?.email ||
                        revision.actorUserId ||
                        "unknown actor"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => restoreRevision(revision.id)}
                    disabled={restoringId === revision.id}
                    className="flex items-center gap-2 border-3 border-black bg-white px-3 py-2 font-bold text-black disabled:opacity-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {restoringId === revision.id ? "Restoring..." : "Restore"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-3 border-gray-200 p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <p className="font-bold text-black">Repo Backfill Repair</p>
          </div>
          <p className="mb-4 text-sm text-gray-600">
            Scan repo-backed sessions for blank content and repair them from
            their public GitHub source.
          </p>
          <button
            type="button"
            onClick={runBackfill}
            disabled={backfilling}
            className="border-3 border-black bg-brutal-red px-4 py-2 font-bold text-white disabled:opacity-50"
          >
            {backfilling ? "Running..." : "Run Backfill"}
          </button>
        </div>

        {message && (
          <div className="border-3 border-black bg-gray-50 p-4 text-sm font-medium text-black">
            {message}
          </div>
        )}
      </div>
    </section>
  );
}
