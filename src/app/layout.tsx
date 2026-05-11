import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { PWAInstallBanner } from "@/components/pwa-install-banner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0D9488" },
    { media: "(prefers-color-scheme: dark)", color: "#0F172A" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

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
    "PWA",
    "Nursing App",
  ],
  authors: [{ name: "NurseOS Team" }],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NurseOS",
    startupImage: [
      {
        url: "/apple-touch-icon.png",
        media: "(device-width: 320px)",
      },
    ],
  },
  applicationName: "NurseOS",
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
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#0D9488",
    "msapplication-TileImage": "/mstile-150x150.png",
    "msapplication-config": "/browserconfig.xml",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="NurseOS" />
        <meta name="msapplication-TileColor" content="#0D9488" />
        <meta name="msapplication-TileImage" content="/mstile-150x150.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="mask-icon" href="/logo.svg" color="#0D9488" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster richColors position="top-right" />
        <PWAInstallBanner />
      </body>
    </html>
  );
}
