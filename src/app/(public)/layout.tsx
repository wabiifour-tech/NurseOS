import type { Metadata } from "next";
import { PublicLayoutShell } from "./public-layout-shell";

// Public pages should be indexed by search engines
export const metadata: Metadata = {
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <PublicLayoutShell>{children}</PublicLayoutShell>;
}
