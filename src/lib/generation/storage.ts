/**
 * Storage Utilities
 *
 * Vercel Blob storage for generated PDFs and ePubs.
 */

import { put, del, list } from "@vercel/blob";

const EXPIRY_HOURS = 24;

export interface UploadResult {
  url: string;
  size: number;
  expiresAt: Date;
}

/**
 * Upload a PDF to Vercel Blob storage
 */
export async function uploadPdf(
  jobId: string,
  buffer: Buffer,
  filename: string
): Promise<UploadResult> {
  const blob = await put(`generated/${jobId}/${filename}`, buffer, {
    access: "public",
    contentType: "application/pdf",
  });

  return {
    url: blob.url,
    size: buffer.length,
    expiresAt: new Date(Date.now() + EXPIRY_HOURS * 60 * 60 * 1000),
  };
}

/**
 * Upload an ePub to Vercel Blob storage
 */
export async function uploadEpub(
  jobId: string,
  buffer: Buffer,
  filename: string
): Promise<UploadResult> {
  const blob = await put(`generated/${jobId}/${filename}`, buffer, {
    access: "public",
    contentType: "application/epub+zip",
  });

  return {
    url: blob.url,
    size: buffer.length,
    expiresAt: new Date(Date.now() + EXPIRY_HOURS * 60 * 60 * 1000),
  };
}

/**
 * Delete a file from Vercel Blob storage
 */
export async function deleteFile(url: string): Promise<void> {
  await del(url);
}

/**
 * Clean up expired files (files older than EXPIRY_HOURS)
 */
export async function cleanupExpiredFiles(): Promise<number> {
  const cutoff = new Date(Date.now() - EXPIRY_HOURS * 60 * 60 * 1000);
  let deletedCount = 0;

  // List all blobs in the generated folder
  const { blobs } = await list({ prefix: "generated/" });

  for (const blob of blobs) {
    if (blob.uploadedAt < cutoff) {
      await del(blob.url);
      deletedCount++;
    }
  }

  return deletedCount;
}
