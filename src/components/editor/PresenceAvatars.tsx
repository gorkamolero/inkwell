"use client";

import { cn } from "@/lib/utils";

/**
 * PresenceAvatars - Shows who's currently in the session
 *
 * Displays a stack of avatars for all users currently viewing
 * or editing the session. Includes self indicator and overflow
 * count for many collaborators.
 */

// =============================================================================
// Types
// =============================================================================

export interface PresenceUser {
  /** User identifier */
  id: string;
  /** Display name */
  name: string;
  /** User's color for cursor/avatar */
  color: string;
  /** Avatar image URL (optional) */
  avatarUrl?: string | null;
  /** Whether this is the current user */
  isSelf?: boolean;
}

export interface PresenceAvatarsProps {
  /** List of users currently in the session */
  users: PresenceUser[];
  /** Maximum avatars to show before +N overflow */
  maxVisible?: number;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional class names */
  className?: string;
}

// =============================================================================
// Constants
// =============================================================================

const SIZES = {
  sm: "h-6 w-6 text-xs",
  md: "h-8 w-8 text-sm",
  lg: "h-10 w-10 text-base",
} as const;

const OVERLAP = {
  sm: "-ml-2",
  md: "-ml-3",
  lg: "-ml-4",
} as const;

// =============================================================================
// Subcomponents
// =============================================================================

interface AvatarProps {
  user: PresenceUser;
  size: "sm" | "md" | "lg";
  isFirst?: boolean;
}

function Avatar({ user, size, isFirst = false }: AvatarProps) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        "border-2 border-black",
        "font-bold text-white",
        "shadow-[2px_2px_0_0_#000]",
        SIZES[size],
        !isFirst && OVERLAP[size],
        user.isSelf && "ring-2 ring-brutal-yellow ring-offset-1",
      )}
      style={{ backgroundColor: user.color }}
      title={user.isSelf ? `${user.name} (you)` : user.name}
    >
      {user.avatarUrl ? (
        // biome-ignore lint/performance/noImgElement: External avatar URLs from various providers
        <img
          src={user.avatarUrl}
          alt={user.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

interface OverflowCountProps {
  count: number;
  size: "sm" | "md" | "lg";
}

function OverflowCount({ count, size }: OverflowCountProps) {
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        "border-2 border-black",
        "bg-gray-200 text-black font-bold",
        "shadow-[2px_2px_0_0_#000]",
        SIZES[size],
        OVERLAP[size],
      )}
      title={`${count} more collaborator${count > 1 ? "s" : ""}`}
    >
      +{count}
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

export function PresenceAvatars({
  users,
  maxVisible = 5,
  size = "md",
  className,
}: PresenceAvatarsProps) {
  // TODO: Integrate with Liveblocks useOthers() and useSelf()
  // TODO: Add real-time updates as users join/leave
  // TODO: Add tooltip with full user list on hover

  // Sort to show self first (if present)
  const sortedUsers = [...users].sort((a, b) => {
    if (a.isSelf) return -1;
    if (b.isSelf) return 1;
    return 0;
  });

  const visibleUsers = sortedUsers.slice(0, maxVisible);
  const overflowCount = Math.max(0, sortedUsers.length - maxVisible);

  if (users.length === 0) {
    return null;
  }

  return (
    <div
      className={cn("flex items-center", className)}
      role="group"
      aria-label={`${users.length} user${users.length > 1 ? "s" : ""} in session`}
    >
      {visibleUsers.map((user, index) => (
        <Avatar key={user.id} user={user} size={size} isFirst={index === 0} />
      ))}

      {overflowCount > 0 && <OverflowCount count={overflowCount} size={size} />}
    </div>
  );
}
