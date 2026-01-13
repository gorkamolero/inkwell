"use client";

import { BookOpen, Plus, GripVertical, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import * as React from "react";
import { BrutalInput } from "@/components/ui";
import { cn } from "@/lib/utils";
import { FormatSection, useFormatContext } from "./FormatPanel";

/**
 * FrontMatterSection - Front matter pages configuration
 *
 * Controls for:
 * - Sortable list of front matter items
 * - Item type selection and configuration
 * - Per-item settings (dedication text, epigraph, etc.)
 */

// =============================================================================
// Types
// =============================================================================

export interface FrontMatterSectionProps {
  /** Default expanded state */
  defaultExpanded?: boolean;
}

interface FrontMatterItem {
  type: string;
  [key: string]: unknown;
}

// =============================================================================
// Constants
// =============================================================================

const FRONT_MATTER_TYPES = [
  { value: "halfTitle", label: "Half Title", description: "Book title only, centered" },
  { value: "title", label: "Title Page", description: "Full title, author, publisher" },
  { value: "copyright", label: "Copyright", description: "Copyright notice, ISBN, edition" },
  { value: "dedication", label: "Dedication", description: "To whom the book is dedicated" },
  { value: "epigraph", label: "Epigraph", description: "Opening quote or poem" },
  { value: "toc", label: "Table of Contents", description: "Auto-generated chapter list" },
  { value: "preface", label: "Preface", description: "Author's introduction" },
  { value: "foreword", label: "Foreword", description: "Introduction by another author" },
];

const COPYRIGHT_TEMPLATES = [
  { value: "fiction", label: "Fiction" },
  { value: "nonfiction", label: "Non-Fiction" },
  { value: "minimal", label: "Minimal" },
];

const TEXT_ALIGNMENTS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

// =============================================================================
// Subcomponents
// =============================================================================

interface ItemEditorProps {
  item: FrontMatterItem;
  onChange: (item: FrontMatterItem) => void;
}

function ItemEditor({ item, onChange }: ItemEditorProps) {
  const handleFieldChange = (key: string, value: unknown) => {
    onChange({ ...item, [key]: value });
  };

  switch (item.type) {
    case "title":
      return (
        <div className="space-y-2 pt-2">
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={(item.includeSubtitle as boolean) ?? true}
              onChange={(e) => handleFieldChange("includeSubtitle", e.target.checked)}
              className="w-4 h-4 border-2 border-black"
            />
            Include subtitle
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={(item.includeAuthor as boolean) ?? true}
              onChange={(e) => handleFieldChange("includeAuthor", e.target.checked)}
              className="w-4 h-4 border-2 border-black"
            />
            Include author name
          </label>
        </div>
      );

    case "copyright":
      return (
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-bold uppercase tracking-wider">
            Template
          </label>
          <select
            value={(item.template as string) || "fiction"}
            onChange={(e) => handleFieldChange("template", e.target.value)}
            className={cn(
              "w-full h-9 px-3 text-sm",
              "border-2 border-black",
              "bg-white text-black",
              "focus:outline-none focus:shadow-[2px_2px_0_0_#000]",
            )}
          >
            {COPYRIGHT_TEMPLATES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      );

    case "dedication":
      return (
        <div className="space-y-2 pt-2">
          <BrutalInput
            label="Dedication Text"
            value={(item.content as string) || ""}
            onChange={(e) => handleFieldChange("content", e.target.value)}
            placeholder="For my family..."
            size="sm"
          />
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider">
              Alignment
            </label>
            <div className="flex gap-1">
              {TEXT_ALIGNMENTS.map(({ value, label }) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => handleFieldChange("align", value)}
                  className={cn(
                    "flex-1 px-2 py-1 text-xs",
                    "border-2 border-black",
                    "transition-all duration-100",
                    ((item.align as string) || "center") === value
                      ? "bg-brutal-blue text-white"
                      : "bg-white text-black",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      );

    case "epigraph":
      return (
        <div className="space-y-2 pt-2">
          <BrutalInput
            label="Quote"
            value={(item.quote as string) || ""}
            onChange={(e) => handleFieldChange("quote", e.target.value)}
            placeholder="Enter the quote..."
            size="sm"
          />
          <BrutalInput
            label="Attribution"
            value={(item.attribution as string) || ""}
            onChange={(e) => handleFieldChange("attribution", e.target.value)}
            placeholder="— Author Name"
            size="sm"
          />
        </div>
      );

    case "toc":
      return (
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-bold uppercase tracking-wider">
            Depth
          </label>
          <div className="flex gap-1">
            {[1, 2, 3].map((depth) => (
              <button
                type="button"
                key={depth}
                onClick={() => handleFieldChange("depth", depth)}
                className={cn(
                  "w-10 h-8 text-sm font-bold",
                  "border-2 border-black",
                  "transition-all duration-100",
                  ((item.depth as number) || 1) === depth
                    ? "bg-brutal-yellow text-black"
                    : "bg-white text-black",
                )}
              >
                {depth}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500">Heading levels to include</p>
        </div>
      );

    case "preface":
    case "foreword":
      return (
        <div className="space-y-2 pt-2">
          <p className="text-xs text-gray-500">
            Content will be pulled from your document&apos;s {item.type} section.
          </p>
          {item.type === "foreword" && (
            <BrutalInput
              label="Foreword Author"
              value={(item.author as string) || ""}
              onChange={(e) => handleFieldChange("author", e.target.value)}
              placeholder="Guest author name"
              size="sm"
            />
          )}
        </div>
      );

    default:
      return null;
  }
}

interface FrontMatterItemCardProps {
  item: FrontMatterItem;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onChange: (item: FrontMatterItem) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

function FrontMatterItemCard({
  item,
  index,
  expanded,
  onToggle,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: FrontMatterItemCardProps) {
  const typeInfo = FRONT_MATTER_TYPES.find((t) => t.value === item.type);

  return (
    <div className={cn(
      "border-brutal",
      "bg-white",
      "transition-shadow duration-100",
      expanded && "shadow-[4px_4px_0_0_#000]",
    )}>
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50"
        onClick={onToggle}
      >
        <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <span className="text-xs font-bold text-gray-400 w-5">{index + 1}</span>
        <div className="flex-1 min-w-0">
          <span className="font-bold text-sm">{typeInfo?.label || item.type}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
            disabled={isFirst}
            className={cn(
              "p-1",
              isFirst ? "text-gray-300" : "text-gray-500 hover:text-black",
            )}
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
            disabled={isLast}
            className={cn(
              "p-1",
              isLast ? "text-gray-300" : "text-gray-500 hover:text-black",
            )}
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="p-1 text-gray-500 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 mt-2">{typeInfo?.description}</p>
          <ItemEditor item={item} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

export function FrontMatterSection({
  defaultExpanded = false,
}: FrontMatterSectionProps) {
  const { config, updateConfig } = useFormatContext();
  const configAny = config as Record<string, unknown>;
  const frontMatter = ((configAny.frontMatter as FrontMatterItem[]) || []);
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null);
  const [showAddMenu, setShowAddMenu] = React.useState(false);

  const handleAdd = (type: string) => {
    const newItem: FrontMatterItem = { type };

    // Add default values based on type
    if (type === "title") {
      newItem.includeSubtitle = true;
      newItem.includeAuthor = true;
    } else if (type === "dedication") {
      newItem.align = "center";
    } else if (type === "toc") {
      newItem.depth = 1;
    } else if (type === "copyright") {
      newItem.template = "fiction";
    }

    updateConfig({
      frontMatter: [...frontMatter, newItem],
    } as Record<string, unknown>);
    setExpandedIndex(frontMatter.length);
    setShowAddMenu(false);
  };

  const handleRemove = (index: number) => {
    updateConfig({
      frontMatter: frontMatter.filter((_, i) => i !== index),
    } as Record<string, unknown>);
    setExpandedIndex(null);
  };

  const handleChange = (index: number, item: FrontMatterItem) => {
    const updated = [...frontMatter];
    updated[index] = item;
    updateConfig({ frontMatter: updated } as Record<string, unknown>);
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= frontMatter.length) return;

    const updated = [...frontMatter];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    updateConfig({ frontMatter: updated } as Record<string, unknown>);
    setExpandedIndex(newIndex);
  };

  // Get types that haven't been added yet (some can only appear once)
  const singleUseTypes = ["halfTitle", "title", "copyright", "toc"];
  const usedSingleTypes = frontMatter
    .filter((item) => singleUseTypes.includes(item.type))
    .map((item) => item.type);
  const availableTypes = FRONT_MATTER_TYPES.filter(
    (t) => !singleUseTypes.includes(t.value) || !usedSingleTypes.includes(t.value)
  );

  return (
    <FormatSection
      title="Front Matter"
      icon={<BookOpen className="h-4 w-4" />}
      defaultExpanded={defaultExpanded}
    >
      <p className="text-xs text-gray-500 mb-3">
        Pages that appear before your main content. Drag to reorder.
      </p>

      {/* Items List */}
      <div className="space-y-2">
        {frontMatter.map((item, index) => (
          <FrontMatterItemCard
            key={`${item.type}-${index}`}
            item={item}
            index={index}
            expanded={expandedIndex === index}
            onToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
            onChange={(updated) => handleChange(index, updated)}
            onRemove={() => handleRemove(index)}
            onMoveUp={() => handleMove(index, "up")}
            onMoveDown={() => handleMove(index, "down")}
            isFirst={index === 0}
            isLast={index === frontMatter.length - 1}
          />
        ))}

        {frontMatter.length === 0 && (
          <div className="py-8 text-center text-gray-400 border-2 border-dashed border-gray-200">
            <p className="text-sm">No front matter pages</p>
            <p className="text-xs mt-1">Click &quot;Add Page&quot; to get started</p>
          </div>
        )}
      </div>

      {/* Add Button */}
      <div className="relative mt-3">
        <button
          type="button"
          onClick={() => setShowAddMenu(!showAddMenu)}
          className={cn(
            "w-full flex items-center justify-center gap-2",
            "px-4 py-2",
            "border-brutal",
            "font-bold text-sm",
            "bg-brutal-green text-black",
            "shadow-[4px_4px_0_0_#000]",
            "hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_#000]",
            "active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#000]",
            "transition-all duration-100",
          )}
        >
          <Plus className="h-4 w-4" />
          Add Page
        </button>

        {showAddMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowAddMenu(false)}
            />
            <div className="absolute bottom-full left-0 right-0 mb-1 z-20 bg-white border-brutal shadow-[4px_4px_0_0_#000] max-h-64 overflow-y-auto">
              {availableTypes.map(({ value, label, description }) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => handleAdd(value)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-200 last:border-b-0"
                >
                  <span className="block font-bold text-sm">{label}</span>
                  <span className="block text-xs text-gray-500">{description}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Preview */}
      {frontMatter.length > 0 && (
        <div className="mt-4 p-3 border-brutal bg-gray-50">
          <p className="text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">
            Page Order
          </p>
          <div className="flex flex-wrap gap-1">
            {frontMatter.map((item, index) => {
              const typeInfo = FRONT_MATTER_TYPES.find((t) => t.value === item.type);
              return (
                <span
                  key={index}
                  className="px-2 py-0.5 bg-white border-2 border-black text-xs font-bold"
                >
                  {typeInfo?.label || item.type}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </FormatSection>
  );
}
