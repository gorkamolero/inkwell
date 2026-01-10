import { CloudOff, Lock, DollarSign } from "lucide-react";
import { BrutalCard } from "@/components/ui";

const painPoints = [
  {
    icon: CloudOff,
    question: "Tired of losing work?",
    description:
      "Cloud services go down. Companies shut down. Your writing disappears. With Inkwell, your files live in YOUR repo. Always accessible, always yours.",
    accent: "yellow" as const,
  },
  {
    icon: Lock,
    question: "Tired of vendor lock-in?",
    description:
      "Proprietary formats. Export fees. Migration nightmares. Inkwell uses plain markdown. Export everything with one click. Switch tools whenever you want.",
    accent: "blue" as const,
  },
  {
    icon: DollarSign,
    question: "Tired of overpriced tools?",
    description:
      "$20, $30, $50 a month just to write? We built Inkwell because writing tools shouldn't cost more than your Netflix subscription.",
    accent: "pink" as const,
  },
];

export function PainPoints() {
  return (
    <section className="bg-white py-16 sm:py-20 md:py-24">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="mx-auto mb-12 max-w-3xl text-center sm:mb-16">
          <h2 className="mb-4 text-3xl font-black text-black sm:text-4xl md:text-5xl">
            Sound familiar?
          </h2>
        </div>

        {/* Pain point cards */}
        <div className="mx-auto grid max-w-6xl gap-6 sm:gap-8 md:grid-cols-3">
          {painPoints.map((point, index) => (
            <BrutalCard
              key={index}
              accent={point.accent}
              padding="lg"
              className="group transition-all duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#000000]"
            >
              {/* Icon */}
              <div
                className={`mb-4 inline-flex h-14 w-14 items-center justify-center border-3 border-black ${
                  point.accent === "yellow"
                    ? "bg-brutal-yellow"
                    : point.accent === "blue"
                      ? "bg-brutal-blue text-white"
                      : "bg-brutal-pink"
                }`}
              >
                <point.icon className="h-7 w-7" />
              </div>

              {/* Question */}
              <h3 className="mb-3 text-xl font-black text-black sm:text-2xl">
                {point.question}
              </h3>

              {/* Description */}
              <p className="text-gray-700 leading-relaxed">{point.description}</p>
            </BrutalCard>
          ))}
        </div>
      </div>
    </section>
  );
}
