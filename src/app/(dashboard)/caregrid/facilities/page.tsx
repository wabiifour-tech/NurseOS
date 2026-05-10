"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
  Building2,
  Search,
  MapPin,
  Bed,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Phone,
  Star,
  CheckCircle2,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

interface Facility {
  id: string
  name: string
  type: string
  level: string | null
  address: string
  city: string
  state: string
  country: string
  phone: string | null
  email: string | null
  bedCapacity: number | null
  staffCount: number | null
  isVerified: boolean
  isEmergencyCapable: boolean
  servicesOffered: string
  accreditationStatus: string | null
  _count?: {
    staff: number
    departments: number
    analytics: number
  }
}

export default function FacilitiesPage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [typeFilter, setTypeFilter] = React.useState("all")
  const [stateFilter, setStateFilter] = React.useState("all")
  const [verifiedFilter, setVerifiedFilter] = React.useState("all")

  // Data states
  const [facilities, setFacilities] = React.useState<Facility[]>([])
  const [loading, setLoading] = React.useState(true)

  // Fetch facilities
  React.useEffect(() => {
    async function fetchFacilities() {
      try {
        const params = new URLSearchParams()
        if (searchQuery) params.set('search', searchQuery)
        if (typeFilter !== 'all') params.set('type', typeFilter)
        if (stateFilter !== 'all') params.set('state', stateFilter)
        if (verifiedFilter === 'verified') params.set('isVerified', 'true')
        else if (verifiedFilter === 'unverified') params.set('isVerified', 'false')
        params.set('limit', '50')

        const res = await fetch(`/api/caregrid/facilities?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          setFacilities(data.facilities || [])
        }
      } catch {
        toast.error('Failed to load facilities')
      } finally {
        setLoading(false)
      }
    }
    fetchFacilities()
  }, [searchQuery, typeFilter, stateFilter, verifiedFilter])

  const states = React.useMemo(() => [...new Set(facilities.map(f => f.state))].sort(), [facilities])
  const types = React.useMemo(() => [...new Set(facilities.map(f => f.type))], [facilities])

  const totalFacilities = facilities.length
  const verifiedCount = facilities.filter(f => f.isVerified).length
  const emergencyCount = facilities.filter(f => f.isEmergencyCapable).length
  const avgBedCapacity = totalFacilities > 0
    ? Math.round(facilities.reduce((sum, f) => sum + (f.bedCapacity || 0), 0) / totalFacilities)
    : 0

  const formatFacilityType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="size-6 text-emerald-600" />
            Facilities
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse and manage healthcare facilities across Nigeria
          </p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <Plus className="size-4" />
          Add Facility
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <Building2 className="size-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Facilities</p>
                <p className="text-2xl font-bold text-slate-900">{totalFacilities}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-teal-100 bg-gradient-to-br from-teal-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-100">
                <ShieldCheck className="size-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold text-slate-900">{verifiedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-100 bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <AlertTriangle className="size-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Emergency Capable</p>
                <p className="text-2xl font-bold text-slate-900">{emergencyCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-cyan-100 bg-gradient-to-br from-cyan-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-100">
                <Bed className="size-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Bed Capacity</p>
                <p className="text-2xl font-bold text-slate-900">{avgBedCapacity}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search facilities..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Facility Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {types.map(type => (
                  <SelectItem key={type} value={type}>{formatFacilityType(type)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {states.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="verified">Verified Only</SelectItem>
                <SelectItem value="unverified">Unverified Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-8 animate-spin text-emerald-500" />
          <span className="ml-3 text-muted-foreground">Loading facilities...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Facility Grid */}
          <div className="lg:col-span-2">
            {facilities.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="size-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-lg font-medium text-muted-foreground">No facilities found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery || typeFilter !== 'all' || stateFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'No facilities have been registered yet. Click "Add Facility" to get started.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {facilities.map(facility => (
                  <FacilityCard key={facility.id} facility={facility} formatFacilityType={formatFacilityType} />
                ))}
              </div>
            )}
          </div>

          {/* Map Placeholder */}
          <div className="lg:col-span-1">
            <Card className="h-full min-h-[400px]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <MapPin className="size-4 text-emerald-600" />
                  Facility Map
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-[350px] rounded-lg bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-100 flex flex-col items-center justify-center text-center p-6">
                  <div className="size-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                    <MapPin className="size-8 text-emerald-500" />
                  </div>
                  <h3 className="font-semibold text-slate-700 mb-1">Interactive Map</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    View {facilities.length} facilities across {states.length} states
                  </p>
                  <div className="space-y-2 w-full">
                    {states.slice(0, 8).map(state => {
                      const count = facilities.filter(f => f.state === state).length
                      return (
                        <div key={state} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{state}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-emerald-100 rounded-full h-2">
                              <div
                                className="bg-emerald-500 h-2 rounded-full"
                                style={{ width: `${totalFacilities > 0 ? (count / totalFacilities) * 100 : 0}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium">{count}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

function FacilityCard({ facility, formatFacilityType }: { facility: Facility; formatFacilityType: (type: string) => string }) {
  const services: string[] = (() => {
    try { return JSON.parse(facility.servicesOffered) } catch { return [] }
  })()

  const staffCount = facility._count?.staff || facility.staffCount || 0

  return (
    <Card className="hover:shadow-md transition-shadow border-slate-200">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-slate-900 truncate">{facility.name}</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <MapPin className="size-3" />
              {facility.address}, {facility.city}, {facility.state}
            </div>
          </div>
          {facility.isVerified && (
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] shrink-0 gap-1">
              <CheckCircle2 className="size-3" />
              Verified
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="text-[10px] bg-slate-50">{formatFacilityType(facility.type)}</Badge>
          <Badge variant="outline" className="text-[10px] bg-slate-50">{facility.state} State</Badge>
          {facility.isEmergencyCapable && (
            <Badge className="text-[10px] bg-red-50 text-red-700 border-red-200">
              <AlertTriangle className="size-3 mr-0.5" />
              Emergency
            </Badge>
          )}
        </div>

        {facility.bedCapacity && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Bed className="size-3" /> Bed Capacity
              </span>
              <span className="font-medium">{staffCount}/{facility.bedCapacity}</span>
            </div>
            <Progress value={facility.bedCapacity > 0 ? (staffCount / facility.bedCapacity) * 100 : 0} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground text-right">{facility.bedCapacity > 0 ? Math.round((staffCount / facility.bedCapacity) * 100) : 0}% occupied</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Phone className="size-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{facility.phone || 'N/A'}</span>
          </div>
        </div>

        {services.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {services.slice(0, 3).map(spec => (
              <span key={spec} className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
                {spec}
              </span>
            ))}
            {services.length > 3 && (
              <span className="text-[10px] text-muted-foreground px-1">
                +{services.length - 3} more
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
