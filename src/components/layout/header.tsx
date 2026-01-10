import Link from "next/link";
import { auth } from "@/lib/auth";
import { MobileNav } from "./mobile-nav";

export async function Header() {
  const session = await auth();

  return (
    <>
      {/* Skip to main content link for keyboard users */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className="border-b-4 border-black bg-white" role="banner">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="text-2xl font-black tracking-tight text-black"
            aria-label="Inkwell - Go to homepage"
          >
            Inkwell
          </Link>

          <nav
            className="hidden items-center gap-8 md:flex"
            aria-label="Main navigation"
          >
            <Link
              href="/pricing"
              className="font-bold text-black hover:text-yellow-600"
            >
              Pricing
            </Link>
            <Link
              href="/docs"
              className="font-bold text-black hover:text-yellow-600"
            >
              Docs
            </Link>
            <Link
              href="/blog"
              className="font-bold text-black hover:text-yellow-600"
            >
              Blog
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {session?.user ? (
              <Link
                href="/projects"
                className="hidden border-4 border-black bg-yellow-400 px-6 py-2 font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:inline-flex"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden font-bold text-black hover:text-yellow-600 md:inline"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="hidden border-4 border-black bg-yellow-400 px-6 py-2 font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:inline-flex"
                >
                  Get Started
                </Link>
              </>
            )}

            {/* Mobile navigation */}
            <MobileNav isAuthenticated={!!session?.user} />
          </div>
        </div>
      </header>
    </>
  );
}
