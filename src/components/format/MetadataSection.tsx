"use client";

import { BookMarked, X } from "lucide-react";
import * as React from "react";
import { BrutalInput } from "@/components/ui";
import { cn } from "@/lib/utils";
import { FormatSection, useFormatContext } from "./FormatPanel";

/**
 * MetadataSection - Book metadata settings
 *
 * Controls for:
 * - Title, subtitle, author
 * - Series name and number
 * - Language selection
 * - ISBN
 * - Tags
 */

// =============================================================================
// Types
// =============================================================================

export interface MetadataSectionProps {
  /** Default expanded state */
  defaultExpanded?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "nl", label: "Dutch" },
  { value: "ja", label: "Japanese" },
  { value: "zh", label: "Chinese" },
  { value: "ko", label: "Korean" },
];

// =============================================================================
// Subcomponents
// =============================================================================

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

function TagInput({ tags, onChange }: TagInputProps) {
  const [input, setInput] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && input === "" && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      setInput("");
    }
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold uppercase tracking-wider">
        Tags
      </label>
      <div
        className={cn(
          "min-h-10 px-2 py-1",
          "border-3 border-black",
          "bg-white",
          "flex flex-wrap items-center gap-1.5",
          "focus-within:shadow-[4px_4px_0_0_#000]",
          "transition-shadow duration-100",
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag, index) => (
          <span
            key={tag}
            className={cn(
              "inline-flex items-center gap-1",
              "px-2 py-0.5",
              "bg-brutal-pink border-2 border-black",
              "text-xs font-bold",
            )}
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(index);
              }}
              className="hover:text-red-600"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={tags.length === 0 ? "Type and press Enter..." : ""}
          className="flex-1 min-w-[100px] outline-none bg-transparent text-sm"
        />
      </div>
      <p className="text-xs text-gray-500">
        Press Enter or comma to add a tag
      </p>
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

export function MetadataSection({
  defaultExpanded = false,
}: MetadataSectionProps) {
  const { config, updateConfig } = useFormatContext();
  const meta = (config as Record<string, unknown>).meta as Record<string, unknown> || {};

  const handleChange = (key: string, value: string | number | string[] | Record<string, unknown>) => {
    updateConfig({
      meta: {
        ...meta,
        [key]: value,
      },
    } as Record<string, unknown>);
  };

  const handleSeriesChange = (key: string, value: string | number) => {
    const series = (meta.series as Record<string, unknown>) || {};
    handleChange("series", {
      ...series,
      [key]: value,
    });
  };

  return (
    <FormatSection
      title="Metadata"
      icon={<BookMarked className="h-4 w-4" />}
      defaultExpanded={defaultExpanded}
    >
      {/* Title & Subtitle */}
      <div className="space-y-3">
        <BrutalInput
          label="Title"
          value={(meta.title as string) || ""}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Enter book title"
        />
        <BrutalInput
          label="Subtitle"
          value={(meta.subtitle as string) || ""}
          onChange={(e) => handleChange("subtitle", e.target.value)}
          placeholder="Optional subtitle"
        />
      </div>

      {/* Author */}
      <div className="pt-4 border-t-2 border-gray-200">
        <BrutalInput
          label="Author"
          value={(meta.author as string) || ""}
          onChange={(e) => handleChange("author", e.target.value)}
          placeholder="Author name"
        />
      </div>

      {/* Series */}
      <div className="space-y-3 pt-4 border-t-2 border-gray-200">
        <label className="block text-xs font-bold uppercase tracking-wider">
          Series (Optional)
        </label>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <BrutalInput
              value={((meta.series as Record<string, unknown>)?.name as string) || ""}
              onChange={(e) => handleSeriesChange("name", e.target.value)}
              placeholder="Series name"
              size="sm"
            />
          </div>
          <BrutalInput
            type="number"
            value={((meta.series as Record<string, unknown>)?.number as number) || ""}
            onChange={(e) =>
              handleSeriesChange("number", parseInt(e.target.value, 10) || 0)
            }
            placeholder="#"
            size="sm"
          />
        </div>
        <p className="text-xs text-gray-500">
          Book number in the series (e.g., "The Stormlight Archive" #2)
        </p>
      </div>

      {/* Language & ISBN */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t-2 border-gray-200">
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider">
            Language
          </label>
          <select
            value={(meta.language as string) || "en"}
            onChange={(e) => handleChange("language", e.target.value)}
            className={cn(
              "w-full h-10 px-3",
              "border-3 border-black",
              "bg-white text-black",
              "font-medium",
              "focus:outline-none focus:shadow-[4px_4px_0_0_#000]",
              "transition-shadow duration-100",
            )}
          >
            {LANGUAGES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <BrutalInput
          label="ISBN"
          value={(meta.isbn as string) || ""}
          onChange={(e) => handleChange("isbn", e.target.value)}
          placeholder="978-0-XXX-XXXXX-X"
          size="sm"
        />
      </div>

      {/* Tags */}
      <div className="pt-4 border-t-2 border-gray-200">
        <TagInput
          tags={(meta.tags as string[]) || []}
          onChange={(tags) => handleChange("tags", tags)}
        />
      </div>

      {/* Preview */}
      <div className="mt-4 p-4 border-3 border-black bg-gray-50">
        <p className="text-xs font-bold uppercase tracking-wider mb-3 text-gray-500">
          Title Page Preview
        </p>
        <div className="text-center space-y-2">
          {(() => {
            const series = meta.series as Record<string, unknown> | undefined;
            if (!series?.name) return null;
            return (
              <p className="text-xs uppercase tracking-widest text-gray-500">
                {String(series.name)}
                {series.number ? ` • Book ${String(series.number)}` : ""}
              </p>
            );
          })()}
          <h3 className="text-xl font-bold">
            {String(meta.title || "Your Title")}
          </h3>
          {meta.subtitle ? (
            <p className="text-sm italic text-gray-600">{String(meta.subtitle)}</p>
          ) : null}
          <p className="text-sm pt-4">{String(meta.author || "Author Name")}</p>
        </div>
      </div>
    </FormatSection>
  );
}
