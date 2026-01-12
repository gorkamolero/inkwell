import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { ToastProvider } from "@/components/ui/toast";
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
    process.env.NEXT_PUBLIC_APP_URL || "https://hotpress.app",
  ),
  title: {
    default: "Hotpress - Write together. Publish instantly.",
    template: "%s | Hotpress",
  },
  description:
    "Collaborative writing with live output. Books, articles, threads. Your content, your format. PDF regenerates on every save.",
  keywords: [
    "writing",
    "collaboration",
    "publishing",
    "pdf",
    "books",
    "articles",
    "github",
    "real-time",
  ],
  authors: [{ name: "Hotpress" }],
  creator: "Hotpress",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://hotpress.app",
    title: "Hotpress - Write together. Publish instantly.",
    description:
      "Collaborative writing with live output. Books, articles, threads. Your content, your format.",
    siteName: "Hotpress",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hotpress - Write together. Publish instantly.",
    description:
      "Collaborative writing with live output. Books, articles, threads. Your content, your format.",
    creator: "@hotpress",
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
