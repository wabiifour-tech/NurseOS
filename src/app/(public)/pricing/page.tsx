import type { Metadata } from "next";
import PricingPageClient from "./pricing-page-client";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.nurseos.digital";

export const metadata: Metadata = {
  title: "Pricing — NurseOS | Start Free, Scale When Ready",
  description:
    "From individual nurses to national health systems — NurseOS grows with you. Start with the Free plan for essential nursing tools, upgrade for advanced AI features, or get enterprise deployment.",
  alternates: {
    canonical: `${BASE_URL}/pricing`,
  },
  openGraph: {
    title: "Pricing — NurseOS | Start Free, Scale When Ready",
    description:
      "Free plan for individual nurses, Professional for advanced AI, Enterprise for facilities. All prices in Nigerian Naira.",
    url: `${BASE_URL}/pricing`,
  },
};

export default function PricingPage() {
  return <PricingPageClient />;
}
