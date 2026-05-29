import type { Metadata } from "next";
import { AuthLayoutShell } from "./auth-layout-shell";

// Prevent search engines from indexing auth pages (login, register, forgot-password)
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthLayoutShell>{children}</AuthLayoutShell>;
}
