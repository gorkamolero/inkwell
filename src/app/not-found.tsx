import { ArrowLeft, FileQuestion, Home } from "lucide-react";
import Link from "next/link";
import { GoBackButton } from "@/components/layout/go-back-button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-8">
      {/* 404 illustration */}
      <div className="mb-8 flex h-32 w-32 items-center justify-center border-4 border-black bg-brutal-blue shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <FileQuestion className="h-16 w-16 text-white" strokeWidth={2.5} />
      </div>

      {/* Large 404 */}
      <div className="mb-4 text-center">
        <span className="text-[8rem] font-black leading-none tracking-tighter text-black">
          404
        </span>
      </div>

      {/* Error message */}
      <h1 className="mb-4 text-center text-3xl font-black uppercase tracking-tight text-black">
        Page Not Found
      </h1>

      <p className="mb-8 max-w-md text-center text-gray-600">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
        Check the URL or head back to familiar territory.
      </p>

      {/* Action buttons */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 border-3 border-black bg-brutal-yellow px-6 py-3 font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brutal-yellow focus-visible:ring-offset-2"
          aria-label="Return to homepage"
        >
          <Home className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
          Go Home
        </Link>

        <GoBackButton>
          <ArrowLeft className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
          Go Back
        </GoBackButton>
      </div>

      {/* Background grid pattern */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(to right, black 1px, transparent 1px),
            linear-gradient(to bottom, black 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
        aria-hidden="true"
      />
    </div>
  );
}
