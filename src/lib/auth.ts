import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import "@auth/core/jwt";

import { db } from "./db";
import { accounts, sessions, users } from "./db/schema";

const PROTECTED_PATHS = ["/projects", "/settings", "/dashboard"];

// Cookie config for subdomain sharing (needed for auth.hotpress.app proxy)
const useSecureCookies = process.env.NODE_ENV === "production";
const cookieDomain = process.env.NODE_ENV === "production" ? ".hotpress.app" : undefined;

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
  redirectProxyUrl: process.env.AUTH_REDIRECT_PROXY_URL,
  cookies: {
    sessionToken: {
      name: useSecureCookies ? "__Secure-authjs.session-token" : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
        domain: cookieDomain,
      },
    },
    callbackUrl: {
      name: useSecureCookies ? "__Secure-authjs.callback-url" : "authjs.callback-url",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
        domain: cookieDomain,
      },
    },
    csrfToken: {
      name: useSecureCookies ? "__Secure-authjs.csrf-token" : "authjs.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
        domain: cookieDomain,
      },
    },
    pkceCodeVerifier: {
      name: useSecureCookies ? "__Secure-authjs.pkce.code_verifier" : "authjs.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
        domain: cookieDomain,
        maxAge: 60 * 15, // 15 minutes
      },
    },
    state: {
      name: useSecureCookies ? "__Secure-authjs.state" : "authjs.state",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
        domain: cookieDomain,
        maxAge: 60 * 15, // 15 minutes
      },
    },
  },
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
          nextUrl.pathname === path || nextUrl.pathname.startsWith(`${path}/`),
      );

      // Redirect logged-in users away from auth pages
      if (
        isLoggedIn &&
        (nextUrl.pathname === "/login" || nextUrl.pathname === "/signup")
      ) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

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
