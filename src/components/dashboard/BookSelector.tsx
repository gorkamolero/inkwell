"use client";

import { Book, Check, CheckSquare, Square } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface DetectedBook {
  name: string;
  path: string;
}

interface BookSelectorProps {
  books: DetectedBook[];
  onSelectionChange: (selectedBooks: DetectedBook[]) => void;
}

interface SelectAllIconProps {
  allSelected: boolean;
  someSelected: boolean;
}

function SelectAllIcon({
  allSelected,
  someSelected,
}: SelectAllIconProps): React.ReactNode {
  if (allSelected) {
    return <CheckSquare className="h-4 w-4 text-brutal-blue" />;
  }

  if (someSelected) {
    return (
      <div className="relative h-4 w-4">
        <Square className="h-4 w-4" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-2 w-2 bg-brutal-blue" />
        </div>
      </div>
    );
  }

  return <Square className="h-4 w-4" />;
}

export function BookSelector({ books, onSelectionChange }: BookSelectorProps) {
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set());

  const handleToggle = (bookPath: string) => {
    const newSelection = new Set(selectedBooks);
    if (newSelection.has(bookPath)) {
      newSelection.delete(bookPath);
    } else {
      newSelection.add(bookPath);
    }
    setSelectedBooks(newSelection);
    onSelectionChange(books.filter((b) => newSelection.has(b.path)));
  };

  const handleSelectAll = () => {
    if (selectedBooks.size === books.length) {
      setSelectedBooks(new Set());
      onSelectionChange([]);
    } else {
      const allPaths = new Set(books.map((b) => b.path));
      setSelectedBooks(allPaths);
      onSelectionChange(books);
    }
  };

  const allSelected = selectedBooks.size === books.length;
  const someSelected =
    selectedBooks.size > 0 && selectedBooks.size < books.length;

  return (
    <div className="border-3 border-black bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b-3 border-black bg-brutal-blue px-4 py-3">
        <h4 className="font-bold text-white">Multi-Book Repository Detected</h4>
        <span className="border-2 border-white bg-white px-2 py-0.5 text-xs font-bold text-black">
          {books.length} books found
        </span>
      </div>

      {/* Description */}
      <div className="border-b-2 border-gray-200 bg-gray-50 px-4 py-3">
        <p className="text-sm text-gray-700">
          This repository contains multiple books. Select which ones you want to
          add. Each book will be created as a separate project.
        </p>
      </div>

      {/* Select All */}
      <div className="border-b-2 border-gray-200 px-4 py-2">
        <button
          type="button"
          onClick={handleSelectAll}
          className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-black"
        >
          <SelectAllIcon
            allSelected={allSelected}
            someSelected={someSelected}
          />
          {allSelected ? "Deselect All" : "Select All"}
        </button>
      </div>

      {/* Book List */}
      <ul className="divide-y-2 divide-gray-100">
        {books.map((book) => {
          const isSelected = selectedBooks.has(book.path);
          return (
            <li key={book.path}>
              <button
                type="button"
                onClick={() => handleToggle(book.path)}
                className={cn(
                  "flex w-full items-center gap-4 px-4 py-4 text-left transition-colors",
                  isSelected ? "bg-brutal-yellow/20" : "hover:bg-gray-50",
                )}
              >
                {/* Checkbox */}
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center border-3 transition-colors",
                    isSelected
                      ? "border-black bg-brutal-green"
                      : "border-gray-400 bg-white",
                  )}
                >
                  {isSelected && (
                    <Check className="h-4 w-4 text-black" strokeWidth={3} />
                  )}
                </div>

                {/* Book Icon */}
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center border-2",
                    isSelected
                      ? "border-black bg-brutal-yellow"
                      : "border-gray-300 bg-gray-100",
                  )}
                >
                  <Book
                    className={cn(
                      "h-5 w-5",
                      isSelected ? "text-black" : "text-gray-500",
                    )}
                  />
                </div>

                {/* Book Info */}
                <div className="flex-1">
                  <p
                    className={cn(
                      "font-bold",
                      isSelected ? "text-black" : "text-gray-700",
                    )}
                  >
                    {book.name}
                  </p>
                  <p className="text-xs text-gray-500 font-mono">{book.path}</p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Footer */}
      {selectedBooks.size > 0 && (
        <div className="border-t-3 border-black bg-gray-50 px-4 py-3">
          <p className="text-sm font-bold text-black">
            {selectedBooks.size} book{selectedBooks.size !== 1 ? "s" : ""}{" "}
            selected
          </p>
          <p className="text-xs text-gray-500">
            Each selected book will become its own project
          </p>
        </div>
      )}
    </div>
  );
}

// Loading skeleton
export function BookSelectorSkeleton() {
  return (
    <div className="border-3 border-black bg-white">
      <div className="animate-pulse border-b-3 border-black bg-gray-200 px-4 py-3">
        <div className="h-5 w-48 bg-gray-300" />
      </div>
      <div className="space-y-4 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-6 w-6 animate-pulse bg-gray-200" />
            <div className="h-10 w-10 animate-pulse bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 animate-pulse bg-gray-200" />
              <div className="h-3 w-48 animate-pulse bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
