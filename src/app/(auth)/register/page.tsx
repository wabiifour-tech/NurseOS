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
  Plus,
  MapPin,
  Phone,
  AlertCircle,
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
      // For admin creating new facility, newFacility fields are required
      if (data.role === "admin" && data.facilityOption === "new") {
        if (!data.newFacility?.name || !data.newFacility?.type || !data.newFacility?.state) {
          return false;
        }
      }
      return true;
    },
    {
      message: "Please fill in the required facility details",
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
  const router = useRouter();

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
      },
    },
  });

  const selectedRole = watch("role");
  const selectedFacilityId = watch("facilityId");

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
        // Admin creating a new facility
        payload.newFacility = {
          name: data.newFacility.name,
          type: data.newFacility.type,
          address: data.newFacility.address || "",
          city: data.newFacility.city || "",
          state: data.newFacility.state,
          phone: data.newFacility.phone || null,
          email: data.newFacility.email || null,
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

      // Auto-login after registration with facility context
      login({
        id: result.user?.id || crypto.randomUUID(),
        email: result.user?.email || data.email,
        firstName: result.user?.firstName || data.firstName,
        lastName: result.user?.lastName || data.lastName,
        role: result.originalRole || data.role,
        facilityId: result.user?.facilityId || result.user?.nurseProfile?.currentFacilityId || result.user?.adminProfile?.facilityId || null,
        facilityName: result.user?.facility?.name || result.user?.nurseProfile?.facility?.name || result.user?.adminProfile?.facility?.name || null,
        nurseProfileId: result.user?.nurseProfile?.id || null,
      }, result.token);

      toast.success("Account created! Welcome to NurseOS.");

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

                    <p className="text-xs text-muted-foreground">
                      Your facility will start on the <span className="font-medium text-emerald-700">FREE plan</span>. You can upgrade later in settings.
                    </p>
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
