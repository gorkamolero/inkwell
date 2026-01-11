import { Github, PenTool, Shield } from "lucide-react";

const steps = [
  {
    number: "1",
    icon: PenTool,
    title: "Write",
    description:
      "Real-time collaboration. Write with your team, see their cursors. No signup required to start.",
  },
  {
    number: "2",
    icon: Shield,
    title: "Format",
    description:
      "Configure your output. Fonts, chapters, drop caps, or let us handle it.",
  },
  {
    number: "3",
    icon: Github,
    title: "Publish",
    description:
      "One click to PDF, ePub, web, or social. Save to GitHub. Your content, forever yours.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-y-4 border-black bg-brutal-yellow py-16 sm:py-20 md:py-24">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="mx-auto mb-12 max-w-3xl text-center sm:mb-16">
          <h2 className="mb-4 text-3xl font-black text-black sm:text-4xl md:text-5xl">
            How it works
          </h2>
          <p className="text-lg text-black/80 sm:text-xl">
            Dead simple. No learning curve.
          </p>
        </div>

        {/* Steps */}
        <div className="mx-auto max-w-5xl">
          <div className="relative">
            {/* Connecting line - visible on md+ */}
            <div
              className="absolute left-1/2 top-16 hidden h-[calc(100%-8rem)] w-1 -translate-x-1/2 bg-black md:block"
              aria-hidden="true"
            />

            {/* Steps grid */}
            <div className="grid gap-8 md:gap-0">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`relative flex flex-col items-center md:flex-row md:items-start ${
                    index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Content side */}
                  <div
                    className={`flex-1 text-center md:text-left ${
                      index % 2 === 0 ? "md:pr-16 md:text-right" : "md:pl-16"
                    }`}
                  >
                    <div
                      className={`inline-block ${
                        index % 2 === 0 ? "md:float-right md:text-right" : ""
                      }`}
                    >
                      {/* Icon - mobile only */}
                      <div className="mb-4 inline-flex h-14 w-14 items-center justify-center border-3 border-black bg-white md:hidden">
                        <step.icon className="h-7 w-7" />
                      </div>

                      <h3 className="mb-2 text-xl font-black text-black sm:text-2xl">
                        {step.title}
                      </h3>
                      <p className="max-w-sm text-black/80">{step.description}</p>
                    </div>
                  </div>

                  {/* Number circle */}
                  <div className="relative z-10 my-4 flex-shrink-0 md:my-8">
                    <div className="flex h-20 w-20 items-center justify-center border-4 border-black bg-white text-4xl font-black text-black shadow-brutal sm:h-24 sm:w-24 sm:text-5xl md:h-28 md:w-28 md:text-6xl">
                      {step.number}
                    </div>
                  </div>

                  {/* Icon side - desktop only */}
                  <div
                    className={`hidden flex-1 md:block ${
                      index % 2 === 0 ? "md:pl-16" : "md:pr-16 md:text-right"
                    }`}
                  >
                    <div
                      className={`inline-flex h-14 w-14 items-center justify-center border-3 border-black bg-white ${
                        index % 2 === 0 ? "" : "md:float-right"
                      }`}
                    >
                      <step.icon className="h-7 w-7" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
