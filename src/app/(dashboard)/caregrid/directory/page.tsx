"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Search,
  Star,
  Video,
  MessageCircle,
  Phone,
  MapPin,
  Briefcase,
  Clock,
  UserCheck,
  Loader2,
  AlertCircle,
  Building2,
} from "lucide-react"

// ---------- Types ----------

interface NurseUser {
  id: string
  firstName: string
  lastName: string
  displayName: string | null
  email: string
  phone: string | null
  avatarUrl: string | null
  status: string
}

interface NurseFacility {
  name: string
  city: string
  state: string
}

interface NurseDirectoryItem {
  id: string
  userId: string
  specialty: string | null
  licenseNumber: string | null
  yearsOfExperience: number | null
  facilityId: string | null
  availableForConsultation: boolean | null
  consultationTypes: string | null
  languages: string | null
  expertise: string | null
  rating: number
  totalRatings: number
  createdAt: string
  user: NurseUser
  facility: NurseFacility | null
}

interface DirectoryResponse {
  nurses: NurseDirectoryItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ---------- Constants ----------

const specializations = [
  "All Specializations",
  "Critical Care Nursing",
  "Emergency & Trauma",
  "Community Health",
  "Pediatric Nursing",
  "Trauma & Orthopedics",
  "Midwifery",
  "Neonatal Intensive Care",
  "Infectious Disease",
  "Oncology Nursing",
]

const consultTypeIcons: Record<string, React.ElementType> = {
  Video,
  Chat: MessageCircle,
  Phone,
}

// ---------- Helpers ----------

function safeParseJSON(value: string | null, fallback: string[] = []): string[] {
  if (!value) return fallback
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

function getInitials(firstName: string, lastName: string): string {
  const first = firstName?.charAt(0)?.toUpperCase() || ""
  const last = lastName?.charAt(0)?.toUpperCase() || ""
  return first + last || "?"
}

function getFullName(user: NurseUser): string {
  return `${user.firstName} ${user.lastName}`.trim() || user.displayName || "Unknown Nurse"
}

// ---------- Component ----------

export default function NurseDirectoryPage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [specFilter, setSpecFilter] = React.useState("All Specializations")
  const [availableOnly, setAvailableOnly] = React.useState(false)

  const [nurses, setNurses] = React.useState<NurseDirectoryItem[]>([])
  const [totalCount, setTotalCount] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const debounceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [searchQuery])

  // Fetch nurses from API
  React.useEffect(() => {
    const fetchNurses = async () => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (debouncedSearch) params.set("search", debouncedSearch)
        if (specFilter !== "All Specializations") params.set("specialty", specFilter)
        if (availableOnly) params.set("available", "true")
        params.set("limit", "50")
        params.set("page", "1")

        const res = await fetch(`/api/caregrid/directory?${params.toString()}`)
        if (!res.ok) {
          throw new Error(`Failed to fetch directory (status ${res.status})`)
        }

        const data: DirectoryResponse = await res.json()
        setNurses(data.nurses)
        setTotalCount(data.pagination.total)
      } catch (err) {
        console.error("Error fetching nurse directory:", err)
        setError(err instanceof Error ? err.message : "An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchNurses()
  }, [debouncedSearch, specFilter, availableOnly])

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Search className="size-6 text-emerald-600" />
          Nurse Directory
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Find and connect with specialist nurses across Nigeria
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, specialty, or facility..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={specFilter} onValueChange={setSpecFilter}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Specialization" />
              </SelectTrigger>
              <SelectContent>
                {specializations.map((spec) => (
                  <SelectItem key={spec} value={spec}>
                    {spec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={availableOnly ? "default" : "outline"}
              className={
                availableOnly
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  : "gap-2"
              }
              onClick={() => setAvailableOnly(!availableOnly)}
            >
              <UserCheck className="size-4" />
              Available Only
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {loading ? (
            "Loading nurses..."
          ) : (
            <>
              Showing{" "}
              <span className="font-medium text-slate-900">{nurses.length}</span> of{" "}
              {totalCount} nurses
            </>
          )}
        </p>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="size-5 text-red-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Failed to load nurse directory</p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-red-700 border-red-200 hover:bg-red-100"
              onClick={() => {
                setError(null)
                setDebouncedSearch(debouncedSearch + " ")
                setTimeout(() => setDebouncedSearch(debouncedSearch), 100)
              }}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && !error && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="size-8 text-emerald-600 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading nurse directory...</p>
        </div>
      )}

      {/* Nurse Cards Grid */}
      {!loading && !error && nurses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nurses.map((nurse) => (
            <NurseCard key={nurse.id} nurse={nurse} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && nurses.length === 0 && (
        <div className="text-center py-12">
          <Search className="size-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No nurses found matching your criteria</p>
          {(searchQuery || specFilter !== "All Specializations" || availableOnly) && (
            <Button
              variant="outline"
              className="mt-3"
              onClick={() => {
                setSearchQuery("")
                setSpecFilter("All Specializations")
                setAvailableOnly(false)
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// ---------- NurseCard ----------

function NurseCard({ nurse }: { nurse: NurseDirectoryItem }) {
  const fullName = getFullName(nurse.user)
  const initials = getInitials(nurse.user.firstName, nurse.user.lastName)
  const expertise = safeParseJSON(nurse.expertise)
  const languages = safeParseJSON(nurse.languages)
  const consultationTypes = safeParseJSON(nurse.consultationTypes)
  const isAvailable = nurse.availableForConsultation === true

  return (
    <Card className="hover:shadow-md transition-shadow border-slate-200">
      <CardContent className="p-4 space-y-4">
        {/* Profile Header */}
        <div className="flex items-start gap-3">
          <Avatar className="size-14 border-2 border-emerald-200 shrink-0">
            <AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold text-base">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-slate-900">{fullName}</h3>
            {nurse.licenseNumber && (
              <p className="text-xs text-muted-foreground font-mono">{nurse.licenseNumber}</p>
            )}
            <div className="flex items-center gap-1 mt-1">
              {nurse.rating > 0 && (
                <>
                  <Star className="size-3.5 text-amber-500 fill-amber-500" />
                  <span className="text-xs font-medium">{nurse.rating.toFixed(1)}</span>
                </>
              )}
              {nurse.yearsOfExperience != null && (
                <span className="text-[10px] text-muted-foreground ml-1">
                  • {nurse.yearsOfExperience} yrs exp
                </span>
              )}
            </div>
          </div>
          {isAvailable ? (
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] shrink-0 gap-1">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Available
            </Badge>
          ) : (
            <Badge className="bg-slate-50 text-slate-500 border-slate-200 text-[10px] shrink-0">
              Unavailable
            </Badge>
          )}
        </div>

        {/* Details */}
        <div className="space-y-2">
          {nurse.specialty && (
            <div className="flex items-center gap-2 text-xs">
              <Briefcase className="size-3.5 text-emerald-500" />
              <span className="font-medium text-slate-700">{nurse.specialty}</span>
            </div>
          )}
          {nurse.facility ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="size-3.5" />
              {nurse.facility.name}, {nurse.facility.state}
            </div>
          ) : nurse.facilityId ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building2 className="size-3.5 text-emerald-500" />
              <span className="text-emerald-700 font-medium">Facility Registered</span>
            </div>
          ) : null}
        </div>

        {/* Expertise Tags */}
        {expertise.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {expertise.map((exp) => (
              <span
                key={exp}
                className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded"
              >
                {exp}
              </span>
            ))}
          </div>
        )}

        {/* Languages */}
        {languages.length > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span>Languages:</span>
            {languages.map((lang, i) => (
              <span key={lang}>
                {lang}
                {i < languages.length - 1 ? "," : ""}
              </span>
            ))}
          </div>
        )}

        {/* Consult Types */}
        {consultationTypes.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">Consult via:</span>
            <div className="flex gap-1">
              {consultationTypes.map((type) => {
                const Icon = consultTypeIcons[type]
                return Icon ? (
                  <div
                    key={type}
                    className="size-6 rounded bg-slate-100 flex items-center justify-center"
                    title={type}
                  >
                    <Icon className="size-3.5 text-slate-500" />
                  </div>
                ) : (
                  <div
                    key={type}
                    className="size-6 rounded bg-slate-100 flex items-center justify-center"
                    title={type}
                  >
                    <span className="text-[8px] font-medium text-slate-500">
                      {type.charAt(0)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button size="sm" variant="outline" className="flex-1 text-xs h-8 gap-1">
            <Clock className="size-3" />
            View Profile
          </Button>
          {isAvailable && (
            <Button
              size="sm"
              className="flex-1 text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
            >
              <Video className="size-3" />
              Request Consultation
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
