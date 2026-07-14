import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SyncSpace - Enterprise Real-Time Collaboration Platform",
  description:
    "A unified collaborative workspace combining documents, boards, messaging, and real-time collaboration into one premium platform.",
  keywords: ["collaboration", "workspace", "documents", "project management", "real-time"],
  authors: [{ name: "SyncSpace" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "SyncSpace",
    title: "SyncSpace - Enterprise Real-Time Collaboration Platform",
    description: "A unified collaborative workspace for modern teams.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SyncSpace",
    description: "Enterprise Real-Time Collaboration Platform",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
