import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getInstallationId, listInstallationRepos } from "@/lib/github-app";

export const dynamic = "force-dynamic";

// ============================================================================
// GET /api/user/repos - List repositories accessible to the GitHub App
// ============================================================================

export async function GET(_request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the user's GitHub login (username) from session
  const username = session.user.login;
  if (!username) {
    return NextResponse.json(
      { error: "GitHub username not found in session. Please sign out and sign in again." },
      { status: 400 }
    );
  }

  try {
    // Find installation for this user
    const installationId = await getInstallationId(username);

    if (!installationId) {
      // No installation found - user needs to install the app
      return NextResponse.json({
        repos: [],
        needsInstall: true,
        installUrl: `https://github.com/apps/hotpress-app/installations/new`,
      });
    }

    // List repos accessible to this installation
    const repos = await listInstallationRepos(installationId);

    return NextResponse.json({
      repos,
      needsInstall: false,
    });
  } catch (error) {
    console.error("Error listing repos:", error);
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}
