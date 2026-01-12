"use client";

import {
  AlertCircle,
  CheckCircle,
  FolderPlus,
  Github,
  Globe,
  Link as LinkIcon,
  Loader2,
  Lock,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { BookSelector } from "@/components/dashboard/BookSelector";
import { FolderPicker } from "@/components/dashboard/FolderPicker";
import { BrutalInput, BrutalTextarea } from "@/components/ui";
import type { RepoInfo, RepoStructure } from "@/lib/github";
import { cn } from "@/lib/utils";

interface CreateProjectFormProps {
  accessToken: string | null;
}

type RepoMode = "new" | "existing";

interface DetectedBook {
  name: string;
  path: string;
}

function formatRepoName(repoName: string): string {
  return repoName
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function CreateProjectForm({ accessToken }: CreateProjectFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [repoMode, setRepoMode] = useState<RepoMode>("new");

  // New repo options
  const [newRepoName, setNewRepoName] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);

  // Existing repo options
  const [repos, setRepos] = useState<RepoInfo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [reposError, setReposError] = useState<string | null>(null);

  // Repo structure detection
  const [repoStructure, setRepoStructure] = useState<RepoStructure | null>(
    null,
  );
  const [isDetectingStructure, setIsDetectingStructure] = useState(false);
  const [structureError, setStructureError] = useState<string | null>(null);

  // Multi-book selection
  const [selectedBooks, setSelectedBooks] = useState<DetectedBook[]>([]);

  // Single-book chapters path
  const [chaptersPath, setChaptersPath] = useState("");

  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Load repos function
  const loadRepos = useCallback(async () => {
    if (!accessToken) return;

    setIsLoadingRepos(true);
    setReposError(null);

    try {
      const response = await fetch("/api/user/repos");
      if (!response.ok) {
        throw new Error("Failed to load repositories");
      }
      const data = await response.json();

      // If GitHub App not installed, redirect to install it
      if (data.needsInstall && data.installUrl) {
        window.location.href = data.installUrl;
        return;
      }

      setRepos(data.repos);
    } catch (error) {
      setReposError("Failed to load repositories. Please try again.");
      console.error("Error loading repos:", error);
    } finally {
      setIsLoadingRepos(false);
    }
  }, [accessToken]);

  // Detect structure function
  const detectStructure = useCallback(async () => {
    if (!accessToken || !selectedRepo) return;

    setIsDetectingStructure(true);
    setStructureError(null);
    setRepoStructure(null);
    setSelectedBooks([]);

    try {
      const response = await fetch(
        `/api/github/detect-structure?repo=${encodeURIComponent(selectedRepo)}`,
      );
      if (!response.ok) {
        throw new Error("Failed to detect repository structure");
      }
      const data = await response.json();
      setRepoStructure(data.structure);

      // If single book, pre-fill name from repo
      if (data.structure.type === "single" && !name) {
        const repoName =
          repos.find((r) => r.fullName === selectedRepo)?.name ?? "";
        setName(formatRepoName(repoName));
      }
    } catch (error) {
      setStructureError("Failed to analyze repository. Please try again.");
      console.error("Error detecting structure:", error);
    } finally {
      setIsDetectingStructure(false);
    }
  }, [accessToken, selectedRepo, name, repos]);

  // Load user repos when switching to existing mode
  useEffect(() => {
    if (repoMode === "existing" && accessToken && repos.length === 0) {
      loadRepos();
    }
  }, [repoMode, accessToken, repos.length, loadRepos]);

  // Detect repo structure when a repo is selected
  useEffect(() => {
    if (selectedRepo && accessToken) {
      detectStructure();
    } else {
      setRepoStructure(null);
      setSelectedBooks([]);
    }
  }, [selectedRepo, accessToken, detectStructure]);

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Project name is required";
    }

    if (repoMode === "new" && !newRepoName.trim()) {
      newErrors.newRepoName = "Repository name is required";
    }

    if (repoMode === "existing" && !selectedRepo) {
      newErrors.selectedRepo = "Please select a repository";
    }

    if (
      repoMode === "existing" &&
      repoStructure?.type === "multi" &&
      selectedBooks.length === 0
    ) {
      newErrors.books = "Please select at least one book";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) return;

    startTransition(async () => {
      try {
        // Multi-book: create multiple projects
        if (
          repoMode === "existing" &&
          repoStructure?.type === "multi" &&
          selectedBooks.length > 0
        ) {
          const results = await Promise.all(
            selectedBooks.map((book) =>
              createProject({
                name: book.name,
                description: description || undefined,
                githubRepo: selectedRepo,
                chaptersPath: book.path,
              }),
            ),
          );

          const failedCount = results.filter((r) => !r.success).length;
          if (failedCount > 0) {
            setSubmitError(`${failedCount} project(s) failed to create`);
            return;
          }

          setSubmitSuccess(true);
          setTimeout(() => router.push("/projects"), 1500);
          return;
        }

        // Single project creation
        const projectData = {
          name,
          description: description || undefined,
          githubRepo:
            repoMode === "existing"
              ? selectedRepo
              : newRepoName
                ? `__NEW__:${newRepoName}:${isPrivate ? "private" : "public"}`
                : undefined,
          chaptersPath: repoMode === "existing" ? chaptersPath : "",
        };

        const result = await createProject(projectData);
        if (!result.success) {
          setSubmitError(result.error ?? "Failed to create project");
          return;
        }

        setSubmitSuccess(true);
        setTimeout(() => router.push(`/projects/${result.slug}`), 1500);
      } catch (error) {
        setSubmitError("An unexpected error occurred");
        console.error("Error creating project:", error);
      }
    });
  }

  async function createProject(data: {
    name: string;
    description?: string;
    githubRepo?: string;
    chaptersPath: string;
  }): Promise<{ success: boolean; slug?: string; error?: string }> {
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message };
    }

    const result = await response.json();
    return { success: true, slug: result.project.slug };
  }

  const hasGitHubAccess = !!accessToken;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Project Details Section */}
      <section className="border-3 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="mb-6 text-xl font-black text-black">Project Details</h2>

        <div className="space-y-6">
          <BrutalInput
            label="Project Name"
            placeholder="My Awesome Book"
            value={name}
            onChange={(e) => setName(e.target.value)}
            errorMessage={errors.name}
          />

          <BrutalTextarea
            label="Description (optional)"
            placeholder="What is this project about?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
      </section>

      {/* GitHub Section */}
      <section className="border-3 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="mb-6 flex items-center gap-2 text-xl font-black text-black">
          <Github className="h-6 w-6" />
          GitHub Repository
        </h2>

        {!hasGitHubAccess && (
          <div className="border-3 border-brutal-yellow bg-brutal-yellow/10 p-4">
            <p className="flex items-center gap-2 font-bold text-black">
              <AlertCircle className="h-5 w-5" />
              GitHub not connected
            </p>
            <p className="mt-1 text-sm text-gray-700">
              Connect your GitHub account in Settings to sync your projects with
              repositories.
            </p>
          </div>
        )}

        {hasGitHubAccess && (
          <>
            {/* Mode Toggle */}
            <div className="mb-6 flex gap-4">
              <button
                type="button"
                onClick={() => setRepoMode("new")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 border-3 px-4 py-3 font-bold transition-all",
                  repoMode === "new"
                    ? "border-black bg-brutal-yellow shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    : "border-gray-300 bg-white text-gray-600 hover:border-black",
                )}
              >
                <FolderPlus className="h-5 w-5" />
                Create New Repo
              </button>
              <button
                type="button"
                onClick={() => setRepoMode("existing")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 border-3 px-4 py-3 font-bold transition-all",
                  repoMode === "existing"
                    ? "border-black bg-brutal-yellow shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    : "border-gray-300 bg-white text-gray-600 hover:border-black",
                )}
              >
                <LinkIcon className="h-5 w-5" />
                Connect Existing
              </button>
            </div>

            {/* New Repo Form */}
            {repoMode === "new" && (
              <div className="space-y-6">
                <BrutalInput
                  label="Repository Name"
                  placeholder="my-awesome-book"
                  value={newRepoName}
                  onChange={(e) =>
                    setNewRepoName(e.target.value.replace(/\s+/g, "-"))
                  }
                  errorMessage={errors.newRepoName}
                  helperText="Will be created at github.com/your-username/repository-name"
                />

                {/* Public/Private Toggle */}
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-black">
                    Visibility
                  </label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setIsPrivate(true)}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-2 border-3 px-4 py-3 font-bold transition-all",
                        isPrivate
                          ? "border-black bg-gray-900 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                          : "border-gray-300 bg-white text-gray-600 hover:border-black",
                      )}
                    >
                      <Lock className="h-4 w-4" />
                      Private
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPrivate(false)}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-2 border-3 px-4 py-3 font-bold transition-all",
                        !isPrivate
                          ? "border-black bg-brutal-green text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                          : "border-gray-300 bg-white text-gray-600 hover:border-black",
                      )}
                    >
                      <Globe className="h-4 w-4" />
                      Public
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Existing Repo Form */}
            {repoMode === "existing" && (
              <div className="space-y-6">
                {/* Repo Selector */}
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-black">
                    Select Repository
                  </label>

                  {isLoadingRepos ? (
                    <div className="flex items-center gap-2 border-3 border-gray-200 bg-gray-50 p-4 text-gray-500">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Loading repositories...
                    </div>
                  ) : reposError ? (
                    <div className="border-3 border-brutal-red bg-red-50 p-4">
                      <p className="flex items-center gap-2 text-brutal-red">
                        <AlertCircle className="h-5 w-5" />
                        {reposError}
                      </p>
                      <button
                        type="button"
                        onClick={loadRepos}
                        className="mt-2 text-sm font-bold text-black underline"
                      >
                        Try again
                      </button>
                    </div>
                  ) : (
                    <>
                      <select
                        value={selectedRepo}
                        onChange={(e) => setSelectedRepo(e.target.value)}
                        className={cn(
                          "w-full border-3 bg-white px-4 py-3 font-medium transition-shadow focus:outline-none focus:shadow-[4px_4px_0_0_#000000]",
                          errors.selectedRepo
                            ? "border-brutal-red"
                            : "border-black",
                        )}
                      >
                        <option value="">Choose a repository...</option>
                        {repos.map((repo) => (
                          <option key={repo.id} value={repo.fullName}>
                            {repo.fullName} {repo.private ? "(private)" : ""}
                          </option>
                        ))}
                      </select>
                      {errors.selectedRepo && (
                        <p className="mt-2 text-sm font-medium text-brutal-red">
                          {errors.selectedRepo}
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Structure Detection */}
                {isDetectingStructure && (
                  <div className="border-3 border-gray-300 bg-gray-50 p-4">
                    <p className="flex items-center gap-2 text-gray-600">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Analyzing repository structure...
                    </p>
                  </div>
                )}

                {structureError && (
                  <div className="border-3 border-brutal-red bg-red-50 p-4">
                    <p className="flex items-center gap-2 text-brutal-red">
                      <AlertCircle className="h-5 w-5" />
                      {structureError}
                    </p>
                  </div>
                )}

                {/* Multi-Book Selector */}
                {repoStructure?.type === "multi" && repoStructure.books && (
                  <div>
                    <BookSelector
                      books={repoStructure.books}
                      onSelectionChange={setSelectedBooks}
                    />
                    {errors.books && (
                      <p className="mt-2 text-sm font-medium text-brutal-red">
                        {errors.books}
                      </p>
                    )}
                  </div>
                )}

                {/* Single-Book Chapters Path */}
                {repoStructure?.type === "single" && (
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-black">
                      Chapters Folder
                    </label>
                    <p className="mb-2 text-sm text-gray-600">
                      Select the folder containing your markdown files
                    </p>
                    <FolderPicker
                      repo={selectedRepo}
                      value={chaptersPath}
                      onChange={setChaptersPath}
                    />
                    {chaptersPath && (
                      <p className="mt-2 text-sm text-gray-600">
                        Selected:{" "}
                        <code className="bg-gray-100 px-1">
                          {chaptersPath || "(root)"}
                        </code>
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </section>

      {/* Submit */}
      {submitError && (
        <div className="border-3 border-brutal-red bg-red-50 p-4">
          <p className="flex items-center gap-2 font-bold text-brutal-red">
            <AlertCircle className="h-5 w-5" />
            {submitError}
          </p>
        </div>
      )}

      {submitSuccess && (
        <div className="border-3 border-brutal-green bg-green-50 p-4">
          <p className="flex items-center gap-2 font-bold text-black">
            <CheckCircle className="h-5 w-5 text-brutal-green" />
            Project created successfully! Redirecting...
          </p>
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="border-3 border-black bg-white px-6 py-3 font-bold text-black transition-all hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending || submitSuccess}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 border-3 border-black px-6 py-3 font-bold transition-all",
            isPending || submitSuccess
              ? "cursor-not-allowed bg-gray-200 text-gray-500"
              : "bg-brutal-yellow text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
          )}
        >
          {isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="h-5 w-5" strokeWidth={3} />
              {repoMode === "existing" &&
              repoStructure?.type === "multi" &&
              selectedBooks.length > 1
                ? `Create ${selectedBooks.length} Projects`
                : "Create Project"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
