"use client";

import { BookOpenCheck, Plus, GripVertical, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import * as React from "react";
import { BrutalInput } from "@/components/ui";
import { cn } from "@/lib/utils";
import { FormatSection, useFormatContext } from "./FormatPanel";

/**
 * BackMatterSection - Back matter pages configuration
 *
 * Controls for:
 * - Sortable list of back matter items
 * - Item type selection and configuration
 * - Per-item settings (about author, also by, etc.)
 */

// =============================================================================
// Types
// =============================================================================

export interface BackMatterSectionProps {
  /** Default expanded state */
  defaultExpanded?: boolean;
}

interface BackMatterItem {
  type: string;
  [key: string]: unknown;
}

interface BookReference {
  title: string;
  link?: string;
}

// =============================================================================
// Constants
// =============================================================================

const BACK_MATTER_TYPES = [
  { value: "epilogue", label: "Epilogue", description: "Concluding chapter or section" },
  { value: "acknowledgements", label: "Acknowledgements", description: "Thank you notes" },
  { value: "aboutAuthor", label: "About the Author", description: "Author biography" },
  { value: "alsoBy", label: "Also By", description: "Other books by the author" },
  { value: "glossary", label: "Glossary", description: "Terms and definitions" },
  { value: "appendix", label: "Appendix", description: "Supplementary material" },
];

// =============================================================================
// Subcomponents
// =============================================================================

interface BookListEditorProps {
  books: BookReference[];
  onChange: (books: BookReference[]) => void;
}

function BookListEditor({ books, onChange }: BookListEditorProps) {
  const handleAdd = () => {
    onChange([...books, { title: "", link: "" }]);
  };

  const handleRemove = (index: number) => {
    onChange(books.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof BookReference, value: string) => {
    const updated = [...books];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      {books.map((book, index) => (
        <div key={index} className="flex gap-2 items-start">
          <div className="flex-1 space-y-1">
            <input
              type="text"
              value={book.title}
              onChange={(e) => handleChange(index, "title", e.target.value)}
              placeholder="Book title"
              className={cn(
                "w-full h-8 px-2 text-sm",
                "border-2 border-black",
                "bg-white",
                "focus:outline-none focus:shadow-[2px_2px_0_0_#000]",
              )}
            />
            <input
              type="url"
              value={book.link || ""}
              onChange={(e) => handleChange(index, "link", e.target.value)}
              placeholder="Link (optional)"
              className={cn(
                "w-full h-7 px-2 text-xs",
                "border-2 border-gray-300",
                "bg-gray-50",
                "focus:outline-none focus:border-black",
              )}
            />
          </div>
          <button
            type="button"
            onClick={() => handleRemove(index)}
            className="p-1 text-gray-500 hover:text-red-600 mt-1"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={handleAdd}
        className={cn(
          "w-full flex items-center justify-center gap-1",
          "px-3 py-1.5",
          "border-2 border-dashed border-gray-300",
          "text-xs text-gray-500",
          "hover:border-black hover:text-black",
          "transition-colors duration-100",
        )}
      >
        <Plus className="h-3 w-3" />
        Add Book
      </button>
    </div>
  );
}

interface ItemEditorProps {
  item: BackMatterItem;
  onChange: (item: BackMatterItem) => void;
}

function ItemEditor({ item, onChange }: ItemEditorProps) {
  const handleFieldChange = (key: string, value: unknown) => {
    onChange({ ...item, [key]: value });
  };

  switch (item.type) {
    case "epilogue":
    case "acknowledgements":
    case "glossary":
      return (
        <div className="space-y-2 pt-2">
          <p className="text-xs text-gray-500">
            Content will be pulled from your document&apos;s {item.type} section, or you can add custom text:
          </p>
          <textarea
            value={(item.content as string) || ""}
            onChange={(e) => handleFieldChange("content", e.target.value)}
            placeholder={`Enter ${item.type} content...`}
            rows={3}
            className={cn(
              "w-full px-3 py-2 text-sm",
              "border-2 border-black",
              "bg-white",
              "resize-y min-h-[80px]",
              "focus:outline-none focus:shadow-[2px_2px_0_0_#000]",
            )}
          />
        </div>
      );

    case "aboutAuthor":
      return (
        <div className="space-y-3 pt-2">
          <textarea
            value={(item.content as string) || ""}
            onChange={(e) => handleFieldChange("content", e.target.value)}
            placeholder="Author biography..."
            rows={4}
            className={cn(
              "w-full px-3 py-2 text-sm",
              "border-2 border-black",
              "bg-white",
              "resize-y min-h-[100px]",
              "focus:outline-none focus:shadow-[2px_2px_0_0_#000]",
            )}
          />
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider">
              Author Photo
            </label>
            <div
              className={cn(
                "h-20 flex items-center justify-center",
                "border-2 border-dashed border-gray-300",
                "bg-gray-50",
                "text-gray-400 text-xs",
                "cursor-not-allowed",
              )}
            >
              Upload photo (coming soon)
            </div>
          </div>
        </div>
      );

    case "alsoBy":
      return (
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-bold uppercase tracking-wider">
            Other Books
          </label>
          <BookListEditor
            books={(item.books as BookReference[]) || []}
            onChange={(books) => handleFieldChange("books", books)}
          />
        </div>
      );

    case "appendix":
      return (
        <div className="space-y-2 pt-2">
          <BrutalInput
            label="Appendix Title"
            value={(item.title as string) || ""}
            onChange={(e) => handleFieldChange("title", e.target.value)}
            placeholder="Appendix A: Additional Notes"
            size="sm"
          />
          <textarea
            value={(item.content as string) || ""}
            onChange={(e) => handleFieldChange("content", e.target.value)}
            placeholder="Appendix content..."
            rows={3}
            className={cn(
              "w-full px-3 py-2 text-sm",
              "border-2 border-black",
              "bg-white",
              "resize-y min-h-[80px]",
              "focus:outline-none focus:shadow-[2px_2px_0_0_#000]",
            )}
          />
        </div>
      );

    default:
      return null;
  }
}

interface BackMatterItemCardProps {
  item: BackMatterItem;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onChange: (item: BackMatterItem) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

function BackMatterItemCard({
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
}: BackMatterItemCardProps) {
  const typeInfo = BACK_MATTER_TYPES.find((t) => t.value === item.type);

  return (
    <div className={cn(
      "border-3 border-black",
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

export function BackMatterSection({
  defaultExpanded = false,
}: BackMatterSectionProps) {
  const { config, updateConfig } = useFormatContext();
  const configAny = config as Record<string, unknown>;
  const backMatter = ((configAny.backMatter as BackMatterItem[]) || []);
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null);
  const [showAddMenu, setShowAddMenu] = React.useState(false);

  const handleAdd = (type: string) => {
    const newItem: BackMatterItem = { type };

    // Add default values based on type
    if (type === "alsoBy") {
      newItem.books = [];
    }

    updateConfig({
      backMatter: [...backMatter, newItem],
    } as Record<string, unknown>);
    setExpandedIndex(backMatter.length);
    setShowAddMenu(false);
  };

  const handleRemove = (index: number) => {
    updateConfig({
      backMatter: backMatter.filter((_, i) => i !== index),
    } as Record<string, unknown>);
    setExpandedIndex(null);
  };

  const handleChange = (index: number, item: BackMatterItem) => {
    const updated = [...backMatter];
    updated[index] = item;
    updateConfig({ backMatter: updated } as Record<string, unknown>);
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= backMatter.length) return;

    const updated = [...backMatter];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    updateConfig({ backMatter: updated } as Record<string, unknown>);
    setExpandedIndex(newIndex);
  };

  // Get types that haven't been added yet (some can only appear once)
  const singleUseTypes = ["aboutAuthor", "alsoBy", "acknowledgements"];
  const usedSingleTypes = backMatter
    .filter((item) => singleUseTypes.includes(item.type))
    .map((item) => item.type);
  const availableTypes = BACK_MATTER_TYPES.filter(
    (t) => !singleUseTypes.includes(t.value) || !usedSingleTypes.includes(t.value)
  );

  return (
    <FormatSection
      title="Back Matter"
      icon={<BookOpenCheck className="h-4 w-4" />}
      defaultExpanded={defaultExpanded}
    >
      <p className="text-xs text-gray-500 mb-3">
        Pages that appear after your main content. Drag to reorder.
      </p>

      {/* Items List */}
      <div className="space-y-2">
        {backMatter.map((item, index) => (
          <BackMatterItemCard
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
            isLast={index === backMatter.length - 1}
          />
        ))}

        {backMatter.length === 0 && (
          <div className="py-8 text-center text-gray-400 border-2 border-dashed border-gray-200">
            <p className="text-sm">No back matter pages</p>
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
            "border-3 border-black",
            "font-bold text-sm",
            "bg-brutal-pink text-black",
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
            <div className="absolute bottom-full left-0 right-0 mb-1 z-20 bg-white border-3 border-black shadow-[4px_4px_0_0_#000] max-h-64 overflow-y-auto">
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
      {backMatter.length > 0 && (
        <div className="mt-4 p-3 border-3 border-black bg-gray-50">
          <p className="text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">
            Page Order
          </p>
          <div className="flex flex-wrap gap-1">
            {backMatter.map((item, index) => {
              const typeInfo = BACK_MATTER_TYPES.find((t) => t.value === item.type);
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
