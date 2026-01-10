import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db";
import { accounts } from "./db/schema";
import { eq } from "drizzle-orm";

const adapter = db ? DrizzleAdapter(db) : undefined;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      // Request repo scope for GitHub API access (read/write repositories)
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;

        // Fetch the GitHub access token from the accounts table
        if (db) {
          const account = await db
            .select({ accessToken: accounts.access_token })
            .from(accounts)
            .where(eq(accounts.userId, user.id))
            .limit(1);

          if (account[0]?.accessToken) {
            session.accessToken = account[0].accessToken;
          }
        }
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/projects");
      const isOnEditor = nextUrl.pathname.startsWith("/editor");
      const isOnSettings = nextUrl.pathname.startsWith("/settings");

      if (isOnDashboard || isOnEditor || isOnSettings) {
        if (isLoggedIn) return true;
        return false; // Redirect to login
      }

      return true;
    },
  },
});

// Re-export for convenience
export { auth as getServerSession };

// Extend the Session type to include accessToken
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
