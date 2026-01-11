import Link from "next/link";
import { Github, Twitter } from "lucide-react";
import { BrutalButton } from "@/components/ui";

export function MarketingFooter() {
  return (
    <footer className="border-t-4 border-white bg-black py-16 text-white sm:py-20 md:py-24">
      <div className="container mx-auto px-4">
        {/* Final CTA */}
        <div className="mx-auto mb-16 max-w-3xl text-center sm:mb-20">
          <h2 className="mb-4 text-3xl font-black sm:text-4xl md:text-5xl">
            Your words deserve better.
          </h2>
          <p className="mb-8 text-lg text-gray-400 sm:text-xl">
            Stop letting someone else hold your writing hostage.
          </p>
          <Link href="/signup">
            <BrutalButton
              variant="primary"
              size="xl"
              className="min-w-[200px]"
            >
              Start Writing
            </BrutalButton>
          </Link>
        </div>

        {/* Footer links */}
        <div className="grid gap-8 border-t border-white/20 pt-12 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand */}
          <div>
            <Link
              href="/"
              className="text-2xl font-black tracking-tight text-white"
            >
              Hotpress
            </Link>
            <p className="mt-4 text-sm text-gray-400">
              Write together.
              <br />
              Publish instantly.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Product
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/features"
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/changelog"
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  Changelog
                </Link>
              </li>
              <li>
                <Link
                  href="/roadmap"
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  Roadmap
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Resources
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/docs"
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/support"
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  Support
                </Link>
              </li>
              <li>
                <Link
                  href="/api"
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  API
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Legal
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/security"
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  Security
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/20 pt-8 sm:flex-row">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Hotpress. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/hotpress"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center border-2 border-white/30 text-gray-400 transition-all hover:border-white hover:text-white"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href="https://twitter.com/hotpress"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center border-2 border-white/30 text-gray-400 transition-all hover:border-white hover:text-white"
              aria-label="Twitter"
            >
              <Twitter className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
