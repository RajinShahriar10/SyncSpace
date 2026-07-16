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
  title: "SyncSpace EDU - University Project Collaboration Platform",
  description:
    "The intelligent workspace for university teams. Track contributions, manage milestones, detect risks early — all in one premium platform.",
  keywords: ["collaboration", "workspace", "documents", "project management", "real-time", "education", "university", "academic"],
  authors: [{ name: "SyncSpace EDU" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "SyncSpace EDU",
    title: "SyncSpace EDU - University Project Collaboration Platform",
    description: "The intelligent workspace for university teams.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SyncSpace EDU",
    description: "University Project Collaboration & Supervision Platform",
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
