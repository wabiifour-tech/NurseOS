"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
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
  Plus,
  MapPin,
  Phone,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { signIn as nextAuthSignIn } from "next-auth/react";
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

// Nigerian states for facility creation
const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi",
  "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun",
  "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

const FACILITY_TYPES = [
  { value: "HOSPITAL", label: "Hospital" },
  { value: "PRIMARY_HEALTH_CENTER", label: "Primary Health Center" },
  { value: "CLINIC", label: "Clinic" },
  { value: "SPECIALIST_CENTER", label: "Specialist Center" },
  { value: "MATERNITY_HOME", label: "Maternity Home" },
  { value: "DIAGNOSTIC_CENTER", label: "Diagnostic Center" },
  { value: "REHABILITATION_CENTER", label: "Rehabilitation Center" },
  { value: "COMMUNITY_HEALTH_CENTER", label: "Community Health Center" },
  { value: "PHARMACY", label: "Pharmacy" },
];

// New facility schema for admin creating a facility
const newFacilitySchema = z.object({
  name: z.string().min(2, "Facility name is required"),
  type: z.string().min(1, "Facility type is required"),
  address: z.string().optional().default(""),
  city: z.string().optional().default(""),
  state: z.string().min(1, "State is required"),
  phone: z.string().optional().default(""),
  email: z.string().optional().default(""),
  registrationNumber: z.string().min(1, "Facility registration/license number is required for verification"),
  accreditingBody: z.string().optional().default(""),
});

const registerSchema = z
  .object({
    role: z.string().min(1, "Please select a role"),
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    facilityId: z.string().optional(),
    facilityOption: z.enum(["existing", "new"]).optional(), // only for admin
    newFacility: newFacilitySchema.optional(),
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
  })
  .refine(
    (data) => {
      // For non-admin healthcare workers, facilityId is required
      const workerRoles = ["nurse", "doctor", "matron", "student", "other"];
      if (workerRoles.includes(data.role) && !data.facilityId) {
        return false;
      }
      return true;
    },
    {
      message: "Healthcare workers must select a facility",
      path: ["facilityId"],
    }
  )
  .refine(
    (data) => {
      // For admin creating new facility, newFacility fields are required including registration number
      if (data.role === "admin" && data.facilityOption === "new") {
        if (!data.newFacility?.name || !data.newFacility?.type || !data.newFacility?.state || !data.newFacility?.registrationNumber) {
          return false;
        }
      }
      return true;
    },
    {
      message: "Please fill in the required facility details including registration number",
      path: ["newFacility"],
    }
  );

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
  const [facilityOption, setFacilityOption] = useState<"existing" | "new">("existing");
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    clearErrors,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "",
      facilityId: "",
      facilityOption: "existing",
      newFacility: {
        name: "",
        type: "HOSPITAL",
        address: "",
        city: "",
        state: "",
        phone: "",
        email: "",
        registrationNumber: "",
        accreditingBody: "",
      },
    },
  });

  const selectedRole = watch("role");
  const selectedFacilityId = watch("facilityId");

  // If already authenticated (e.g., Zustand persisted state), redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = "/dashboard";
    }
  }, [isAuthenticated]);

  // Fetch facilities for the dropdown
  useEffect(() => {
    async function fetchFacilities() {
      try {
        const res = await fetch("/api/facilities/public?limit=200");
        if (res.ok) {
          const data = await res.json();
          setFacilities(data.facilities || []);
        }
      } catch {
        // Silently fail
      } finally {
        setLoadingFacilities(false);
      }
    }
    fetchFacilities();
  }, []);

  // Reset facility option when role changes
  useEffect(() => {
    if (selectedRole !== "admin") {
      setFacilityOption("existing");
      setValue("facilityOption", "existing");
    }
    // Clear facility-related errors when role changes
    clearErrors("facilityId");
    clearErrors("newFacility");
  }, [selectedRole, setValue, clearErrors]);

  const isWorkerRole = ["nurse", "doctor", "matron", "student", "other"].includes(selectedRole);
  const isAdminRole = selectedRole === "admin";

  async function onSubmit(data: RegisterForm) {
    setIsLoading(true);
    try {
      // Build the request payload
      const payload: Record<string, unknown> = {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role.toUpperCase(),
      };

      if (isAdminRole && facilityOption === "new" && data.newFacility) {
        // Admin creating a new facility — include verification fields
        payload.newFacility = {
          name: data.newFacility.name,
          type: data.newFacility.type,
          address: data.newFacility.address || "",
          city: data.newFacility.city || "",
          state: data.newFacility.state,
          phone: data.newFacility.phone || null,
          email: data.newFacility.email || null,
          registrationNumber: data.newFacility.registrationNumber,
          accreditingBody: data.newFacility.accreditingBody || null,
        };
      } else if (data.facilityId) {
        // Existing facility selected
        payload.facilityId = data.facilityId;
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
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

      // Handle PENDING status — no auto-login
      if (result.requiresApproval || result.status === 'PENDING') {
        // Show appropriate message based on role
        if (result.facilityCreated) {
          toast.success('Facility application submitted!', {
            description: 'A NurseOS Super Admin will review and verify your facility. You will be notified once approved. This typically takes 1-2 business days.',
            duration: 8000,
          })
        } else {
          toast.success('Account created!', {
            description: 'Your account is pending approval from the facility admin. You will be notified once approved.',
            duration: 8000,
          })
        }
        // Redirect to login with a message
        window.location.href = '/login?message=pending_approval'
        return
      }

      // Only SUPER_ADMIN gets auto-login (created by another SUPER_ADMIN)
      if (result.token) {
        login({
          id: result.user?.id || crypto.randomUUID(),
          email: result.user?.email || data.email,
          firstName: result.user?.firstName || data.firstName,
          lastName: result.user?.lastName || data.lastName,
          role: result.originalRole || data.role,
          facilityId: result.user?.facilityId || null,
          facilityName: result.user?.facilityName || null,
          nurseProfileId: result.user?.nurseProfileId || null,
        }, result.token);

        toast.success("Account created! Welcome to NurseOS.");
        window.location.href = "/dashboard";
      }
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

        {/* Facility section — shown for all roles except when no role selected */}
        {selectedRole && selectedRole !== "other" && (
          <div className="space-y-3">
            {isAdminRole ? (
              /* ===== ADMIN: Show toggle between existing and new facility ===== */
              <>
                <Label className="text-sm font-medium">Your Facility</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={facilityOption === "existing" ? "default" : "outline"}
                    size="sm"
                    className={`flex-1 text-xs ${
                      facilityOption === "existing"
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : ""
                    }`}
                    onClick={() => {
                      setFacilityOption("existing");
                      setValue("facilityOption", "existing");
                      clearErrors("newFacility");
                    }}
                  >
                    <Building2 className="w-3.5 h-3.5 mr-1.5" />
                    Select Existing
                  </Button>
                  <Button
                    type="button"
                    variant={facilityOption === "new" ? "default" : "outline"}
                    size="sm"
                    className={`flex-1 text-xs ${
                      facilityOption === "new"
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : ""
                    }`}
                    onClick={() => {
                      setFacilityOption("new");
                      setValue("facilityOption", "new");
                      setValue("facilityId", "");
                      clearErrors("facilityId");
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Create New
                  </Button>
                </div>

                {facilityOption === "existing" ? (
                  /* Admin: Select existing facility */
                  <div className="space-y-2">
                    <Select
                      value={selectedFacilityId || ""}
                      onValueChange={(value) => setValue("facilityId", value)}
                    >
                      <SelectTrigger className="w-full">
                        <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder={loadingFacilities ? "Loading facilities..." : "Select your facility"} />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
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
                      Your admin account will be linked to this facility. You can also create a new facility if yours isn&apos;t listed.
                    </p>
                  </div>
                ) : (
                  /* Admin: Create new facility form */
                  <div className="space-y-3 p-4 rounded-lg border border-emerald-200 bg-emerald-50/50">
                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-800">
                      <Plus className="w-4 h-4" />
                      Register a New Facility
                    </div>

                    {/* Facility Name */}
                    <div className="space-y-1.5">
                      <Label htmlFor="newFacName" className="text-xs">Facility Name *</Label>
                      <Input
                        id="newFacName"
                        placeholder="e.g., Lagos General Hospital"
                        {...register("newFacility.name")}
                      />
                      {errors.newFacility?.name && (
                        <p className="text-xs text-destructive">{errors.newFacility.name.message}</p>
                      )}
                    </div>

                    {/* Facility Type & State */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Facility Type *</Label>
                        <Select
                          defaultValue="HOSPITAL"
                          onValueChange={(value) => setValue("newFacility.type", value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {FACILITY_TYPES.map((ft) => (
                              <SelectItem key={ft.value} value={ft.value}>
                                {ft.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.newFacility?.type && (
                          <p className="text-xs text-destructive">{errors.newFacility.type.message}</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">State *</Label>
                        <Select
                          onValueChange={(value) => setValue("newFacility.state", value)}
                        >
                          <SelectTrigger className="w-full">
                            <MapPin className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                          <SelectContent className="max-h-48">
                            {NIGERIAN_STATES.map((state) => (
                              <SelectItem key={state} value={state}>
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.newFacility?.state && (
                          <p className="text-xs text-destructive">{errors.newFacility.state.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-1.5">
                      <Label htmlFor="newFacAddress" className="text-xs">Address</Label>
                      <Input
                        id="newFacAddress"
                        placeholder="e.g., 15 Broad Street"
                        {...register("newFacility.address")}
                      />
                    </div>

                    {/* City */}
                    <div className="space-y-1.5">
                      <Label htmlFor="newFacCity" className="text-xs">City / LGA</Label>
                      <Input
                        id="newFacCity"
                        placeholder="e.g., Lagos Island"
                        {...register("newFacility.city")}
                      />
                    </div>

                    {/* Phone & Email */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="newFacPhone" className="text-xs">Phone</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <Input
                            id="newFacPhone"
                            placeholder="+234 801 234 5678"
                            className="pl-9"
                            {...register("newFacility.phone")}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="newFacEmail" className="text-xs">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <Input
                            id="newFacEmail"
                            type="email"
                            placeholder="info@hospital.ng"
                            className="pl-9"
                            {...register("newFacility.email")}
                          />
                        </div>
                      </div>
                    </div>

                    {/* ── Facility Verification Section ── */}
                    <div className="border-t border-emerald-200 pt-3 mt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <p className="text-xs font-semibold text-emerald-800">Verification Required</p>
                      </div>
                      <p className="text-[11px] text-muted-foreground mb-3">
                        To prevent unauthorized facility creation, all new facilities must be verified by a NurseOS Super Admin. You will need to provide your facility registration number.
                      </p>

                      {/* Registration Number */}
                      <div className="space-y-1.5">
                        <Label htmlFor="regNumber" className="text-xs">Registration / License Number <span className="text-destructive">*</span></Label>
                        <Input
                          id="regNumber"
                          placeholder="e.g. CAC/1234567 or FMH/2024/0891"
                          {...register("newFacility.registrationNumber")}
                        />
                        {errors.newFacility?.registrationNumber && (
                          <p className="text-xs text-destructive">{errors.newFacility.registrationNumber.message}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground">
                          Your CAC registration number, health facility license, or government-issued facility ID.
                        </p>
                      </div>

                      {/* Accrediting Body */}
                      <div className="space-y-1.5 mt-2">
                        <Label htmlFor="accredBody" className="text-xs">Accrediting Body</Label>
                        <Input
                          id="accredBody"
                          placeholder="e.g. Federal Ministry of Health"
                          {...register("newFacility.accreditingBody")}
                        />
                      </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 mt-3">
                      <p className="text-[11px] text-amber-800 font-medium">
                        Your facility application will be reviewed by a NurseOS Super Admin before activation.
                      </p>
                      <p className="text-[10px] text-amber-700 mt-0.5">
                        This typically takes 1-2 business days. You will be notified via email once approved.
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : isWorkerRole ? (
              /* ===== HEALTHCARE WORKER: Facility is REQUIRED ===== */
              <>
                <Label>
                  Select your healthcare facility <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedFacilityId || ""}
                  onValueChange={(value) => {
                    setValue("facilityId", value, { shouldValidate: true });
                    clearErrors("facilityId");
                  }}
                >
                  <SelectTrigger className={`w-full ${errors.facilityId ? "border-destructive" : ""}`}>
                    <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder={loadingFacilities ? "Loading facilities..." : "Select your facility (required)"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {facilities
                      .sort((a, b) => a.state.localeCompare(b.state))
                      .map((facility) => (
                        <SelectItem key={facility.id} value={facility.id}>
                          {facility.name} — {facility.city}, {facility.state}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.facilityId && (
                  <div className="flex items-center gap-1.5 text-xs text-destructive">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.facilityId.message || "Please select a facility to continue"}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Healthcare workers must be assigned to a facility. Your data will be isolated to this facility.
                </p>
              </>
            ) : null}
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

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => nextAuthSignIn("google", { callbackUrl: "/auth/callback" })}
      >
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </Button>

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
