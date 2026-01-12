import { count, eq } from "drizzle-orm";
import {
  db,
  documents,
  projectCollaborators,
  projects,
  subscriptions,
} from "@/lib/db";
import { getTierFromPriceId, PRICING, type Tier } from "@/lib/stripe";

// ============================================================================
// Tier Determination
// ============================================================================

/**
 * Get the subscription tier for a user
 * Returns 'free' | 'pro' | 'team' based on their active subscription
 */
export async function getUserTier(
  userId: string,
): Promise<"free" | "pro" | "team"> {
  if (!db) {
    return "free";
  }

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  });

  // No subscription or inactive/canceled = free tier
  if (
    !subscription ||
    subscription.status === "canceled" ||
    subscription.status === "past_due"
  ) {
    return "free";
  }

  // Check if subscription has expired
  if (
    subscription.currentPeriodEnd &&
    subscription.currentPeriodEnd < new Date()
  ) {
    return "free";
  }

  const tier = getTierFromPriceId(subscription.stripePriceId);
  return tier.toLowerCase() as "free" | "pro" | "team";
}

/**
 * Get the PRICING tier enum for a user (uppercase)
 */
export async function getUserPricingTier(userId: string): Promise<Tier> {
  const tier = await getUserTier(userId);
  return tier.toUpperCase() as Tier;
}

// ============================================================================
// Limit Checking Functions
// ============================================================================

/**
 * Check if a user can create a new project
 */
export async function canCreateProject(userId: string): Promise<boolean> {
  if (!db) {
    return false;
  }

  const tier = await getUserPricingTier(userId);
  const limits = PRICING[tier];

  // Unlimited projects
  if (limits.projects === Infinity) {
    return true;
  }

  // Count existing projects
  const result = await db
    .select({ count: count() })
    .from(projects)
    .where(eq(projects.userId, userId));

  const projectCount = result[0]?.count ?? 0;
  return projectCount < limits.projects;
}

/**
 * Check if a document can be added to a project
 */
export async function canAddDocument(projectId: string): Promise<boolean> {
  if (!db) {
    return false;
  }

  // Get the project owner's userId
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  });

  if (!project) {
    return false;
  }

  const tier = await getUserPricingTier(project.userId);
  const limits = PRICING[tier];

  // Unlimited documents
  if (limits.docsPerProject === Infinity) {
    return true;
  }

  // Count existing documents in this project
  const result = await db
    .select({ count: count() })
    .from(documents)
    .where(eq(documents.projectId, projectId));

  const docCount = result[0]?.count ?? 0;
  return docCount < limits.docsPerProject;
}

/**
 * Check if a collaborator can be added to a project
 */
export async function canAddCollaborator(projectId: string): Promise<boolean> {
  if (!db) {
    return false;
  }

  // Get the project owner's userId
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  });

  if (!project) {
    return false;
  }

  const tier = await getUserPricingTier(project.userId);
  const limits = PRICING[tier];

  // Unlimited collaborators
  if (limits.collaborators === Infinity) {
    return true;
  }

  // Free tier: no collaborators allowed
  if (limits.collaborators === 0) {
    return false;
  }

  // Count existing collaborators on this project
  const result = await db
    .select({ count: count() })
    .from(projectCollaborators)
    .where(eq(projectCollaborators.projectId, projectId));

  const collaboratorCount = result[0]?.count ?? 0;
  return collaboratorCount < limits.collaborators;
}

// ============================================================================
// Usage Statistics
// ============================================================================

/**
 * Get usage statistics for a user
 */
export async function getUserUsage(userId: string) {
  if (!db) {
    return {
      projects: { used: 0, limit: PRICING.FREE.projects },
      docsPerProject: { limit: PRICING.FREE.docsPerProject },
      collaborators: { limit: PRICING.FREE.collaborators },
    };
  }

  const tier = await getUserPricingTier(userId);
  const limits = PRICING[tier];

  // Count projects
  const projectResult = await db
    .select({ count: count() })
    .from(projects)
    .where(eq(projects.userId, userId));

  const projectCount = projectResult[0]?.count ?? 0;

  return {
    tier: tier.toLowerCase() as "free" | "pro" | "team",
    projects: {
      used: projectCount,
      limit: limits.projects,
      canCreate: projectCount < limits.projects || limits.projects === Infinity,
    },
    docsPerProject: {
      limit: limits.docsPerProject,
    },
    collaborators: {
      limit: limits.collaborators,
    },
  };
}

/**
 * Get usage for a specific project (documents and collaborators)
 */
export async function getProjectUsage(projectId: string) {
  if (!db) {
    return null;
  }

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  });

  if (!project) {
    return null;
  }

  const tier = await getUserPricingTier(project.userId);
  const limits = PRICING[tier];

  // Count documents
  const docResult = await db
    .select({ count: count() })
    .from(documents)
    .where(eq(documents.projectId, projectId));

  const docCount = docResult[0]?.count ?? 0;

  // Count collaborators
  const collabResult = await db
    .select({ count: count() })
    .from(projectCollaborators)
    .where(eq(projectCollaborators.projectId, projectId));

  const collaboratorCount = collabResult[0]?.count ?? 0;

  return {
    tier: tier.toLowerCase() as "free" | "pro" | "team",
    documents: {
      used: docCount,
      limit: limits.docsPerProject,
      canAdd:
        docCount < limits.docsPerProject || limits.docsPerProject === Infinity,
    },
    collaborators: {
      used: collaboratorCount,
      limit: limits.collaborators,
      canAdd:
        limits.collaborators === Infinity ||
        (limits.collaborators > 0 && collaboratorCount < limits.collaborators),
    },
  };
}
