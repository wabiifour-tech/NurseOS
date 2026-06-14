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
import { Building2, Briefcase, Loader2, ArrowRight, Clock, Plus, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { useAuthStore } from "@/lib/auth-store"

const roles = [
  { value: "NURSE", label: "Nurse" },
  { value: "ADMIN", label: "Facility Admin" },
  { value: "DOCTOR", label: "Doctor" },
  { value: "MATRON", label: "Matron" },
  { value: "STUDENT", label: "Nursing Student" },
  { value: "OTHER", label: "Other Healthcare Worker" },
]

interface FacilityOption {
  id: string
  name: string
  type: string
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
  const [facilityMode, setFacilityMode] = useState<FacilityMode>("existing")
  const [customFirstName, setCustomFirstName] = useState("")
  const [customLastName, setCustomLastName] = useState("")

  // New facility fields
  const [newFacilityName, setNewFacilityName] = useState("")
  const [newFacilityType, setNewFacilityType] = useState("HOSPITAL")
  const [newFacilityAddress, setNewFacilityAddress] = useState("")
  const [newFacilityCity, setNewFacilityCity] = useState("")
  const [newFacilityState, setNewFacilityState] = useState("")
  // Facility verification fields
  const [newFacilityRegistrationNumber, setNewFacilityRegistrationNumber] = useState("")
  const [newFacilityPhone, setNewFacilityPhone] = useState("")
  const [newFacilityEmail, setNewFacilityEmail] = useState("")
  const [adminLicenseNumber, setAdminLicenseNumber] = useState("")

  const isAdmin = selectedRole === "ADMIN"

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
    } else {
      setFacilityMode("existing")
    }
  }, [isAdmin])

  async function handleSubmit() {
    if (!selectedRole) {
      toast.error("Please select your role")
      return
    }

    // Validate facility
    if (facilityMode === "existing" && !selectedFacilityId) {
      toast.error("Please select a facility")
      return
    }
    if (facilityMode === "new") {
      if (!newFacilityName.trim()) {
        toast.error("Please enter the facility name")
        return
      }
      if (!newFacilityCity.trim() || !newFacilityState.trim()) {
        toast.error("Please enter the facility city and state")
        return
      }
      // SECURITY: Registration number is mandatory for facility verification
      if (!newFacilityRegistrationNumber.trim()) {
        toast.error("Facility registration/license number is required to verify your facility")
        return
      }
    }

    setIsLoading(true)
    try {
      const payload: Record<string, string> = {
        email: oauthData?.email || "",
        firstName: customFirstName || oauthData?.firstName || "",
        lastName: customLastName || oauthData?.lastName || "",
        role: selectedRole,
        avatarUrl: oauthData?.avatarUrl || "",
        provider: oauthData?.provider || "google",
      }

      if (facilityMode === "existing") {
        payload.facilityId = selectedFacilityId
      } else {
        // New facility — send facility details including verification fields
        payload.facilityMode = "new"
        payload.newFacilityName = newFacilityName.trim()
        payload.newFacilityType = newFacilityType
        payload.newFacilityAddress = newFacilityAddress.trim()
        payload.newFacilityCity = newFacilityCity.trim()
        payload.newFacilityState = newFacilityState.trim()
        payload.newFacilityRegistrationNumber = newFacilityRegistrationNumber.trim()
        payload.newFacilityPhone = newFacilityPhone.trim()
        payload.newFacilityEmail = newFacilityEmail.trim()
        payload.adminLicenseNumber = adminLicenseNumber.trim()
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
        // Show contextual message
        if (data.facilityCreated) {
          toast.success("Facility application submitted! A Super Admin will verify your facility.")
        } else {
          toast.success("Account created! Waiting for admin approval.")
        }
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
            {isAdmin
              ? "Your facility application has been submitted. A NurseOS Super Admin will review and verify your facility and account. You will be notified once approved. This typically takes 1-2 business days."
              : "Your account has been created and linked to the facility. The facility admin needs to approve your access before you can sign in. You'll be notified once approved."}
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-cyan-950/20">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-teal-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
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

            {/* Admin info banner */}
            {isAdmin && (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 text-sm">
                <p className="font-medium text-emerald-800 dark:text-emerald-300">
                  As a Facility Admin, you will manage your own facility and approve staff access.
                </p>
                <p className="text-emerald-700 dark:text-emerald-400 mt-1 text-xs">
                  You can join an existing facility or create a new one.
                </p>
              </div>
            )}

            {/* Facility selection */}
            {isAdmin && (
              <div className="space-y-2">
                <Label>Facility Options</Label>
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

            {/* Existing facility selector */}
            {facilityMode === "existing" && (
              <div className="space-y-2">
                <Label>Select Your Facility <span className="text-destructive">*</span></Label>
                <Select value={selectedFacilityId} onValueChange={setSelectedFacilityId}>
                  <SelectTrigger className="w-full">
                    <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder={loadingFacilities ? "Loading facilities..." : "Select your healthcare facility"} />
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
                {!isAdmin && (
                  <p className="text-xs text-muted-foreground">
                    Your access must be approved by the facility admin before you can sign in.
                  </p>
                )}
              </div>
            )}

            {/* New facility form */}
            {facilityMode === "new" && isAdmin && (
              <div className="space-y-3 border border-border/50 rounded-lg p-4 bg-muted/30">
                <p className="text-sm font-medium">New Facility Details</p>
                <div className="space-y-2">
                  <Label htmlFor="facilityName">Facility Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="facilityName"
                    value={newFacilityName}
                    onChange={(e) => setNewFacilityName(e.target.value)}
                    placeholder="e.g. Lagos General Hospital"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facilityType">Facility Type</Label>
                  <Select value={newFacilityType} onValueChange={setNewFacilityType}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HOSPITAL">Hospital</SelectItem>
                      <SelectItem value="CLINIC">Clinic</SelectItem>
                      <SelectItem value="PRIMARY_CARE">Primary Care Center</SelectItem>
                      <SelectItem value="SPECIALIST">Specialist Hospital</SelectItem>
                      <SelectItem value="TEACHING">Teaching Hospital</SelectItem>
                      <SelectItem value="MATERNITY">Maternity Home</SelectItem>
                      <SelectItem value="REHABILITATION">Rehabilitation Center</SelectItem>
                      <SelectItem value="COMMUNITY">Community Health Center</SelectItem>
                    </SelectContent>
                  </Select>
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
                    <Label htmlFor="facilityCity">City <span className="text-destructive">*</span></Label>
                    <Input
                      id="facilityCity"
                      value={newFacilityCity}
                      onChange={(e) => setNewFacilityCity(e.target.value)}
                      placeholder="e.g. Lagos"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facilityState">State <span className="text-destructive">*</span></Label>
                    <Input
                      id="facilityState"
                      value={newFacilityState}
                      onChange={(e) => setNewFacilityState(e.target.value)}
                      placeholder="e.g. Lagos State"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25"
              disabled={isLoading || !selectedRole || (facilityMode === "existing" && !selectedFacilityId) || (facilityMode === "new" && !newFacilityName.trim())}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4 mr-2" />
              )}
              {isAdmin ? "Create Facility & Continue" : "Submit for Approval"}
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
