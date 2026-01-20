/**
 * ImagePastePlugin for Lexical Editor
 *
 * Handles pasting images from clipboard:
 * 1. Intercepts paste events containing images
 * 2. Uploads image to server (or converts to data URL)
 * 3. Inserts ImageNode at cursor position
 */

"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  PASTE_COMMAND,
} from "lexical";
import { useEffect } from "react";
import { $createImageNode } from "@/lib/nodes/ImageNode";

export interface ImagePastePluginProps {
  /**
   * Custom upload handler. If provided, images will be uploaded via this function.
   * Should return the URL of the uploaded image.
   * If not provided, images will be converted to data URLs (not recommended for production).
   */
  onUpload?: (file: File) => Promise<string>;
  /**
   * Maximum file size in bytes. Default: 5MB
   */
  maxFileSize?: number;
  /**
   * Allowed MIME types. Default: image/jpeg, image/png, image/gif, image/webp
   */
  allowedTypes?: string[];
}

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

/**
 * Convert a File to a data URL (fallback when no upload handler provided)
 */
async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Default upload handler - uploads to /api/upload endpoint
 */
async function defaultUploadHandler(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Upload failed");
  }

  const data = await response.json();
  return data.url;
}

export function ImagePastePlugin({
  onUpload,
  maxFileSize = DEFAULT_MAX_SIZE,
  allowedTypes = DEFAULT_ALLOWED_TYPES,
}: ImagePastePluginProps = {}): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        const clipboardData = event.clipboardData;
        if (!clipboardData) {
          return false;
        }

        // Check if there are any image files in the clipboard
        const files = Array.from(clipboardData.files);
        const imageFiles = files.filter((file) =>
          allowedTypes.includes(file.type)
        );

        if (imageFiles.length === 0) {
          // No images, let other paste handlers deal with it
          return false;
        }

        // Prevent default paste behavior
        event.preventDefault();

        // Process each image
        imageFiles.forEach(async (file) => {
          // Check file size
          if (file.size > maxFileSize) {
            console.warn(
              `Image too large: ${file.size} bytes (max: ${maxFileSize})`
            );
            return;
          }

          try {
            // Upload or convert to data URL
            const uploadHandler = onUpload ?? defaultUploadHandler;
            let imageUrl: string;

            try {
              imageUrl = await uploadHandler(file);
            } catch {
              // Fallback to data URL if upload fails
              console.warn("Upload failed, using data URL fallback");
              imageUrl = await fileToDataUrl(file);
            }

            // Insert the image node
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                const imageNode = $createImageNode({
                  src: imageUrl,
                  altText: file.name || "Pasted image",
                });
                selection.insertNodes([imageNode]);
              }
            });
          } catch (error) {
            console.error("Failed to process pasted image:", error);
          }
        });

        return true;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor, onUpload, maxFileSize, allowedTypes]);

  return null;
}
