import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      {/* Logo */}
      <Link
        href="/"
        className="mb-8 text-4xl font-black uppercase tracking-tight text-black transition-colors hover:text-brutal-blue"
      >
        Inkwell
      </Link>

      {/* Auth card */}
      {children}

      {/* Background decoration - grid pattern */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(to right, black 1px, transparent 1px),
            linear-gradient(to bottom, black 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />
    </div>
  );
}
