"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Building2, Briefcase, Loader2, ArrowRight, Clock, Plus, GraduationCap, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { useAuthStore } from "@/lib/auth-store"

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi",
  "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun",
  "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
]

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
  { value: "UNIVERSITY", label: "University (Department of Nursing Sciences)" },
  { value: "SCHOOL_OF_NURSING", label: "School of Nursing" },
]

const STUDENT_LEVELS = [
  { value: "100", label: "100 Level (First Year)" },
  { value: "200", label: "200 Level (Second Year)" },
  { value: "300", label: "300 Level (Third Year)" },
  { value: "400", label: "400 Level (Fourth Year)" },
  { value: "500", label: "500 Level (Final Year)" },
]

// Role options — sent to backend. institution_admin maps to ADMIN on backend (adminType=INSTITUTION).
const roles = [
  { value: "NURSE", label: "Nurse" },
  { value: "DOCTOR", label: "Doctor" },
  { value: "ADMIN", label: "Facility Admin (Hospital / Clinic / PHC)" },
  { value: "INSTITUTION_ADMIN", label: "Institution Admin (University / School of Nursing)" },
  { value: "MATRON", label: "Matron" },
  { value: "LECTURER", label: "Lecturer (University / School of Nursing)" },
  { value: "STUDENT", label: "Nursing Student" },
  { value: "OTHER", label: "Other Healthcare Worker" },
]

interface FacilityOption {
  id: string
  name: string
  type?: string
  city: string
  state: string
}

type OnboardingStep = "role_facility" | "pending"

type FacilityMode = "existing" | "new"

export default function OnboardingPage() {
  const router = useRouter()
  const login = useAuthStore((state) => state.login)
  const [step, setStep] = useState<OnboardingStep>("role_facility")
  const [isLoading, setIsLoading] = useState(false)
  const [facilities, setFacilities] = useState<FacilityOption[]>([])
  const [loadingFacilities, setLoadingFacilities] = useState(true)

  // OAuth data from session storage
  const [oauthData, setOauthData] = useState<{
    email: string
    firstName: string
    lastName: string
    avatarUrl: string | null
    provider: string
  } | null>(null)

  const [selectedRole, setSelectedRole] = useState("")
  const [selectedFacilityId, setSelectedFacilityId] = useState("")
  const [selectedStudentLevel, setSelectedStudentLevel] = useState("")
  const [studentMatricNumber, setStudentMatricNumber] = useState("")
  const [facilityMode, setFacilityMode] = useState<FacilityMode>("existing")
  const [customFirstName, setCustomFirstName] = useState("")
  const [customLastName, setCustomLastName] = useState("")
  const [customPhone, setCustomPhone] = useState("")

  // New facility fields
  const [newFacilityName, setNewFacilityName] = useState("")
  const [newFacilityType, setNewFacilityType] = useState("HOSPITAL")
  const [newFacilityAddress, setNewFacilityAddress] = useState("")
  const [newFacilityCity, setNewFacilityCity] = useState("")
  const [newFacilityState, setNewFacilityState] = useState("")
  const [newFacilityPhone, setNewFacilityPhone] = useState("")
  const [newFacilityEmail, setNewFacilityEmail] = useState("")
  // Registration number — REQUIRED only for regular Facility Admin (not Institution Admin)
  const [newFacilityRegistrationNumber, setNewFacilityRegistrationNumber] = useState("")

  const isAdminRole = selectedRole === "ADMIN"
  const isInstitutionAdminRole = selectedRole === "INSTITUTION_ADMIN"
  const isAdmin = isAdminRole || isInstitutionAdminRole
  const isStudent = selectedRole === "STUDENT"
  const isLecturer = selectedRole === "LECTURER"
  const isAcademicRole = isStudent || isLecturer

  useEffect(() => {
    // Read OAuth data from sessionStorage
    const stored = sessionStorage.getItem("nurseos-oauth")
    if (!stored) {
      // No OAuth data — redirect to login
      router.push("/login")
      return
    }
    try {
      const data = JSON.parse(stored)
      setOauthData(data)
      setCustomFirstName(data.firstName || "")
      setCustomLastName(data.lastName || "")
    } catch {
      router.push("/login")
    }
  }, [router])

  // Fetch facilities
  useEffect(() => {
    async function fetchFacilities() {
      try {
        const res = await fetch("/api/facilities/public?limit=200")
        if (res.ok) {
          const data = await res.json()
          setFacilities(data.facilities || [])
        }
      } catch {
        // silently fail
      } finally {
        setLoadingFacilities(false)
      }
    }
    fetchFacilities()
  }, [])

  // When role changes, reset facility mode
  useEffect(() => {
    if (isAdmin) {
      setFacilityMode("new")
      setSelectedFacilityId("")
      // Pre-select UNIVERSITY type for institution admins
      if (isInstitutionAdminRole) {
        setNewFacilityType("UNIVERSITY")
      } else {
        setNewFacilityType("HOSPITAL")
      }
    } else {
      setFacilityMode("existing")
    }
  }, [isAdmin, isAdminRole, isInstitutionAdminRole])

  async function handleSubmit() {
    if (!selectedRole) {
      toast.error("Please select your role")
      return
    }
    if (!customFirstName.trim() || !customLastName.trim()) {
      toast.error("Please enter your first and last name")
      return
    }

    // Validate facility
    if (facilityMode === "existing" && !selectedFacilityId) {
      toast.error(isAcademicRole ? "Please select your institution" : "Please select a facility")
      return
    }
    if (facilityMode === "new") {
      if (!newFacilityName.trim()) {
        toast.error("Please enter the facility name")
        return
      }
      if (!newFacilityState.trim()) {
        toast.error("Please select the state")
        return
      }
      // Regular Facility Admin (hospital/clinic/PHC) MUST provide registration number for verification.
      // Institution Admin (university/school of nursing) does NOT need to — verified by Super Admin directly.
      if (isAdminRole && !newFacilityRegistrationNumber.trim()) {
        toast.error("Facility registration/license number is required for verification")
        return
      }
    }

    // Students must select their level + provide matric number
    if (isStudent && !selectedStudentLevel) {
      toast.error("Please select your current level (100 — 500)")
      return
    }
    if (isStudent && !studentMatricNumber.trim()) {
      toast.error("Please enter your matriculation number")
      return
    }

    setIsLoading(true)
    try {
      const payload: Record<string, string> = {
        email: oauthData?.email || "",
        firstName: customFirstName || oauthData?.firstName || "",
        lastName: customLastName || oauthData?.lastName || "",
        phone: customPhone.trim(),
        role: selectedRole,
        avatarUrl: oauthData?.avatarUrl || "",
        provider: oauthData?.provider || "google",
      }

      // Pass adminType so backend knows which facility types are allowed
      if (isAdminRole) payload.adminType = "FACILITY"
      if (isInstitutionAdminRole) payload.adminType = "INSTITUTION"

      // Pass student level + matric number for students
      if (isStudent && selectedStudentLevel) {
        payload.studentLevel = selectedStudentLevel
        payload.matricNumber = studentMatricNumber.trim()
      }

      if (facilityMode === "existing") {
        payload.facilityId = selectedFacilityId
      } else {
        // New facility
        payload.facilityMode = "new"
        payload.newFacilityName = newFacilityName.trim()
        payload.newFacilityType = newFacilityType
        payload.newFacilityAddress = newFacilityAddress.trim()
        payload.newFacilityCity = newFacilityCity.trim()
        payload.newFacilityState = newFacilityState.trim()
        payload.newFacilityPhone = newFacilityPhone.trim()
        payload.newFacilityEmail = newFacilityEmail.trim()
        // Registration number — sent only if provided (required for regular Facility Admin, optional for Institution Admin)
        if (newFacilityRegistrationNumber.trim()) {
          payload.newFacilityRegistrationNumber = newFacilityRegistrationNumber.trim()
        }
      }

      const res = await fetch("/api/auth/oauth/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Failed to complete registration")
        setIsLoading(false)
        return
      }

      if (data.status === "PENDING") {
        setStep("pending")
        // Clear OAuth data
        sessionStorage.removeItem("nurseos-oauth")
        if (data.facilityCreated) {
          toast.success("Account created! You can sign in once approved.")
        } else {
          toast.success("Account created! Waiting for admin approval.")
        }
      } else if (data.status === "ACTIVE" && data.token) {
        // Active user — auto-login (student auto-enrolled, OR admin who just created a new facility/institution)
        login({
          id: data.user?.id || crypto.randomUUID(),
          email: data.user?.email || oauthData?.email || "",
          firstName: data.user?.firstName || customFirstName,
          lastName: data.user?.lastName || customLastName,
          role: data.user?.role || selectedRole,
          academicRole: data.user?.academicRole || (isStudent ? "STUDENT" : isLecturer ? "LECTURER" : null),
          studentLevel: data.user?.studentLevel ?? (isStudent ? Number(selectedStudentLevel) : null),
          facilityId: data.user?.facilityId || null,
          facilityName: data.user?.facilityName || null,
          facilityType: data.user?.facilityType || null,
          nurseProfileId: data.user?.nurseProfileId || null,
        }, data.token)
        sessionStorage.removeItem("nurseos-oauth")
        // Show contextual welcome message
        if (isAdmin && facilityMode === "new") {
          toast.success(isInstitutionAdminRole
            ? "Institution created! Welcome to NurseOS."
            : "Facility created! Welcome to NurseOS.", {
            description: isInstitutionAdminRole
              ? "Your 1-week free trial has started."
              : undefined,
          })
        } else if (isStudent) {
          toast.success("Student account created! Welcome to NurseOS.")
        } else {
          toast.success("Welcome to NurseOS!")
        }
        setTimeout(() => {
          window.location.href = "/dashboard"
        }, 500)
      }
    } catch (err) {
      console.error("Onboarding error:", err)
      toast.error("Connection error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Render pending step
  if (step === "pending") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-cyan-950/20">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="rounded-full bg-amber-500/10 p-4">
            <Clock className="h-8 w-8 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold">Waiting for Admin Approval</h2>
          <p className="text-muted-foreground">
            Your account has been created. The facility admin needs to approve your access before you can sign in. You&apos;ll be notified once approved.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Image src="/nurseos-logo.png" alt="NurseOS" width={20} height={20} className="w-5 h-5 rounded" />
          NurseOS — Built by a Nurse. For the World.
        </div>
        <Button variant="outline" onClick={() => window.location.href = "/login"}>
          Back to Sign In
        </Button>
      </div>
    )
  }

  if (!oauthData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-cyan-950/20">
        <Loader2 className="size-6 animate-spin text-emerald-500" />
      </div>
    )
  }

  // Filter facility list for institution admins (only UNIVERSITY / SCHOOL_OF_NURSING)
  const filteredFacilities = facilities.filter((f) =>
    isInstitutionAdminRole
      ? f.type === "UNIVERSITY" || f.type === "SCHOOL_OF_NURSING"
      : true
  )

  // Filter facility types for the new-facility selector
  const filteredFacilityTypes = isInstitutionAdminRole
    ? FACILITY_TYPES.filter((ft) => ft.value === "UNIVERSITY" || ft.value === "SCHOOL_OF_NURSING")
    : FACILITY_TYPES

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-cyan-950/20">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-teal-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md max-h-[95vh] overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <Image src="/nurseos-logo.png" alt="NurseOS" width={40} height={40} className="w-10 h-10 rounded-xl shadow-lg shadow-emerald-500/20" priority />
          <span className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">NurseOS</span>
        </div>

        {/* Onboarding card */}
        <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl shadow-emerald-500/5 p-6 sm:p-8">
          <div className="text-center space-y-2 mb-6">
            <h1 className="text-2xl font-bold text-foreground">Complete Your Profile</h1>
            <p className="text-muted-foreground text-sm">
              Signed in as <span className="font-medium text-foreground">{oauthData.email}</span>
            </p>
          </div>

          <div className="space-y-4">
            {/* Name fields — pre-filled from Google */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={customFirstName}
                  onChange={(e) => setCustomFirstName(e.target.value)}
                  placeholder="First name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={customLastName}
                  onChange={(e) => setCustomLastName(e.target.value)}
                  placeholder="Last name"
                />
              </div>
            </div>

            {/* Phone (optional) */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                placeholder="+234 801 234 5678"
              />
            </div>

            {/* Role selection */}
            <div className="space-y-2">
              <Label>Role <span className="text-destructive">*</span></Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
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
            </div>

            {/* Student level + matric number — only for students */}
            {isStudent && (
              <div className="space-y-3 p-3 rounded-lg border border-emerald-200 bg-emerald-50/40">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <GraduationCap className="size-3.5" />
                    Current Level <span className="text-destructive">*</span>
                  </Label>
                  <Select value={selectedStudentLevel} onValueChange={setSelectedStudentLevel}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your current level (100 — 500)" />
                    </SelectTrigger>
                    <SelectContent>
                      {STUDENT_LEVELS.map((lvl) => (
                        <SelectItem key={lvl.value} value={lvl.value}>
                          {lvl.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="matricNumber" className="text-sm font-medium flex items-center gap-1.5">
                    <GraduationCap className="size-3.5" />
                    Matriculation Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="matricNumber"
                    value={studentMatricNumber}
                    onChange={(e) => setStudentMatricNumber(e.target.value)}
                    placeholder="e.g. NUR/2021/001 or RU/2023/00456"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your institution-issued matriculation / registration number. This is required
                    so your institution admin can verify your enrollment.
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  You&apos;ll only see materials uploaded for your level by your lecturers.
                </p>
              </div>
            )}

            {/* Facility / Institution selection */}
            {selectedRole && !isAdmin && (
              <div className="space-y-2">
                <Label>
                  {isAcademicRole
                    ? <>Select your institution <span className="text-destructive">*</span></>
                    : <>Select your facility <span className="text-destructive">*</span></>}
                </Label>
                <Select value={selectedFacilityId} onValueChange={setSelectedFacilityId}>
                  <SelectTrigger className="w-full">
                    <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue
                      placeholder={
                        loadingFacilities
                          ? "Loading..."
                          : isAcademicRole
                          ? "Select your university or school of nursing"
                          : "Select your healthcare facility"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {filteredFacilities
                      .sort((a, b) => a.state.localeCompare(b.state))
                      .map((facility) => (
                        <SelectItem key={facility.id} value={facility.id}>
                          {facility.name} — {facility.city}, {facility.state}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {isStudent
                    ? "You'll be auto-enrolled as a student at this institution."
                    : isLecturer
                    ? "Your lecturer account requires approval from the institution admin."
                    : "Your access must be approved by the facility admin before you can sign in."}
                </p>
              </div>
            )}

            {/* Admin: facility options */}
            {isAdmin && (
              <div className="space-y-2">
                <Label>{isInstitutionAdminRole ? "Institution Options" : "Facility Options"}</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={facilityMode === "new" ? "default" : "outline"}
                    size="sm"
                    onClick={() => { setFacilityMode("new"); setSelectedFacilityId("") }}
                    className={facilityMode === "new" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Create New
                  </Button>
                  <Button
                    type="button"
                    variant={facilityMode === "existing" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFacilityMode("existing")}
                    className={facilityMode === "existing" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                  >
                    <Building2 className="w-3 h-3 mr-1" />
                    Join Existing
                  </Button>
                </div>
              </div>
            )}

            {/* Admin: existing facility selector */}
            {isAdmin && facilityMode === "existing" && (
              <div className="space-y-2">
                <Label>
                  {isInstitutionAdminRole ? "Select Your Institution" : "Select Your Facility"} <span className="text-destructive">*</span>
                </Label>
                <Select value={selectedFacilityId} onValueChange={setSelectedFacilityId}>
                  <SelectTrigger className="w-full">
                    <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue
                      placeholder={
                        loadingFacilities
                          ? "Loading..."
                          : isInstitutionAdminRole
                          ? "Select your university or school of nursing"
                          : "Select your healthcare facility"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {filteredFacilities
                      .sort((a, b) => a.state.localeCompare(b.state))
                      .map((facility) => (
                        <SelectItem key={facility.id} value={facility.id}>
                          {facility.name} — {facility.city}, {facility.state}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Your admin account will be linked to this {isInstitutionAdminRole ? "institution" : "facility"}.
                </p>
              </div>
            )}

            {/* Admin: new facility form */}
            {isAdmin && facilityMode === "new" && (
              <div className="space-y-3 border border-border/50 rounded-lg p-4 bg-muted/30">
                <p className="text-sm font-medium">
                  {isInstitutionAdminRole ? "New Institution Details" : "New Facility Details"}
                </p>
                <div className="space-y-2">
                  <Label htmlFor="facilityName">
                    {isInstitutionAdminRole ? "Institution Name" : "Facility Name"} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="facilityName"
                    value={newFacilityName}
                    onChange={(e) => setNewFacilityName(e.target.value)}
                    placeholder={isInstitutionAdminRole ? "e.g. Redeemer's University, Dept. of Nursing" : "e.g. Lagos General Hospital"}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="facilityType">
                      {isInstitutionAdminRole ? "Institution Type" : "Facility Type"}
                    </Label>
                    <Select value={newFacilityType} onValueChange={setNewFacilityType}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredFacilityTypes.map((ft) => (
                          <SelectItem key={ft.value} value={ft.value}>
                            {ft.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facilityState">State <span className="text-destructive">*</span></Label>
                    <Select value={newFacilityState} onValueChange={setNewFacilityState}>
                      <SelectTrigger className="w-full">
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
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facilityAddress">Address</Label>
                  <Input
                    id="facilityAddress"
                    value={newFacilityAddress}
                    onChange={(e) => setNewFacilityAddress(e.target.value)}
                    placeholder="Street address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="facilityCity">City / LGA</Label>
                    <Input
                      id="facilityCity"
                      value={newFacilityCity}
                      onChange={(e) => setNewFacilityCity(e.target.value)}
                      placeholder="e.g. Lagos Island"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facilityPhone">Phone</Label>
                    <Input
                      id="facilityPhone"
                      value={newFacilityPhone}
                      onChange={(e) => setNewFacilityPhone(e.target.value)}
                      placeholder="+234 801 234 5678"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facilityEmail">Email</Label>
                  <Input
                    id="facilityEmail"
                    type="email"
                    value={newFacilityEmail}
                    onChange={(e) => setNewFacilityEmail(e.target.value)}
                    placeholder="info@hospital.ng"
                  />
                </div>

                {/* ─── Verification Section — REGULAR FACILITY ADMIN ONLY ─── */}
                {/* Institution Admin, Lecturer, Student do NOT need to provide registration number. */}
                {isAdminRole && !isInstitutionAdminRole && (
                  <div className="border-t border-border/50 pt-3 mt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Verification Required</p>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      To protect against unauthorized facility creation, all new healthcare facilities must be verified by a NurseOS Super Admin. You will need to provide your facility&apos;s registration or license number.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="regNumber">
                        Facility Registration / License Number <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="regNumber"
                        value={newFacilityRegistrationNumber}
                        onChange={(e) => setNewFacilityRegistrationNumber(e.target.value)}
                        placeholder="e.g. CAC/1234567 or FMH/2024/0891"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Your CAC registration number, health facility license, or government-issued facility ID.
                      </p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5 mt-3">
                      <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                        Your facility application will be reviewed by a NurseOS Super Admin before activation. This typically takes 1-2 business days.
                      </p>
                    </div>
                  </div>
                )}

                {/* Institution Admin — show a friendly note instead of verification */}
                {isInstitutionAdminRole && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 mt-2">
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                      Your institution will be activated immediately — no license verification needed.
                      A 1-week free trial starts automatically, after which a subscription is required for lecturers to continue uploading materials.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25"
              disabled={
                isLoading ||
                !selectedRole ||
                !customFirstName.trim() ||
                !customLastName.trim() ||
                (facilityMode === "existing" && !selectedFacilityId) ||
                (facilityMode === "new" && (!newFacilityName.trim() || !newFacilityState.trim())) ||
                // Regular Facility Admin must provide registration number
                (facilityMode === "new" && isAdminRole && !isInstitutionAdminRole && !newFacilityRegistrationNumber.trim()) ||
                (isStudent && (!selectedStudentLevel || !studentMatricNumber.trim()))
              }
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4 mr-2" />
              )}
              {isAdmin && facilityMode === "new" ? "Create & Continue" : "Complete Sign Up"}
            </Button>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          &copy; {new Date().getFullYear()} NurseOS — Developed by Wabi The Tech Nurse
        </p>
      </div>
    </div>
  )
}
