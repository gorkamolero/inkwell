import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import "@auth/core/jwt";

import { db } from "./db";
import { users, accounts, sessions } from "./db/schema";

const PROTECTED_PATHS = ["/projects", "/settings", "/dashboard"];

const adapter = db
  ? DrizzleAdapter(db, {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
    })
  : undefined;

export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: true,
  trustHost: true,
  adapter,
  session: { strategy: "jwt" },
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id;
      }
      if (account) {
        token.accessToken = account.access_token;
      }
      if (profile) {
        token.login = (profile as { login?: string }).login;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.login = token.login as string;
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtectedRoute = PROTECTED_PATHS.some(
        (path) =>
          nextUrl.pathname === path || nextUrl.pathname.startsWith(`${path}/`)
      );

      if (isProtectedRoute) {
        return isLoggedIn;
      }

      return true;
    },
  },
});

export { auth as getServerSession };

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      login?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    login?: string;
    accessToken?: string;
  }
}
