import { HotpressHero } from "@/components/landing/HotpressHero";
import { Features } from "@/components/marketing/Features";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Pricing } from "@/components/marketing/Pricing";

export default function HomePage() {
  return (
    <>
      {/* Hero with Live Editor - editor-first design */}
      <HotpressHero />

      {/* How It Works - simple 3-step process */}
      <HowItWorks />

      {/* Features - 2x3 grid of capabilities */}
      <Features />

      {/* Pricing - 3-tier pricing cards */}
      <Pricing />
    </>
  );
}
