import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, validateBody } from "@/lib/api-utils";
import type { PublicSession } from "../route";

// ============================================================================
// Types
// ============================================================================

type RouteParams = { params: Promise<{ slug: string }> };

/**
 * Request body for verifying share password
 */
export const VerifyPasswordSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export type VerifyPasswordRequest = z.infer<typeof VerifyPasswordSchema>;

/**
 * Response for password verification
 */
export interface VerifyPasswordResponse {
  success: boolean;
  session?: PublicSession;
  error?: string;
}

// ============================================================================
// POST /api/share/[slug]/verify - Verify password for a protected share
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { slug } = await params;
    await validateBody(request, VerifyPasswordSchema);

    // TODO: Implement password verification
    // 1. Find session by shareSlug
    // 2. Check if session exists and is still valid
    // 3. Verify session is password protected
    // 4. Compare provided password with stored hash (bcrypt)
    // 5. If password matches:
    //    a. Set a session cookie or JWT for continued access
    //    b. Return session data
    // 6. If password doesn't match:
    //    a. Return error with success: false

    console.log("Verifying password for shared session:", slug);

    return NextResponse.json({ message: "Not implemented yet" }, { status: 501 });
  } catch (error) {
    if (error instanceof ApiError) {
      return error.toResponse();
    }
    console.error("Error verifying password:", error);
    return ApiError.internal().toResponse();
  }
}
