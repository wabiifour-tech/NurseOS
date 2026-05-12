import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-cyan-950/20 p-4">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-teal-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Brand */}
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-8 group">
          <Image
            src="/nurseos-logo.png"
            alt="NurseOS"
            width={40}
            height={40}
            className="w-10 h-10 rounded-xl shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow"
            priority
          />
          <span className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
            NurseOS
          </span>
        </Link>

        {/* Auth card */}
        <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl shadow-emerald-500/5 p-6 sm:p-8">
          {children}
        </div>

        {/* Footer text */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          &copy; {new Date().getFullYear()} NurseOS — Developed by Wabi The Tech Nurse
        </p>
      </div>
    </div>
  );
}
