"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  isAuthenticated: boolean;
}

export function MobileNav({ isAuthenticated }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when menu is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  function closeMenu(): void {
    setIsOpen(false);
  }

  return (
    <div className="md:hidden">
      {/* Hamburger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-10 w-10 items-center justify-center",
          "border-3 border-black bg-white",
          "shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
          "transition-all duration-100",
          "hover:translate-x-[-1px] hover:translate-y-[-1px]",
          "hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
          "active:translate-x-[1px] active:translate-y-[1px]",
          "active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
        )}
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? (
          <X className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
        ) : (
          <Menu className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
        )}
      </button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile menu panel */}
      <div
        id="mobile-menu"
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-[280px]",
          "border-l-4 border-black bg-white",
          "shadow-[-8px_0_0_0_rgba(0,0,0,0.1)]",
          "transform transition-transform duration-200 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        {/* Close button */}
        <div className="flex items-center justify-between border-b-4 border-black p-4">
          <span className="text-xl font-black">Menu</span>
          <button
            type="button"
            onClick={closeMenu}
            className="flex h-10 w-10 items-center justify-center border-3 border-black bg-gray-100 transition-colors hover:bg-brutal-red hover:text-white"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="p-4" aria-label="Mobile navigation">
          <ul className="space-y-2">
            <li>
              <Link
                href="/pricing"
                onClick={closeMenu}
                className="flex items-center border-3 border-transparent px-4 py-3 font-bold text-black transition-all hover:border-black hover:bg-gray-50"
              >
                Pricing
              </Link>
            </li>
            <li>
              <Link
                href="/docs"
                onClick={closeMenu}
                className="flex items-center border-3 border-transparent px-4 py-3 font-bold text-black transition-all hover:border-black hover:bg-gray-50"
              >
                Docs
              </Link>
            </li>
            <li>
              <Link
                href="/blog"
                onClick={closeMenu}
                className="flex items-center border-3 border-transparent px-4 py-3 font-bold text-black transition-all hover:border-black hover:bg-gray-50"
              >
                Blog
              </Link>
            </li>
          </ul>

          {/* Divider */}
          <div className="my-4 border-t-2 border-gray-200" />

          {/* Auth links */}
          <ul className="space-y-2">
            {isAuthenticated ? (
              <li>
                <Link
                  href="/projects"
                  onClick={closeMenu}
                  className="flex items-center justify-center border-3 border-black bg-brutal-yellow px-4 py-3 font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  Go to Dashboard
                </Link>
              </li>
            ) : (
              <>
                <li>
                  <Link
                    href="/login"
                    onClick={closeMenu}
                    className="flex items-center justify-center border-3 border-black bg-white px-4 py-3 font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link
                    href="/signup"
                    onClick={closeMenu}
                    className="flex items-center justify-center border-3 border-black bg-brutal-yellow px-4 py-3 font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    Get Started
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </div>
  );
}
