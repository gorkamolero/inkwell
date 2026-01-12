import { Check } from "lucide-react";
import Link from "next/link";
import { BrutalBadge, BrutalButton, BrutalCard } from "@/components/ui";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for personal projects and trying things out.",
    features: [
      "3 projects",
      "10 documents per project",
      "Public repos only",
      "Community support",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "/mo",
    description: "For serious writers who need more power.",
    features: [
      "Unlimited projects",
      "Unlimited documents",
      "Private repos",
      "5 collaborators per project",
      "Priority support",
      "API access",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Team",
    price: "$29",
    period: "/user/mo",
    description: "For teams that write together.",
    features: [
      "Everything in Pro",
      "Unlimited collaborators",
      "Team management",
      "SSO / SAML",
      "Dedicated support",
      "Custom integrations",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export function Pricing() {
  return (
    <section
      id="pricing"
      className="border-y-4 border-black bg-[#F5F5F5] py-16 sm:py-20 md:py-24"
    >
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="mx-auto mb-12 max-w-3xl text-center sm:mb-16">
          <h2 className="mb-4 text-3xl font-black text-black sm:text-4xl md:text-5xl">
            Simple, honest pricing
          </h2>
          <p className="text-lg text-gray-700 sm:text-xl">
            No surprise fees. No feature gates. No bullshit.
          </p>
        </div>

        {/* Social proof */}
        <p className="mx-auto mb-8 max-w-xl text-center text-sm font-medium text-gray-600 sm:mb-12 sm:text-base">
          Trusted by writers who give a damn about their work
        </p>

        {/* Pricing cards */}
        <div className="mx-auto grid max-w-5xl gap-6 sm:gap-8 md:grid-cols-3">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative ${plan.popular ? "md:-mt-4 md:mb-4" : ""}`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -right-2 -top-3 z-10 sm:-right-3 sm:-top-4">
                  <BrutalBadge
                    variant="primary"
                    size="lg"
                    className="-rotate-3 shadow-brutal-sm"
                  >
                    POPULAR
                  </BrutalBadge>
                </div>
              )}

              <BrutalCard
                padding="lg"
                className={`flex h-full flex-col ${
                  plan.popular ? "border-4 shadow-[6px_6px_0_0_#000000]" : ""
                }`}
              >
                {/* Plan name */}
                <h3 className="mb-2 text-xl font-black text-black sm:text-2xl">
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="mb-4">
                  <span className="text-4xl font-black text-black sm:text-5xl">
                    {plan.price}
                  </span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>

                {/* Description */}
                <p className="mb-6 text-gray-700">{plan.description}</p>

                {/* Features */}
                <ul className="mb-8 flex-grow space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-brutal-green" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link href={plan.name === "Team" ? "/contact" : "/signup"}>
                  <BrutalButton
                    variant={plan.popular ? "primary" : "default"}
                    size="lg"
                    className="w-full"
                  >
                    {plan.cta}
                  </BrutalButton>
                </Link>
              </BrutalCard>
            </div>
          ))}
        </div>

        {/* Money back guarantee */}
        <p className="mx-auto mt-8 max-w-xl text-center text-sm text-gray-600 sm:mt-12">
          All paid plans include a 14-day free trial. Cancel anytime.
        </p>
      </div>
    </section>
  );
}
