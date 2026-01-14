import { Check } from "lucide-react";
import Link from "next/link";
import { PLANS } from "@/lib/stripe";

export const metadata = {
  title: "Pricing",
  description:
    "Cover costs, don't extract. Free tier is genuinely useful. Paid = professional polish.",
};

export default function PricingPage() {
  return (
    <section className="bg-white py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-4 text-4xl font-black text-black md:text-5xl">
            Simple, Honest Pricing
          </h1>
          <p className="mb-16 text-xl text-gray-700">
            Free is genuinely useful. Pay only when you need professional
            polish.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {/* Free Plan */}
          <PricingCard
            name={PLANS.free.name}
            description={PLANS.free.description}
            price={PLANS.free.price}
            priceLabel=""
            features={[...PLANS.free.features]}
            ctaText={PLANS.free.cta}
            ctaHref="/signup"
          />

          {/* Creator Plan */}
          <PricingCard
            name={PLANS.creator.name}
            description={PLANS.creator.description}
            price={PLANS.creator.price}
            priceLabel={PLANS.creator.priceLabel}
            features={[...PLANS.creator.features]}
            ctaText={PLANS.creator.cta}
            ctaHref="/signup"
          />

          {/* Pro Plan */}
          <PricingCard
            name={PLANS.pro.name}
            description={PLANS.pro.description}
            price={PLANS.pro.price}
            priceLabel={PLANS.pro.priceLabel}
            features={[...PLANS.pro.features]}
            ctaText={PLANS.pro.cta}
            ctaHref="/signup?plan=pro"
            highlighted
          />
        </div>

        {/* Philosophy callout */}
        <div className="mx-auto mt-16 max-w-2xl border-4 border-black bg-yellow-100 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="mb-2 font-black text-black">Our Philosophy</h3>
          <p className="text-gray-700">
            Cover costs, don&apos;t extract. We only make money when you need
            professional publishing. Your content is always yours - export and
            leave anytime. No subscription ticking while you&apos;re in a
            creative block.
          </p>
        </div>

        {/* FAQ Section */}
        <div className="mx-auto mt-20 max-w-3xl">
          <h2 className="mb-8 text-center text-2xl font-black text-black">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <FaqItem
              question="What's the difference between Creator and Pro?"
              answer="Creator unlocks professional exports for one book ($12.99 one-time). Pro unlocks everything across all your books ($39.99/year). If you publish regularly, Pro pays for itself after 3 books per year."
            />
            <FaqItem
              question="Can I try before I buy?"
              answer="Yes! Free tier lets you write, collaborate, and export unlimited books with a small footer. Try the full workflow before deciding if you need clean exports."
            />
            <FaqItem
              question="What happens to Creator purchases if I upgrade to Pro?"
              answer="They stay yours forever! If you later cancel Pro, your purchased books still have clean exports unlocked."
            />
            <FaqItem
              question="What's in the 'Made with Hotpress' footer?"
              answer="Just a small text footer on free exports. No watermarks, no branding on content pages - just a single line at the end of your book."
            />
            <FaqItem
              question="What is 'print-ready CMYK'?"
              answer="Professional print shops require CMYK color space, bleed marks, and trim marks. These are included with Creator and Pro - essential if you're printing physical copies."
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
  priceLabel,
  features,
  ctaText,
  ctaHref,
  highlighted = false,
}: {
  name: string;
  description: string;
  price: number;
  priceLabel: string;
  features: string[];
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
        {price === 0 ? (
          <span className="text-4xl font-black text-black">Free</span>
        ) : (
          <>
            <span className="text-4xl font-black text-black">${price}</span>
            {priceLabel && (
              <span className="text-gray-700"> {priceLabel}</span>
            )}
          </>
        )}
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
