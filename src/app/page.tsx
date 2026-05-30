import type { Metadata } from "next";
import LandingPageClient from "./landing-page-client";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.nurseos.digital";

export const metadata: Metadata = {
  title: "NurseOS — The Operating System for Global Nursing Care",
  description:
    "Built by a Nurse. For the World. NurseOS empowers healthcare facilities with AI-powered nursing care, workforce management, analytics, identity verification, and continuous education.",
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    title: "NurseOS — The Operating System for Global Nursing Care",
    description:
      "Built by a Nurse. For the World. Empowering healthcare facilities with intelligent nursing technology.",
    url: BASE_URL,
  },
};

export default function HomePage() {
  return <LandingPageClient />;
}
