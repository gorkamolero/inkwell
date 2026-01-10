import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://inkwell.app"
  ),
  title: {
    default: "Inkwell - Collaborative Writing Platform",
    template: "%s | Inkwell",
  },
  description:
    "The collaborative writing platform for modern teams. Create beautiful documents, sync with GitHub, and ship content faster.",
  keywords: [
    "writing",
    "collaboration",
    "documentation",
    "markdown",
    "editor",
    "github",
    "publishing",
  ],
  authors: [{ name: "Inkwell" }],
  creator: "Inkwell",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://inkwell.app",
    title: "Inkwell - Collaborative Writing Platform",
    description:
      "The collaborative writing platform for modern teams. Create beautiful documents, sync with GitHub, and ship content faster.",
    siteName: "Inkwell",
  },
  twitter: {
    card: "summary_large_image",
    title: "Inkwell - Collaborative Writing Platform",
    description:
      "The collaborative writing platform for modern teams. Create beautiful documents, sync with GitHub, and ship content faster.",
    creator: "@inkwell",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <Providers>
          <ToastProvider>{children}</ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
