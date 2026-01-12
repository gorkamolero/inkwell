"use client";

import { Clock, FileText, Globe, Lock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    slug: string;
    isPublic: boolean | null;
    updatedAt: Date;
    _count?: {
      documents: number;
    };
  };
}

// Accent colors for project cards - randomly assigned based on project id
const ACCENT_COLORS = [
  "brutal-yellow",
  "brutal-blue",
  "brutal-pink",
  "brutal-green",
  "brutal-red",
] as const;

function getAccentColor(id: string): (typeof ACCENT_COLORS)[number] {
  // Simple hash based on project id
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash = hash & hash;
  }
  return ACCENT_COLORS[Math.abs(hash) % ACCENT_COLORS.length];
}

export function ProjectCard({ project }: ProjectCardProps) {
  const accentColor = getAccentColor(project.id);
  const docCount = project._count?.documents ?? 0;

  return (
    <Link
      href={`/projects/${project.slug}`}
      className={cn(
        "group relative block border-3 border-black bg-white",
        "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
        "transition-all duration-100 ease-out",
        "hover:translate-x-[-2px] hover:translate-y-[-2px]",
        "hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]",
        "active:translate-x-[2px] active:translate-y-[2px]",
        "active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
      )}
    >
      {/* Colored Top Border */}
      <div className={cn("h-2 w-full", `bg-${accentColor}`)} />

      <div className="p-5">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <h3 className="text-lg font-black text-black group-hover:text-gray-700">
            {project.name}
          </h3>
          {project.isPublic ? (
            <span className="flex items-center gap-1 border-2 border-black bg-brutal-green px-2 py-0.5 text-[10px] font-bold text-black">
              <Globe className="h-3 w-3" />
              PUBLIC
            </span>
          ) : (
            <span className="flex items-center gap-1 border-2 border-black bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-700">
              <Lock className="h-3 w-3" />
              PRIVATE
            </span>
          )}
        </div>

        {/* Description */}
        {project.description && (
          <p className="mb-4 line-clamp-2 text-sm text-gray-600">
            {project.description}
          </p>
        )}

        {/* Footer Stats */}
        <div className="flex items-center gap-4 border-t-2 border-gray-200 pt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            {docCount} {docCount === 1 ? "doc" : "docs"}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {formatRelativeDate(project.updatedAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

// Skeleton loading state
export function ProjectCardSkeleton() {
  return (
    <div className="border-3 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      {/* Colored top bar skeleton */}
      <div className="h-2 w-full animate-pulse bg-gray-200" />

      <div className="p-5">
        {/* Title skeleton */}
        <div className="mb-3 flex items-start justify-between">
          <div className="h-6 w-32 animate-pulse bg-gray-200" />
          <div className="h-5 w-16 animate-pulse bg-gray-200" />
        </div>

        {/* Description skeleton */}
        <div className="mb-4 space-y-2">
          <div className="h-4 w-full animate-pulse bg-gray-100" />
          <div className="h-4 w-3/4 animate-pulse bg-gray-100" />
        </div>

        {/* Footer skeleton */}
        <div className="flex items-center gap-4 border-t-2 border-gray-200 pt-3">
          <div className="h-4 w-16 animate-pulse bg-gray-100" />
          <div className="h-4 w-20 animate-pulse bg-gray-100" />
        </div>
      </div>
    </div>
  );
}
