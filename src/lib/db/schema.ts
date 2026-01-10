import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================================
// Helper: Generate CUID-like IDs
// ============================================================================

// Note: In actual usage, use a proper CUID library like @paralleldrive/cuid2
// For schema definition, we use text type and handle ID generation in application code

// ============================================================================
// Auth Tables (NextAuth.js compatible)
// ============================================================================

export const users = pgTable("user", {
  id: text("id").primaryKey(),
  email: text("email").unique(),
  name: text("name"),
  image: text("image"),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    access_token: text("access_token"),
    refresh_token: text("refresh_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [unique("account_provider_unique").on(table.provider, table.providerAccountId)]
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

// ============================================================================
// Application Tables
// ============================================================================

export const projects = pgTable(
  "projects",
  {
    id: text("id").primaryKey(), // CUID
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    githubRepo: text("github_repo"), // owner/repo format
    githubBranch: text("github_branch").default("main"),
    chaptersPath: text("chapters_path").default(""), // path to chapters folder
    isPublic: boolean("is_public").default(false),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [unique("projects_user_slug_unique").on(table.userId, table.slug)]
);

export const projectCollaborators = pgTable("project_collaborators", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // 'viewer' | 'editor' | 'admin'
  invitedAt: timestamp("invited_at", { mode: "date" }).defaultNow().notNull(),
  acceptedAt: timestamp("accepted_at", { mode: "date" }),
});

export const documents = pgTable("documents", {
  id: text("id").primaryKey(), // CUID
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  path: text("path").notNull(),
  title: text("title"),
  draftContent: text("draft_content"), // Local draft, not yet committed
  lastSyncedAt: timestamp("last_synced_at", { mode: "date" }),
  lastCommitSha: text("last_commit_sha"), // SHA of last committed version
  wordCount: integer("word_count"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .unique()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripePriceId: text("stripe_price_id"),
  status: text("status").notNull(), // 'active' | 'canceled' | 'past_due' | 'trialing'
  currentPeriodEnd: timestamp("current_period_end", { mode: "date" }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
});

// ============================================================================
// Relations
// ============================================================================

export const usersRelations = relations(users, ({ many, one }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  projects: many(projects),
  collaborations: many(projectCollaborators),
  subscription: one(subscriptions, {
    fields: [users.id],
    references: [subscriptions.userId],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  documents: many(documents),
  collaborators: many(projectCollaborators),
}));

export const projectCollaboratorsRelations = relations(
  projectCollaborators,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectCollaborators.projectId],
      references: [projects.id],
    }),
    user: one(users, {
      fields: [projectCollaborators.userId],
      references: [users.id],
    }),
  })
);

export const documentsRelations = relations(documents, ({ one }) => ({
  project: one(projects, {
    fields: [documents.projectId],
    references: [projects.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// Types
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type ProjectCollaborator = typeof projectCollaborators.$inferSelect;
export type NewProjectCollaborator = typeof projectCollaborators.$inferInsert;

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

// Role type for type safety
export type CollaboratorRole = "viewer" | "editor" | "admin";
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "trialing";
