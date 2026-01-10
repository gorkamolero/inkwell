import Link from "next/link";
import { Check } from "lucide-react";
import { PLANS } from "@/lib/stripe";

export const metadata = {
  title: "Pricing - Inkwell",
  description: "Simple, transparent pricing for teams of all sizes.",
};

export default function PricingPage() {
  return (
    <section className="bg-white py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-4 text-4xl font-black text-black md:text-5xl">
            Simple, Transparent Pricing
          </h1>
          <p className="mb-16 text-xl text-gray-700">
            Start free, upgrade when you need more. No hidden fees.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {/* Free Plan */}
          <PricingCard
            name={PLANS.free.name}
            description={PLANS.free.description}
            price={PLANS.free.price}
            features={PLANS.free.features}
            ctaText="Get Started"
            ctaHref="/signup"
          />

          {/* Pro Plan */}
          <PricingCard
            name={PLANS.pro.name}
            description={PLANS.pro.description}
            price={PLANS.pro.price}
            features={PLANS.pro.features}
            ctaText="Start Pro Trial"
            ctaHref="/signup?plan=pro"
            highlighted
          />

          {/* Team Plan */}
          <PricingCard
            name={PLANS.team.name}
            description={PLANS.team.description}
            price={PLANS.team.price}
            features={PLANS.team.features}
            ctaText="Contact Sales"
            ctaHref="/contact"
          />
        </div>

        {/* FAQ Section */}
        <div className="mx-auto mt-20 max-w-3xl">
          <h2 className="mb-8 text-center text-2xl font-black text-black">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <FaqItem
              question="Can I switch plans later?"
              answer="Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any differences."
            />
            <FaqItem
              question="What payment methods do you accept?"
              answer="We accept all major credit cards through Stripe. For Team plans, we can also arrange invoicing."
            />
            <FaqItem
              question="Is there a free trial for Pro?"
              answer="Yes, Pro comes with a 14-day free trial. No credit card required to start."
            />
            <FaqItem
              question="What happens to my content if I downgrade?"
              answer="Your content is always yours. If you downgrade and exceed the free tier limits, you'll have read-only access to extra projects until you archive or delete them."
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingCard({
  name,
  description,
  price,
  features,
  ctaText,
  ctaHref,
  highlighted = false,
}: {
  name: string;
  description: string;
  price: number;
  features: readonly string[];
  ctaText: string;
  ctaHref: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`flex flex-col border-4 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
        highlighted ? "bg-yellow-400" : "bg-white"
      }`}
    >
      <div className="mb-6">
        <h3 className="mb-2 text-2xl font-black text-black">{name}</h3>
        <p className="text-gray-700">{description}</p>
      </div>

      <div className="mb-6">
        <span className="text-4xl font-black text-black">
          ${price}
        </span>
        <span className="text-gray-700">/month</span>
      </div>

      <ul className="mb-8 flex-1 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-black" />
            <span className="text-black">{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href={ctaHref}
        className={`block border-4 border-black py-3 text-center font-bold transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none ${
          highlighted
            ? "bg-black text-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)]"
            : "bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        }`}
      >
        {ctaText}
      </Link>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="border-4 border-black bg-white p-6">
      <h3 className="mb-2 font-bold text-black">{question}</h3>
      <p className="text-gray-700">{answer}</p>
    </div>
  );
}
