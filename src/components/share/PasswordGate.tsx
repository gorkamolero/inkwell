"use client";

import * as React from "react";
import Link from "next/link";
import { Lock, AlertCircle } from "lucide-react";
import {
  BrutalCard,
  BrutalCardHeader,
  BrutalCardTitle,
  BrutalCardDescription,
  BrutalButton,
  BrutalInput,
} from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * PasswordGate - Password entry for protected sessions
 *
 * Displays a password form when accessing a password-protected
 * shared session. Handles validation and error states.
 */

// =============================================================================
// Types
// =============================================================================

export interface PasswordGateProps {
  /** Title of the session (if available) */
  sessionTitle?: string;
  /** Callback when password is submitted */
  onSubmit: (password: string) => Promise<boolean>;
  /** Error message to display */
  error?: string | null;
  /** Whether verification is in progress */
  loading?: boolean;
  /** Additional class names */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function PasswordGate({
  sessionTitle,
  onSubmit,
  error,
  loading = false,
  className,
}: PasswordGateProps) {
  const [password, setPassword] = React.useState("");
  const [localError, setLocalError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // TODO: Implement password verification via API
  // TODO: Add rate limiting feedback
  // TODO: Add "remember me" option with session cookie
  // TODO: Add keyboard shortcut (Enter) to submit

  React.useEffect(() => {
    // Auto-focus password input
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!password.trim()) {
      setLocalError("Please enter a password");
      return;
    }

    const success = await onSubmit(password);
    if (!success) {
      setPassword("");
      inputRef.current?.focus();
    }
  };

  const displayError = error || localError;

  return (
    <div
      className={cn(
        "min-h-screen flex items-center justify-center p-4",
        "bg-gray-50",
        className
      )}
    >
      <BrutalCard className="w-full max-w-md" padding="lg">
        <BrutalCardHeader className="text-center">
          <div
            className={cn(
              "mx-auto mb-4 w-16 h-16",
              "flex items-center justify-center",
              "bg-brutal-yellow",
              "border-3 border-black",
              "shadow-[4px_4px_0_0_#000]"
            )}
          >
            <Lock className="h-8 w-8" strokeWidth={2.5} />
          </div>

          <BrutalCardTitle className="text-2xl">
            This session is protected
          </BrutalCardTitle>

          <BrutalCardDescription className="mt-2">
            {sessionTitle ? (
              <>
                Enter the password to access{" "}
                <span className="font-bold">&quot;{sessionTitle}&quot;</span>
              </>
            ) : (
              "Enter the password to access this session"
            )}
          </BrutalCardDescription>
        </BrutalCardHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <BrutalInput
            ref={inputRef}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password..."
            error={!!displayError}
            disabled={loading}
            aria-describedby={displayError ? "password-error" : undefined}
          />

          {displayError && (
            <div
              id="password-error"
              className={cn(
                "flex items-center gap-2",
                "p-3",
                "bg-red-50 border-3 border-brutal-red",
                "text-sm font-medium text-brutal-red"
              )}
              role="alert"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {displayError}
            </div>
          )}

          <BrutalButton
            type="submit"
            variant="primary"
            className="w-full"
            loading={loading}
            loadingText="Verifying..."
          >
            Access Session
          </BrutalButton>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have the password?{" "}
          <Link
            href="/"
            className="font-bold text-brutal-blue underline hover:no-underline"
          >
            Create your own session
          </Link>
        </p>
      </BrutalCard>
    </div>
  );
}
