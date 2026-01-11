"use client";

import { HotpressEditor } from "@/components/editor/HotpressEditor";

/**
 * Hotpress Hero Section
 *
 * Editor-first landing page. The headline and editor are the hero.
 * Visitors can start writing immediately without signup.
 */
export function HotpressHero() {
  return (
    <section className="relative min-h-screen bg-white py-12 md:py-16 lg:py-20">
      {/* Grid pattern background */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #000 1px, transparent 1px),
            linear-gradient(to bottom, #000 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="container relative mx-auto px-4">
        {/* Headline */}
        <div className="mx-auto mb-8 max-w-4xl text-center md:mb-12">
          <h1 className="mb-4 text-4xl font-black leading-tight tracking-tight text-black sm:text-5xl md:text-6xl lg:text-7xl">
            Write together.{" "}
            <span className="relative inline-block">
              <span className="relative z-10">Publish instantly.</span>
              <span
                className="absolute bottom-1 left-0 right-0 z-0 h-3 bg-brutal-yellow sm:h-4 md:h-5"
                aria-hidden="true"
              />
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-700 sm:text-xl">
            Books, articles, threads. Collaborative writing with live output.
            Your content, your format.
          </p>
        </div>

        {/* Editor */}
        <div className="mx-auto max-w-4xl">
          <div className="relative">
            {/* TRY IT label */}
            <div className="absolute -left-2 -top-4 z-20 sm:-left-4 sm:-top-6">
              <div className="-rotate-3 border-3 border-black bg-brutal-yellow px-3 py-1.5 text-sm font-black uppercase tracking-wide text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:px-4 sm:py-2 sm:text-base">
                Start writing
              </div>
            </div>

            {/* Editor */}
            <HotpressEditor />

            {/* Subtext */}
            <p className="mt-4 text-center text-sm text-gray-500">
              No account required. Content saves automatically.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
