"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useState } from "react";
import { Mail, ArrowLeft, Loader2, ArrowRight, Info, KeyRound, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset code is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

type Step = "request" | "reset" | "success";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("request");
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const forgotForm = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const resetForm = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onRequestReset(data: ForgotPasswordForm) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await res.json();

      if (res.ok && result.resetToken) {
        // Token was returned (user exists, email can't be sent)
        setResetToken(result.resetToken);
        setUserEmail(result.email || data.email);
        setStep("reset");
        resetForm.setValue("token", result.resetToken);
        toast.success("Reset code generated. Set your new password below.");
      } else {
        // User doesn't exist or other error — still show generic message
        toast.info("If an account exists with this email, a reset code will be provided.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function onResetPassword(data: ResetPasswordForm) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: data.token,
          newPassword: data.newPassword,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        setStep("success");
        toast.success("Password reset successfully!");
      } else {
        toast.error(result.error || "Failed to reset password. Please try again.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // Step 3: Success
  if (step === "success") {
    return (
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Password Reset Complete</h1>
          <p className="text-muted-foreground text-sm">
            Your password has been reset successfully. You can now sign in with your new password.
          </p>
        </div>
        <Link href="/login">
          <Button className="mt-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25">
            <ArrowRight className="w-4 h-4 mr-2" />
            Sign In Now
          </Button>
        </Link>
      </div>
    );
  }

  // Step 2: Enter reset code + new password
  if (step === "reset") {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
            <KeyRound className="w-6 h-6 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Set New Password</h1>
          <p className="text-muted-foreground text-sm">
            Enter the reset code and choose a new password for <span className="font-medium text-foreground">{userEmail}</span>
          </p>
        </div>

        {resetToken && (
          <Alert className="border-amber-200 bg-amber-50">
            <Info className="size-4 text-amber-600" />
            <AlertTitle className="text-amber-700 text-sm">Reset Code</AlertTitle>
            <AlertDescription className="text-xs text-amber-600">
              Since email delivery is not configured, your reset code is shown below. In production, this would be sent to your email.
              <code className="block mt-1 p-2 bg-amber-100 rounded text-xs font-mono break-all select-all">{resetToken}</code>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token">Reset Code</Label>
            <Input
              id="token"
              type="text"
              placeholder="Paste your reset code here"
              {...resetForm.register("token")}
            />
            {resetForm.formState.errors.token && (
              <p className="text-xs text-destructive">{resetForm.formState.errors.token.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="At least 8 characters, 1 uppercase, 1 number"
              {...resetForm.register("newPassword")}
            />
            {resetForm.formState.errors.newPassword && (
              <p className="text-xs text-destructive">{resetForm.formState.errors.newPassword.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter your new password"
              {...resetForm.register("confirmPassword")}
            />
            {resetForm.formState.errors.confirmPassword && (
              <p className="text-xs text-destructive">{resetForm.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <KeyRound className="w-4 h-4 mr-2" />
            )}
            Reset Password
          </Button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setStep("request")}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Try a different email
          </button>
        </div>
      </div>
    );
  }

  // Step 1: Request reset
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Forgot your password?</h1>
        <p className="text-muted-foreground text-sm">
          Enter your email and we&apos;ll generate a reset code for you.
        </p>
      </div>

      <Alert className="border-emerald-200 bg-emerald-50">
        <Info className="size-4 text-emerald-600" />
        <AlertTitle className="text-emerald-700 text-sm">Password Reset</AlertTitle>
        <AlertDescription className="text-xs text-emerald-600">
          A secure reset code will be generated for your account. Use it below to set a new password.
        </AlertDescription>
      </Alert>

      <form onSubmit={forgotForm.handleSubmit(onRequestReset)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@hospital.com"
              className="pl-10"
              {...forgotForm.register("email")}
            />
          </div>
          {forgotForm.formState.errors.email && (
            <p className="text-xs text-destructive">{forgotForm.formState.errors.email.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <ArrowRight className="w-4 h-4 mr-2" />
          )}
          Generate Reset Code
        </Button>
      </form>

      <div className="text-center">
        <Link
          href="/login"
          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
