import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { BrutalButton } from "@/components/ui";

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-white">
      {/* Grid pattern background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #000 1px, transparent 1px),
            linear-gradient(to bottom, #000 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Content */}
      <div className="container relative mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-20">
        <div className="mx-auto max-w-5xl text-center">
          {/* Headline */}
          <h1 className="mb-8 text-5xl font-black leading-[1.1] tracking-tight text-black sm:text-6xl md:text-7xl lg:text-8xl">
            Your Writing.
            <br />
            Your Repo.
            <br />
            <span className="relative inline-block">
              <span className="relative z-10">Your Rules.</span>
              <span
                className="absolute bottom-1 left-0 right-0 z-0 h-4 bg-brutal-yellow sm:h-6 md:h-8"
                aria-hidden="true"
              />
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mb-12 max-w-3xl text-lg font-medium text-gray-700 sm:text-xl md:text-2xl">
            Stop paying $20/month for someone else to hold your writing hostage.
            Hotpress stores everything in{" "}
            <span className="font-black text-black">YOUR</span> GitHub repo. You
            own every word, every draft, every revision.{" "}
            <span className="font-black text-black">Forever.</span>
          </p>

          {/* CTAs */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <Link href="#demo">
              <BrutalButton
                variant="primary"
                size="xl"
                className="min-w-[200px]"
              >
                Try It Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </BrutalButton>
            </Link>
            <Link href="#pricing">
              <BrutalButton
                variant="outline"
                size="xl"
                className="min-w-[200px]"
              >
                See Pricing
              </BrutalButton>
            </Link>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 border-[6px] border-black opacity-5 sm:h-96 sm:w-96" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 border-[6px] border-black opacity-5 sm:h-96 sm:w-96" />
    </section>
  );
}
