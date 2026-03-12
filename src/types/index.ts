import type { SerializedEditorState } from "lexical";

// Re-export database types
export type {
  CollaboratorRole,
  Document,
  NewDocument,
  NewProject,
  NewProjectCollaborator,
  NewSubscription,
  NewUser,
  Project,
  ProjectCollaborator,
  Subscription,
  SubscriptionStatus,
  User,
} from "@/lib/db/schema";

// Editor types
export interface EditorDocument {
  id: string;
  title: string;
  content: SerializedEditorState | null;
  updatedAt: Date;
}

// Project with relations
export interface ProjectWithDocuments {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  publicSlug: string;
  isPublic: boolean | null;
  githubRepo: string | null;
  githubBranch: string | null;
  chaptersPath: string | null;
  documents: DocumentTreeNode[];
  createdAt: Date;
  updatedAt: Date;
}

// Document tree node for sidebar navigation
export interface DocumentTreeNode {
  id: string;
  slug: string;
  title: string | null;
  path: string;
  wordCount: number | null;
  lastSyncedAt: Date | null;
}

// User with subscription info (joined from subscriptions table)
export interface UserWithSubscription {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  subscription: {
    stripeCustomerId: string | null;
    stripePriceId: string | null;
    stripeSubscriptionId: string | null;
    status: string;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean | null;
  } | null;
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Project member roles
export type ProjectRole = "admin" | "editor" | "viewer";

export const PROJECT_ROLE_PERMISSIONS = {
  admin: ["read", "write", "delete", "manage"],
  editor: ["read", "write"],
  viewer: ["read"],
} as const;

export type Permission = (typeof PROJECT_ROLE_PERMISSIONS)[ProjectRole][number];

// Document export formats
export type ExportFormat = "markdown" | "html" | "pdf" | "docx" | "epub";

// GitHub sync status
export type SyncStatus = "synced" | "pending" | "conflict" | "error";

export interface GitHubSyncState {
  status: SyncStatus;
  lastSynced: Date | null;
  localSha: string | null;
  remoteSha: string | null;
  message?: string;
}
