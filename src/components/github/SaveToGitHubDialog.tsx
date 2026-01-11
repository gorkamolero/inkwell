"use client";

import * as React from "react";
import { Github, Plus, Folder, ChevronRight, Check, AlertTriangle } from "lucide-react";
import {
  BrutalDialog,
  BrutalDialogContent,
  BrutalDialogHeader,
  BrutalDialogTitle,
  BrutalDialogDescription,
  BrutalDialogFooter,
  BrutalButton,
  BrutalInput,
  BrutalCard,
} from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * SaveToGitHubDialog - Dialog for saving session to GitHub
 *
 * Allows users to:
 * - Select an existing repository
 * - Create a new repository
 * - Choose the file path within the repo
 * - Commit content and format configuration
 */

// =============================================================================
// Types
// =============================================================================

export interface GitHubRepo {
  /** Full repo name (owner/repo) */
  fullName: string;
  /** Repository name */
  name: string;
  /** Repository owner */
  owner: string;
  /** Whether it's private */
  isPrivate: boolean;
  /** Default branch */
  defaultBranch: string;
}

export interface SaveToGitHubDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Session ID to save */
  sessionId: string;
  /** Session title for default file name */
  sessionTitle?: string;
  /** User's GitHub repositories */
  repositories?: GitHubRepo[];
  /** Loading state for repositories */
  loadingRepos?: boolean;
  /** Currently linked repo (if already saved) */
  linkedRepo?: {
    fullName: string;
    path: string;
  } | null;
  /** Callback when save is triggered */
  onSave: (options: {
    repo: string;
    path: string;
    commitMessage: string;
    createRepo?: boolean;
    repoName?: string;
    repoPrivate?: boolean;
  }) => Promise<void>;
  /** Whether save is in progress */
  saving?: boolean;
  /** Whether user is authenticated with GitHub */
  isAuthenticated?: boolean;
  /** Callback to initiate GitHub login */
  onLogin?: () => void;
}

// =============================================================================
// Constants
// =============================================================================

type Step = "select-repo" | "create-repo" | "select-path" | "confirm";

// =============================================================================
// Component
// =============================================================================

export function SaveToGitHubDialog({
  open,
  onOpenChange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sessionId,
  sessionTitle,
  repositories = [],
  loadingRepos = false,
  linkedRepo,
  onSave,
  saving = false,
  isAuthenticated = false,
  onLogin,
}: SaveToGitHubDialogProps) {
  const [step, setStep] = React.useState<Step>("select-repo");
  const [selectedRepo, setSelectedRepo] = React.useState<GitHubRepo | null>(null);
  const [newRepoName, setNewRepoName] = React.useState("");
  const [newRepoPrivate, setNewRepoPrivate] = React.useState(false);
  const [filePath, setFilePath] = React.useState("");
  const [commitMessage, setCommitMessage] = React.useState("");

  // TODO: Implement repository listing via API
  // TODO: Add repository search/filter
  // TODO: Add file browser for existing repos
  // TODO: Add branch selection
  // TODO: Handle conflict detection (file already exists)
  // TODO: Add "remember this repo" option

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      if (linkedRepo) {
        setStep("confirm");
        const repo = repositories.find((r) => r.fullName === linkedRepo.fullName);
        if (repo) setSelectedRepo(repo);
        setFilePath(linkedRepo.path);
        setCommitMessage(`Update ${sessionTitle || "document"}`);
      } else {
        setStep("select-repo");
        setSelectedRepo(null);
        setFilePath(`content/${slugify(sessionTitle || "document")}.md`);
        setCommitMessage(`Add ${sessionTitle || "document"}`);
      }
    }
  }, [open, linkedRepo, repositories, sessionTitle]);

  const handleSelectRepo = (repo: GitHubRepo) => {
    setSelectedRepo(repo);
    setStep("select-path");
  };

  const handleCreateRepo = () => {
    setStep("create-repo");
  };

  const handleConfirmPath = () => {
    setStep("confirm");
  };

  const handleSave = async () => {
    if (step === "create-repo") {
      await onSave({
        repo: "",
        path: filePath,
        commitMessage,
        createRepo: true,
        repoName: newRepoName,
        repoPrivate: newRepoPrivate,
      });
    } else if (selectedRepo) {
      await onSave({
        repo: selectedRepo.fullName,
        path: filePath,
        commitMessage,
      });
    }
  };

  const handleBack = () => {
    if (step === "select-path") {
      setStep("select-repo");
    } else if (step === "confirm") {
      setStep("select-path");
    } else if (step === "create-repo") {
      setStep("select-repo");
    }
  };

  // Not authenticated - show login prompt
  if (!isAuthenticated) {
    return (
      <BrutalDialog open={open} onOpenChange={onOpenChange}>
        <BrutalDialogContent className="max-w-md">
          <BrutalDialogHeader className="text-center">
            <div
              className={cn(
                "mx-auto mb-4 w-16 h-16",
                "flex items-center justify-center",
                "bg-black text-white",
                "border-3 border-black"
              )}
            >
              <Github className="h-8 w-8" />
            </div>
            <BrutalDialogTitle>Connect to GitHub</BrutalDialogTitle>
            <BrutalDialogDescription>
              Sign in with GitHub to save your work to a repository.
              Your content stays yours.
            </BrutalDialogDescription>
          </BrutalDialogHeader>

          <div className="my-6">
            <BrutalButton
              variant="primary"
              className="w-full"
              onClick={onLogin}
            >
              <Github className="h-5 w-5 mr-2" />
              Sign in with GitHub
            </BrutalButton>
          </div>

          <p className="text-xs text-center text-gray-500">
            We&apos;ll request access to read and write to your repositories.
          </p>
        </BrutalDialogContent>
      </BrutalDialog>
    );
  }

  return (
    <BrutalDialog open={open} onOpenChange={onOpenChange}>
      <BrutalDialogContent className="max-w-lg">
        <BrutalDialogHeader>
          <BrutalDialogTitle>
            {step === "select-repo" && "Select Repository"}
            {step === "create-repo" && "Create New Repository"}
            {step === "select-path" && "Choose File Path"}
            {step === "confirm" && "Confirm Save"}
          </BrutalDialogTitle>
          <BrutalDialogDescription>
            {step === "select-repo" &&
              "Choose where to save your work, or create a new repository."}
            {step === "create-repo" &&
              "Create a new repository to store your content."}
            {step === "select-path" &&
              "Specify where in the repository to save the file."}
            {step === "confirm" &&
              "Review your changes before committing to GitHub."}
          </BrutalDialogDescription>
        </BrutalDialogHeader>

        <div className="my-6 min-h-[200px]">
          {/* Step: Select Repository */}
          {step === "select-repo" && (
            <div className="space-y-3">
              <BrutalButton
                variant="outline"
                className="w-full justify-start"
                onClick={handleCreateRepo}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create new repository
              </BrutalButton>

              <div className="border-t-2 border-gray-200 pt-3">
                <p className="text-xs font-bold uppercase tracking-wider mb-2">
                  Your Repositories
                </p>

                {loadingRepos ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-3 border-black border-t-brutal-yellow animate-spin" />
                  </div>
                ) : repositories.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4 text-center">
                    No repositories found
                  </p>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {repositories.map((repo) => (
                      <button
                        key={repo.fullName}
                        onClick={() => handleSelectRepo(repo)}
                        className={cn(
                          "w-full flex items-center justify-between",
                          "px-3 py-2",
                          "border-3 border-black",
                          "text-left",
                          "hover:bg-gray-50",
                          "transition-colors duration-100"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <Folder className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{repo.fullName}</span>
                          {repo.isPrivate && (
                            <span className="text-xs bg-gray-100 px-1 py-0.5">
                              Private
                            </span>
                          )}
                        </span>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step: Create Repository */}
          {step === "create-repo" && (
            <div className="space-y-4">
              <BrutalInput
                label="Repository Name"
                value={newRepoName}
                onChange={(e) => setNewRepoName(e.target.value)}
                placeholder="my-book"
                helperText="Will be created under your GitHub account"
              />

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newRepoPrivate}
                  onChange={(e) => setNewRepoPrivate(e.target.checked)}
                  className="w-5 h-5 border-3 border-black accent-brutal-blue"
                />
                <span className="font-medium">Make repository private</span>
              </label>
            </div>
          )}

          {/* Step: Select Path */}
          {step === "select-path" && selectedRepo && (
            <div className="space-y-4">
              <BrutalCard padding="sm" className="bg-gray-50">
                <p className="text-sm">
                  <span className="font-bold">Repository:</span>{" "}
                  {selectedRepo.fullName}
                </p>
              </BrutalCard>

              <BrutalInput
                label="File Path"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                placeholder="content/book.md"
                helperText="Path within the repository (will create folders if needed)"
              />

              <div
                className={cn(
                  "flex items-start gap-2 p-3",
                  "bg-brutal-yellow/20 border-3 border-brutal-yellow"
                )}
              >
                <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-bold">This will also save:</p>
                  <ul className="mt-1 list-disc ml-4 text-gray-700">
                    <li>hotpress.yaml (format configuration)</li>
                    <li>GitHub Action workflow for PDF generation</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Step: Confirm */}
          {step === "confirm" && (
            <div className="space-y-4">
              <BrutalCard padding="sm" className="bg-gray-50">
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-bold">Repository:</span>{" "}
                    {selectedRepo?.fullName || newRepoName}
                  </p>
                  <p>
                    <span className="font-bold">Path:</span> {filePath}
                  </p>
                </div>
              </BrutalCard>

              <BrutalInput
                label="Commit Message"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Add document"
              />

              <div
                className={cn(
                  "flex items-center gap-2 p-3",
                  "bg-brutal-green/20 border-3 border-brutal-green"
                )}
              >
                <Check className="h-5 w-5" />
                <p className="text-sm">
                  Once saved, your content will be version-controlled and PDF
                  will generate automatically.
                </p>
              </div>
            </div>
          )}
        </div>

        <BrutalDialogFooter>
          {step !== "select-repo" && (
            <BrutalButton variant="ghost" onClick={handleBack} disabled={saving}>
              Back
            </BrutalButton>
          )}

          {step === "select-path" && (
            <BrutalButton
              variant="primary"
              onClick={handleConfirmPath}
              disabled={!filePath}
            >
              Continue
            </BrutalButton>
          )}

          {step === "create-repo" && (
            <BrutalButton
              variant="primary"
              onClick={handleSave}
              loading={saving}
              disabled={!newRepoName}
            >
              Create & Save
            </BrutalButton>
          )}

          {step === "confirm" && (
            <BrutalButton
              variant="primary"
              onClick={handleSave}
              loading={saving}
              loadingText="Saving..."
            >
              <Github className="h-4 w-4 mr-2" />
              Save to GitHub
            </BrutalButton>
          )}
        </BrutalDialogFooter>
      </BrutalDialogContent>
    </BrutalDialog>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
