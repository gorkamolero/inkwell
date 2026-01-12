"use client";

import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TreeNode {
  name: string;
  path: string;
  type: "tree" | "blob";
  children?: TreeNode[];
}

interface FolderPickerProps {
  repo: string;
  value: string;
  onChange: (path: string) => void;
}

export function FolderPicker({ repo, value, onChange }: FolderPickerProps) {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set([""]));

  useEffect(() => {
    if (!repo) return;

    async function fetchTree() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/github/tree?repo=${encodeURIComponent(repo)}`,
        );
        if (!response.ok) throw new Error("Failed to load folder structure");
        const data = await response.json();
        setTree(data.tree);
      } catch (err) {
        setError("Failed to load folder structure");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchTree();
  }, [repo]);

  const toggleExpand = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const renderNode = (node: TreeNode, depth: number = 0) => {
    if (node.type !== "tree") return null;

    const isExpanded = expanded.has(node.path);
    const isSelected = value === node.path;
    const hasChildren = node.children?.some((c) => c.type === "tree");

    return (
      <div key={node.path}>
        <button
          type="button"
          onClick={() => onChange(node.path)}
          className={cn(
            "flex w-full items-center gap-1 px-2 py-1.5 text-left text-sm font-medium transition-colors hover:bg-gray-100",
            isSelected && "bg-brutal-yellow/30 border-l-3 border-brutal-yellow",
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {hasChildren ? (
            <span
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.path);
              }}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </span>
          ) : (
            <span className="w-5" />
          )}
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 text-brutal-yellow" />
          ) : (
            <Folder className="h-4 w-4 text-brutal-yellow" />
          )}
          <span className={cn(isSelected && "font-bold")}>{node.name}</span>
        </button>

        {isExpanded && node.children && (
          <div>
            {node.children
              .filter((c) => c.type === "tree")
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 border-3 border-gray-200 bg-gray-50 p-4 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading folder structure...
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-3 border-brutal-red bg-red-50 p-4 text-sm text-brutal-red">
        {error}
      </div>
    );
  }

  const folders = tree.filter((n) => n.type === "tree");

  return (
    <div className="border-3 border-black bg-white max-h-64 overflow-y-auto">
      {/* Root option */}
      <button
        type="button"
        onClick={() => onChange("")}
        className={cn(
          "flex w-full items-center gap-1 px-2 py-1.5 text-left text-sm font-medium transition-colors hover:bg-gray-100",
          value === "" && "bg-brutal-yellow/30 border-l-3 border-brutal-yellow",
        )}
      >
        <span className="w-5" />
        <Folder className="h-4 w-4 text-brutal-yellow" />
        <span className={cn(value === "" && "font-bold")}>(root)</span>
      </button>

      {folders
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((node) => renderNode(node, 0))}

      {folders.length === 0 && (
        <p className="p-4 text-sm text-gray-500">
          No folders found in repository
        </p>
      )}
    </div>
  );
}
