import { Code2, Download, FileText, History, Users, Wifi } from "lucide-react";
import { BrutalCard } from "@/components/ui";

const features = [
  {
    icon: History,
    title: "Version history",
    description:
      "Every save is a git commit. Compare versions, restore old drafts, track every change.",
  },
  {
    icon: Users,
    title: "Real-time collaboration",
    description:
      "Write together in real-time. Comments, suggestions, and threaded discussions built in.",
  },
  {
    icon: FileText,
    title: "Markdown native",
    description:
      "Write in markdown or rich text. Automatic shortcuts for headings, lists, and code blocks.",
  },
  {
    icon: Download,
    title: "Export anytime",
    description:
      "One-click export to markdown, HTML, or PDF. Your content, your format, your choice.",
  },
  {
    icon: Wifi,
    title: "Works offline",
    description:
      "Keep writing when you're off the grid. Changes sync automatically when you're back online.",
  },
  {
    icon: Code2,
    title: "API-first",
    description:
      "SDK for automation. Claude-ready for AI editing. Build your own workflows on top of Hotpress.",
  },
];

export function Features() {
  return (
    <section className="bg-white py-16 sm:py-20 md:py-24">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="mx-auto mb-12 max-w-3xl text-center sm:mb-16">
          <h2 className="mb-4 text-3xl font-black text-black sm:text-4xl md:text-5xl">
            Everything you need to write
          </h2>
          <p className="text-lg text-gray-700 sm:text-xl">
            Powerful features. Zero bloat.
          </p>
        </div>

        {/* Features grid */}
        <div className="mx-auto grid max-w-5xl gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <BrutalCard
              key={index}
              padding="md"
              className="group transition-all duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#000000]"
            >
              {/* Icon */}
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center border-2 border-black bg-gray-100">
                <feature.icon className="h-5 w-5" />
              </div>

              {/* Title */}
              <h3 className="mb-2 text-lg font-bold text-black">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </BrutalCard>
          ))}
        </div>
      </div>
    </section>
  );
}
