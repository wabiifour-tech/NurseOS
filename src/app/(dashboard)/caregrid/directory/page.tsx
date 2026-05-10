"use client"

import * as React from "react"
import { nurseProfiles, type NurseProfile } from "@/lib/caregrid-data"
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
} from "lucide-react"

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

const consultTypeIcons = {
  Video: Video,
  Chat: MessageCircle,
  Phone: Phone,
}

export default function NurseDirectoryPage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [specFilter, setSpecFilter] = React.useState("All Specializations")
  const [availableOnly, setAvailableOnly] = React.useState(false)

  const filtered = React.useMemo(() => {
    return nurseProfiles.filter(n => {
      const matchesSearch = n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.facility.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesSpec = specFilter === "All Specializations" || n.specialization === specFilter
      const matchesAvailable = !availableOnly || n.availableForConsult
      return matchesSearch && matchesSpec && matchesAvailable
    })
  }, [searchQuery, specFilter, availableOnly])

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
                {specializations.map(spec => (
                  <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={availableOnly ? "default" : "outline"}
              className={availableOnly ? "bg-emerald-600 hover:bg-emerald-700 text-white gap-2" : "gap-2"}
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
          Showing <span className="font-medium text-slate-900">{filtered.length}</span> of {nurseProfiles.length} nurses
        </p>
      </div>

      {/* Nurse Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(nurse => (
          <NurseCard key={nurse.id} nurse={nurse} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Search className="size-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No nurses found matching your criteria</p>
        </div>
      )}
    </div>
  )
}

function NurseCard({ nurse }: { nurse: NurseProfile }) {
  return (
    <Card className="hover:shadow-md transition-shadow border-slate-200">
      <CardContent className="p-4 space-y-4">
        {/* Profile Header */}
        <div className="flex items-start gap-3">
          <Avatar className="size-14 border-2 border-emerald-200 shrink-0">
            <AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold text-base">
              {nurse.initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-slate-900">{nurse.name}</h3>
            <p className="text-xs text-muted-foreground font-mono">{nurse.license}</p>
            <div className="flex items-center gap-1 mt-1">
              <Star className="size-3.5 text-amber-500 fill-amber-500" />
              <span className="text-xs font-medium">{nurse.rating}</span>
              <span className="text-[10px] text-muted-foreground ml-1">• {nurse.yearsExperience} yrs exp</span>
            </div>
          </div>
          {nurse.availableForConsult ? (
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
          <div className="flex items-center gap-2 text-xs">
            <Briefcase className="size-3.5 text-emerald-500" />
            <span className="font-medium text-slate-700">{nurse.specialization}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="size-3.5" />
            {nurse.facility}, {nurse.state}
          </div>
        </div>

        {/* Expertise Tags */}
        <div className="flex flex-wrap gap-1">
          {nurse.expertise.map(exp => (
            <span key={exp} className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
              {exp}
            </span>
          ))}
        </div>

        {/* Languages */}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span>Languages:</span>
          {nurse.languages.map((lang, i) => (
            <span key={lang}>
              {lang}{i < nurse.languages.length - 1 ? "," : ""}
            </span>
          ))}
        </div>

        {/* Consult Types */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">Consult via:</span>
          <div className="flex gap-1">
            {nurse.consultTypes.map(type => {
              const Icon = consultTypeIcons[type]
              return (
                <div key={type} className="size-6 rounded bg-slate-100 flex items-center justify-center" title={type}>
                  <Icon className="size-3.5 text-slate-500" />
                </div>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button size="sm" variant="outline" className="flex-1 text-xs h-8 gap-1">
            <Clock className="size-3" />
            View Profile
          </Button>
          {nurse.availableForConsult && (
            <Button size="sm" className="flex-1 text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
              <Video className="size-3" />
              Request Consultation
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
