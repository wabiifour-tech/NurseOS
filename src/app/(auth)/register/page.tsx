"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  User,
  Briefcase,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/auth-store";

const registerSchema = z
  .object({
    role: z.string().min(1, "Please select a role"),
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    facilityId: z.string().optional(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

const roles = [
  { value: "nurse", label: "Nurse" },
  { value: "doctor", label: "Doctor" },
  { value: "admin", label: "Facility Admin" },
  { value: "matron", label: "Matron" },
  { value: "student", label: "Nursing Student" },
  { value: "other", label: "Other Healthcare Worker" },
];

interface FacilityOption {
  id: string;
  name: string;
  type: string;
  city: string;
  state: string;
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [facilities, setFacilities] = useState<FacilityOption[]>([]);
  const [loadingFacilities, setLoadingFacilities] = useState(true);
  const login = useAuthStore((state) => state.login);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "", facilityId: "" },
  });

  const selectedRole = watch("role");

  // Fetch facilities for the dropdown
  useEffect(() => {
    async function fetchFacilities() {
      try {
        const res = await fetch("/api/caregrid/facilities?limit=200");
        if (res.ok) {
          const data = await res.json();
          setFacilities(data.facilities || []);
        }
      } catch {
        // Silently fail — facility selection is optional
      } finally {
        setLoadingFacilities(false);
      }
    }
    fetchFacilities();
  }, []);

  async function onSubmit(data: RegisterForm) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role.toUpperCase(),
          facilityId: data.facilityId || undefined,
        }),
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
          toast.error(result.error || 'Registration failed. Please try again.')
        }
        setIsLoading(false)
        return
      }

      // Auto-login after registration with facility context
      login({
        id: result.user?.id || crypto.randomUUID(),
        email: result.user?.email || data.email,
        firstName: result.user?.firstName || data.firstName,
        lastName: result.user?.lastName || data.lastName,
        role: result.originalRole || data.role,
        facilityId: result.user?.nurseProfile?.currentFacilityId || result.user?.adminProfile?.facilityId || null,
        facilityName: result.user?.nurseProfile?.facility?.name || result.user?.adminProfile?.facility?.name || null,
        nurseProfileId: result.user?.nurseProfile?.id || null,
      }, result.token);

      toast.success("Account created! Welcome to NurseOS.");

      // Use window.location.href for reliable full-page navigation
      // This ensures the cookie is sent with the request and middleware works correctly
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Unable to connect to the server. Please check your connection and try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
        <p className="text-muted-foreground text-sm">Join NurseOS and transform nursing care</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Role selection */}
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select
            value={selectedRole}
            onValueChange={(value) => setValue("role", value, { shouldValidate: true })}
          >
            <SelectTrigger className="w-full">
              <Briefcase className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
        </div>

        {/* Facility selection */}
        {selectedRole && selectedRole !== "other" && (
          <div className="space-y-2">
            <Label htmlFor="facilityId">
              Healthcare Facility
              <span className="text-muted-foreground text-xs ml-1">(select where you work)</span>
            </Label>
            <Select
              onValueChange={(value) => setValue("facilityId", value === "__none__" ? "" : value)}
            >
              <SelectTrigger className="w-full">
                <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder={loadingFacilities ? "Loading facilities..." : "Select your facility"} />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="__none__">Not listed / Skip for now</SelectItem>
                {facilities
                  .sort((a, b) => a.state.localeCompare(b.state))
                  .map((facility) => (
                    <SelectItem key={facility.id} value={facility.id}>
                      {facility.name} — {facility.city}, {facility.state}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Your data will be isolated to this facility. You can update this later in settings.
            </p>
          </div>
        )}

        {/* Name fields */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="firstName"
                placeholder="First name"
                className="pl-10"
                {...register("firstName")}
              />
            </div>
            {errors.firstName && (
              <p className="text-xs text-destructive">{errors.firstName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" placeholder="Last name" {...register("lastName")} />
            {errors.lastName && (
              <p className="text-xs text-destructive">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        {/* Email */}
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

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
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
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Must be 8+ characters with at least one uppercase letter and one number.
          </p>
        </div>

        {/* Confirm password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              className="pl-10 pr-10"
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
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
          Create Account
        </Button>
      </form>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
