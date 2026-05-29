import type { Metadata } from "next";
import FeaturesPageClient from "./features-page-client";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.nurseos.digital";

export const metadata: Metadata = {
  title: "Features — NurseOS | Five Integrated Nursing Modules",
  description:
    "Explore NurseOS's five integrated modules: NurseAI for smart charting, CareGrid for global networking, NurseAnalytics for intelligence, NurseID for professional identity, and NurseAcademy for learning.",
  alternates: {
    canonical: `${BASE_URL}/features`,
  },
  openGraph: {
    title: "Features — NurseOS | Five Integrated Nursing Modules",
    description:
      "AI-powered smart charting, global nursing network, healthcare intelligence, professional identity, and simulation-based learning — all in one platform.",
    url: `${BASE_URL}/features`,
  },
};

export default function FeaturesPage() {
  return <FeaturesPageClient />;
}
