"use client";

import { useEffect } from "react";
import Link from "next/link";
import { signIn as nextAuthSignIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Heart, Users, Brain } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

export default function RegisterPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // If already authenticated (e.g., Zustand persisted state), redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = "/dashboard";
    }
  }, [isAuthenticated]);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
        <p className="text-muted-foreground text-sm">
          Join NurseOS and transform nursing care
        </p>
      </div>

      {/* Feature highlights */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-3 rounded-lg bg-muted/40 border">
          <Brain className="size-5 mx-auto mb-1 text-emerald-600" />
          <p className="text-[11px] font-medium">AI-Powered</p>
          <p className="text-[10px] text-muted-foreground">NurseAI module</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/40 border">
          <Users className="size-5 mx-auto mb-1 text-emerald-600" />
          <p className="text-[11px] font-medium">Workforce</p>
          <p className="text-[10px] text-muted-foreground">CareGrid module</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/40 border">
          <Heart className="size-5 mx-auto mb-1 text-emerald-600" />
          <p className="text-[11px] font-medium">Nurse-First</p>
          <p className="text-[10px] text-muted-foreground">Built by a nurse</p>
        </div>
      </div>

      {/* Google sign-up button — the only way to create an account */}
      <Button
        type="button"
        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25"
        onClick={() => nextAuthSignIn("google", { callbackUrl: "/auth/callback" })}
      >
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#fff"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff"/>
        </svg>
        Continue with Google
      </Button>

      <div className="text-center space-y-1">
        <p className="text-xs text-muted-foreground">
          After signing in with Google, you&apos;ll pick your role (nurse, doctor, facility admin,
          institution admin, lecturer, or student) and select your facility.
        </p>
        <p className="text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
            Sign in
          </Link>
        </p>
      </div>

      {/* Trust signals */}
      <div className="flex items-center justify-center gap-4 pt-2 text-[10px] text-muted-foreground/70">
        <span className="flex items-center gap-1">
          <ShieldCheck className="size-3" />
          NDPR Compliant
        </span>
        <span className="flex items-center gap-1">
          <ShieldCheck className="size-3" />
          HIPAA Aligned
        </span>
        <span className="flex items-center gap-1">
          <Heart className="size-3" />
          Built in Nigeria
        </span>
      </div>
    </div>
  );
}
