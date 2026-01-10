import { Hero } from "@/components/marketing/Hero";
import { LiveEditorDemo } from "@/components/marketing/LiveEditorDemo";
import { PainPoints } from "@/components/marketing/PainPoints";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Features } from "@/components/marketing/Features";
import { Pricing } from "@/components/marketing/Pricing";

export default function HomePage() {
  return (
    <>
      {/* Hero - full viewport with headline and CTAs */}
      <Hero />

      {/* Live Editor Demo - try before you buy */}
      <LiveEditorDemo />

      {/* Pain Points - address the problems */}
      <PainPoints />

      {/* How It Works - simple 3-step process */}
      <HowItWorks />

      {/* Features - 2x3 grid of capabilities */}
      <Features />

      {/* Pricing - 3-tier pricing cards */}
      <Pricing />
    </>
  );
}
