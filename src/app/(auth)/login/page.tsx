"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense, useEffect, useRef, useCallback } from "react";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, ExternalLink } from "lucide-react";
import { signIn as nextAuthSignIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/auth-store";
import { isStandaloneMode, openInSystemBrowser } from "@/lib/pwa-detect";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Please enter your password"),
});

type LoginForm = z.infer<typeof loginSchema>;

/** Polling interval (ms) and max wait time (ms) for PWA OAuth completion */
const PWA_POLL_INTERVAL = 2000;
const PWA_POLL_MAX_WAIT = 120_000; // 2 minutes

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pwaOAuthPending, setPwaOAuthPending] = useState(false);
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const pendingMessage = searchParams.get("message");
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollStartRef = useRef<number>(0);

  // Show pending approval message if redirected from registration
  useEffect(() => {
    if (pendingMessage === "pending_approval") {
      toast.info("Your account is pending approval", {
        description: "Please wait for the facility admin or NurseOS Super Admin to approve your account. You will be notified via email once approved.",
        duration: 8000,
      });
    }
  }, [pendingMessage]);

  // If already authenticated (e.g., Zustand persisted state), redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = callbackUrl;
    }
  }, [isAuthenticated, callbackUrl]);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  /**
   * Poll /api/auth/pwa-check to detect when the system browser
   * has completed the Google OAuth flow and set the nurseos-token cookie.
   */
  const startPwaPolling = useCallback(() => {
    setPwaOAuthPending(true);
    pollStartRef.current = Date.now();

    pollTimerRef.current = setInterval(async () => {
      // Timeout: give up after PWA_POLL_MAX_WAIT
      if (Date.now() - pollStartRef.current > PWA_POLL_MAX_WAIT) {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        setPwaOAuthPending(false);
        toast.error("Sign-in timed out", {
          description: "Google sign-in took too long. Please try again.",
        });
        return;
      }

      try {
        const res = await fetch("/api/auth/pwa-check");
        const data = await res.json();

        if (data.authenticated && data.user) {
          // Stop polling
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setPwaOAuthPending(false);

          // Log the user into the Zustand store
          login({
            id: data.user.id,
            email: data.user.email,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            role: data.user.role,
            academicRole: data.user.academicRole || null,
            studentLevel: data.user.studentLevel ?? null,
            matricNumber: data.user.matricNumber || null,
            facilityId: data.user.facilityId || null,
            facilityName: data.user.facilityName || null,
            facilityType: data.user.facilityType || null,
            nurseProfileId: data.user.nurseProfileId || null,
          }, "__pwa_oauth__"); // Token is in the httpOnly cookie, not needed here

          toast.success("Welcome back to NurseOS!");
          window.location.assign("/dashboard");
        }
      } catch {
        // Network error — silently retry on next interval
      }
    }, PWA_POLL_INTERVAL);
  }, [login]);

  /**
   * Handle Google Sign-In click.
   *
   * - Normal browser: use next-auth's signIn() which redirects to Google.
   * - PWA standalone: open Google OAuth in the system browser to avoid
   *   Google's "disallowed_useragent" error, then poll for completion.
   */
  const handleGoogleSignIn = () => {
    if (isStandaloneMode()) {
      // PWA mode: open OAuth in the system browser
      // Append pwa=1 so the callback page knows to show "return to app" message
      const oauthUrl = "/api/auth/signin/google?callbackUrl=" +
        encodeURIComponent("/auth/callback?pwa=1");

      openInSystemBrowser(oauthUrl);

      // Start polling for the session cookie
      startPwaPolling();
    } else {
      // Normal browser: standard next-auth flow
      nextAuthSignIn("google", { callbackUrl: "/auth/callback" });
    }
  };

  const cancelPwaOAuth = () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    setPwaOAuthPending(false);
  };

  async function onSubmit(data: LoginForm) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        // Show specific database config message if DB is not set up
        if (result.errorType === 'DB_NOT_CONFIGURED') {
          toast.error('Database tables not set up', {
            description: 'Please visit /api/setup to create the database tables, then try again.',
            duration: 10000,
          })
        } else {
          toast.error(result.error || 'Invalid email or password')
        }
        setIsLoading(false)
        return
      }

      login({
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
        academicRole: result.user.academicRole || null,
        studentLevel: result.user.studentLevel ?? null,
        matricNumber: (result.user as any).matricNumber || null,
        facilityId: result.facilityId || null,
        facilityName: result.facilityName || null,
        facilityType: result.facilityType || result.user.facilityType || null,
        nurseProfileId: result.nurseProfileId || null,
      }, result.token);

      toast.success("Welcome back to NurseOS!");

      // Use window.location.assign for reliable full-page navigation
      // This ensures the cookie is sent with the request and middleware works correctly
      window.location.assign(callbackUrl);
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Unable to connect to the server. Please check your connection and try again.");
      setIsLoading(false);
    }
  }

  // Show PWA OAuth waiting overlay
  if (pwaOAuthPending) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-12">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
          <ExternalLink className="absolute inset-0 m-auto w-5 h-5 text-emerald-500" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-foreground">Waiting for Google sign-in...</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            A browser window opened to complete sign-in with Google.
            This page will automatically continue once you&apos;re signed in.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={cancelPwaOAuth}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
        <p className="text-muted-foreground text-sm">Sign in to your NurseOS account</p>
      </div>

      {/* Primary: Google sign-in (top) */}
      <Button
        type="button"
        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25"
        onClick={handleGoogleSignIn}
      >
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#fff"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff"/>
        </svg>
        Continue with Google
      </Button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or sign in with password</span>
        </div>
      </div>

      {/* Fallback: password form (for existing password-based accounts like Super Admin) */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@hospital.com"
              className="pl-10"
              {...register("email")}
            />
          </div>
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="pl-10 pr-10"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <Button
          type="submit"
          variant="outline"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <ArrowRight className="w-4 h-4 mr-2" />
          )}
          Sign In with Password
        </Button>
      </form>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-emerald-600 hover:text-emerald-700 font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading sign in...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}