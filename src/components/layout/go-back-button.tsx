"use client";

import { useRouter } from "next/navigation";

interface GoBackButtonProps {
  children: React.ReactNode;
}

export function GoBackButton({ children }: GoBackButtonProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center justify-center gap-2 border-3 border-black bg-white px-6 py-3 font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brutal-yellow focus-visible:ring-offset-2"
      aria-label="Go back to previous page"
    >
      {children}
    </button>
  );
}
