import type { Metadata } from "next";
import AboutPageClient from "./about-page-client";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.nurseos.digital";

export const metadata: Metadata = {
  title: "About NurseOS — Built by a Nurse, For the World",
  description:
    "NurseOS was born from the frontline — created by Wabi, a 500-level nursing student and Registered Nurse who saw the gaps in healthcare technology and built the solution the world's nurses deserve.",
  alternates: {
    canonical: `${BASE_URL}/about`,
  },
  openGraph: {
    title: "About NurseOS — Built by a Nurse, For the World",
    description:
      "Created by Wabi, a Registered Nurse and full-stack developer, NurseOS is the operating system built from lived clinical experience.",
    url: `${BASE_URL}/about`,
  },
};

export default function AboutPage() {
  return <AboutPageClient />;
}
