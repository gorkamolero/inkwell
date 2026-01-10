"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error" | "unsaved";

interface UseAutoSaveOptions<T> {
  /** Data to save */
  data: T;
  /** Save function that receives the data */
  onSave: (data: T) => Promise<void>;
  /** Debounce delay in milliseconds (default: 2000) */
  debounceMs?: number;
  /** Whether auto-save is enabled (default: true) */
  enabled?: boolean;
  /** Callback when save succeeds */
  onSuccess?: () => void;
  /** Callback when save fails */
  onError?: (error: Error) => void;
}

interface UseAutoSaveReturn {
  /** Current save status */
  status: SaveStatus;
  /** Manually trigger a save */
  save: () => Promise<void>;
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean;
  /** Last save timestamp */
  lastSavedAt: Date | null;
  /** Error from last save attempt */
  error: Error | null;
  /** Mark content as changed (triggers auto-save) */
  markChanged: () => void;
}

export function useAutoSave<T>({
  data,
  onSave,
  debounceMs = 2000,
  enabled = true,
  onSuccess,
  onError,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Refs to track latest values without triggering re-renders
  const dataRef = useRef(data);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  // Update data ref when data changes
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Core save function
  const performSave = useCallback(async () => {
    if (isSavingRef.current) return;

    isSavingRef.current = true;
    setStatus("saving");
    setError(null);

    try {
      await onSave(dataRef.current);
      setStatus("saved");
      setLastSavedAt(new Date());
      setHasUnsavedChanges(false);
      onSuccess?.();

      // Reset to idle after a short delay
      setTimeout(() => {
        setStatus((prev) => (prev === "saved" ? "idle" : prev));
      }, 2000);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Save failed");
      setStatus("error");
      setError(error);
      onError?.(error);
    } finally {
      isSavingRef.current = false;
    }
  }, [onSave, onSuccess, onError]);

  // Debounced auto-save
  const debouncedSave = useCallback(() => {
    if (!enabled) return;

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      performSave();
    }, debounceMs);
  }, [enabled, debounceMs, performSave]);

  // Mark content as changed
  const markChanged = useCallback(() => {
    setHasUnsavedChanges(true);
    setStatus("unsaved");
    debouncedSave();
  }, [debouncedSave]);

  // Manual save (immediate, bypasses debounce)
  const save = useCallback(async () => {
    // Clear any pending debounced save
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    await performSave();
  }, [performSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Handle beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        // Modern browsers ignore custom messages, but this triggers the warning
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return {
    status,
    save,
    hasUnsavedChanges,
    lastSavedAt,
    error,
    markChanged,
  };
}
