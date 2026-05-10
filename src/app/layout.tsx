import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://nurseos.vercel.app"),
  title: "NurseOS — The Operating System for Global Nursing Care",
  description:
    "Built by a Nurse. For the World. NurseOS empowers healthcare facilities with AI-powered nursing care, workforce management, analytics, identity verification, and continuous education.",
  keywords: [
    "NurseOS",
    "Nursing Care",
    "Healthcare Technology",
    "NurseAI",
    "CareGrid",
    "NurseAnalytics",
    "NurseID",
    "NurseAcademy",
    "Healthcare OS",
    "Nursing Platform",
    "Nigeria Healthcare",
  ],
  authors: [{ name: "NurseOS Team" }],
  icons: {
    icon: "/nurseos-logo.png",
  },
  openGraph: {
    title: "NurseOS — The Operating System for Global Nursing Care",
    description:
      "Built by a Nurse. For the World. Empowering healthcare facilities with intelligent nursing technology.",
    url: "https://nurseos.com",
    siteName: "NurseOS",
    type: "website",
    images: ["/nurseos-hero.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "NurseOS — The Operating System for Global Nursing Care",
    description:
      "Built by a Nurse. For the World. Empowering healthcare facilities with intelligent nursing technology.",
    images: ["/nurseos-hero.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
