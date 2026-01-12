"use client";

import { Check, Copy, Globe, Link2, Lock } from "lucide-react";
import * as React from "react";
import {
  BrutalButton,
  BrutalDialog,
  BrutalDialogContent,
  BrutalDialogDescription,
  BrutalDialogFooter,
  BrutalDialogHeader,
  BrutalDialogTitle,
  BrutalInput,
} from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * ShareDialog - Dialog for sharing a session
 *
 * Allows users to:
 * - Generate a shareable link
 * - Set password protection
 * - Choose between view-only or edit access
 * - Copy link to clipboard
 */

// =============================================================================
// Types
// =============================================================================

export type ShareAccess = "view" | "edit";

export interface ShareSettings {
  /** Whether sharing is enabled */
  enabled: boolean;
  /** The share slug (URL identifier) */
  slug: string | null;
  /** Access level for shared link */
  access: ShareAccess;
  /** Whether password protection is enabled */
  passwordProtected: boolean;
}

export interface ShareDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Current share settings */
  settings: ShareSettings;
  /** Callback when share settings are updated */
  onSettingsChange: (settings: ShareSettings) => Promise<void>;
  /** Base URL for share links */
  baseUrl?: string;
  /** Whether settings are being saved */
  loading?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function ShareDialog({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
  baseUrl = typeof window !== "undefined" ? window.location.origin : "",
  loading = false,
}: ShareDialogProps) {
  const [copied, setCopied] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [localSettings, setLocalSettings] = React.useState(settings);

  // TODO: Implement share link generation via API
  // TODO: Add password setting/removing functionality
  // TODO: Add expiration date option
  // TODO: Add QR code generation for easy mobile sharing

  const shareUrl = settings.slug ? `${baseUrl}/s/${settings.slug}` : null;

  const handleCopy = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // TODO: Show error toast
      console.error("Failed to copy to clipboard");
    }
  };

  const handleEnableSharing = async () => {
    // TODO: Call API to generate share slug
    await onSettingsChange({
      ...localSettings,
      enabled: true,
      slug: localSettings.slug || "generated-slug",
    });
  };

  const handleDisableSharing = async () => {
    await onSettingsChange({
      ...localSettings,
      enabled: false,
    });
  };

  const handleAccessChange = (access: ShareAccess) => {
    setLocalSettings((prev) => ({ ...prev, access }));
  };

  const handleSetPassword = async () => {
    // TODO: Hash password and send to API
    await onSettingsChange({
      ...localSettings,
      passwordProtected: password.length > 0,
    });
    setPassword("");
  };

  return (
    <BrutalDialog open={open} onOpenChange={onOpenChange}>
      <BrutalDialogContent className="max-w-md">
        <BrutalDialogHeader>
          <BrutalDialogTitle>Share Session</BrutalDialogTitle>
          <BrutalDialogDescription>
            Share this session with others via a link.
          </BrutalDialogDescription>
        </BrutalDialogHeader>

        <div className="space-y-6">
          {/* Share Link Section */}
          {settings.enabled && shareUrl ? (
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider">
                Share Link
              </label>
              <div className="flex gap-2">
                <BrutalInput
                  value={shareUrl}
                  readOnly
                  className="flex-1 font-mono text-sm"
                />
                <BrutalButton
                  variant="primary"
                  size="icon"
                  onClick={handleCopy}
                  title={copied ? "Copied!" : "Copy link"}
                >
                  {copied ? (
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                  ) : (
                    <Copy className="h-4 w-4" strokeWidth={2.5} />
                  )}
                </BrutalButton>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Link2 className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm text-gray-600 mb-4">
                Generate a link to share this session
              </p>
              <BrutalButton
                variant="primary"
                onClick={handleEnableSharing}
                loading={loading}
              >
                Create Share Link
              </BrutalButton>
            </div>
          )}

          {/* Access Level */}
          {settings.enabled && (
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider">
                Access Level
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleAccessChange("view")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2",
                    "px-4 py-3",
                    "border-3 border-black",
                    "font-bold text-sm",
                    "transition-all duration-100",
                    localSettings.access === "view"
                      ? "bg-brutal-blue text-white shadow-[4px_4px_0_0_#000]"
                      : "bg-white text-black shadow-[4px_4px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#000]",
                  )}
                >
                  <Globe className="h-4 w-4" />
                  View Only
                </button>
                <button
                  type="button"
                  onClick={() => handleAccessChange("edit")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2",
                    "px-4 py-3",
                    "border-3 border-black",
                    "font-bold text-sm",
                    "transition-all duration-100",
                    localSettings.access === "edit"
                      ? "bg-brutal-green text-black shadow-[4px_4px_0_0_#000]"
                      : "bg-white text-black shadow-[4px_4px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#000]",
                  )}
                >
                  <Lock className="h-4 w-4" />
                  Can Edit
                </button>
              </div>
            </div>
          )}

          {/* Password Protection */}
          {settings.enabled && (
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider">
                Password Protection
              </label>
              {settings.passwordProtected ? (
                <div className="flex items-center justify-between p-3 bg-gray-50 border-3 border-black">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Lock className="h-4 w-4" />
                    Password enabled
                  </span>
                  <BrutalButton
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      onSettingsChange({
                        ...localSettings,
                        passwordProtected: false,
                      })
                    }
                  >
                    Remove
                  </BrutalButton>
                </div>
              ) : (
                <div className="flex gap-2">
                  <BrutalInput
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password..."
                    className="flex-1"
                  />
                  <BrutalButton
                    variant="outline"
                    onClick={handleSetPassword}
                    disabled={!password}
                  >
                    Set
                  </BrutalButton>
                </div>
              )}
            </div>
          )}
        </div>

        <BrutalDialogFooter>
          {settings.enabled && (
            <BrutalButton
              variant="destructive"
              onClick={handleDisableSharing}
              loading={loading}
            >
              Disable Sharing
            </BrutalButton>
          )}
          <BrutalButton variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </BrutalButton>
        </BrutalDialogFooter>
      </BrutalDialogContent>
    </BrutalDialog>
  );
}
