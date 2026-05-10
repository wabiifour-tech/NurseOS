'use client'

import * as React from 'react'
import Link from 'next/link'
import { patients } from '@/lib/nurseai-data'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Users, UserCheck, Stethoscope, AlertTriangle, Search, Plus, Phone, MapPin } from 'lucide-react'

export default function PatientsPage() {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [genderFilter, setGenderFilter] = React.useState('all')
  const [bloodTypeFilter, setBloodTypeFilter] = React.useState('all')
  const [wardFilter, setWardFilter] = React.useState('all')
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const totalPatients = patients.length
  const inpatient = patients.filter(p => p.status === 'Inpatient').length
  const outpatient = patients.filter(p => p.status === 'Outpatient').length
  const emergency = patients.filter(p => p.status === 'Emergency').length

  const wards = [...new Set(patients.map(p => p.ward))]
  const bloodTypes = [...new Set(patients.map(p => p.bloodType))]

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.primaryDiagnosis.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesGender = genderFilter === 'all' || p.gender === genderFilter
    const matchesBloodType = bloodTypeFilter === 'all' || p.bloodType === bloodTypeFilter
    const matchesWard = wardFilter === 'all' || p.ward === wardFilter
    return matchesSearch && matchesGender && matchesBloodType && matchesWard
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Inpatient': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'Outpatient': return 'bg-sky-50 text-sky-700 border-sky-200'
      case 'Emergency': return 'bg-red-50 text-red-700 border-red-200'
      case 'Discharged': return 'bg-slate-50 text-slate-600 border-slate-200'
      default: return 'bg-slate-50 text-slate-600 border-slate-200'
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const stats = [
    { label: 'Total Patients', value: totalPatients, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Inpatient', value: inpatient, icon: UserCheck, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Outpatient', value: outpatient, icon: Stethoscope, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { label: 'Emergency', value: emergency, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  ]

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Patients</h1>
          <p className="text-sm text-muted-foreground">Manage and view all patient records</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
              <Plus className="size-4" />
              Add New Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Register New Patient</DialogTitle>
              <DialogDescription>Enter patient demographic and clinical information.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" placeholder="e.g. Adaeze" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" placeholder="e.g. Okonkwo" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" type="number" placeholder="34" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bloodType">Blood Type</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bt => (
                        <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" placeholder="+234 800 000 0000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" placeholder="e.g. 23 Awolowo Rd, Ikoyi, Lagos" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ward">Ward</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select ward" /></SelectTrigger>
                    <SelectContent>
                      {wards.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diagnosis">Primary Diagnosis</Label>
                  <Input id="diagnosis" placeholder="e.g. Severe Malaria" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="allergies">Allergies (comma-separated)</Label>
                <Input id="allergies" placeholder="e.g. Penicillin, Sulfa drugs" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setDialogOpen(false)}>Register Patient</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(stat => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`size-10 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}>
                <stat.icon className={`size-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or diagnosis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
            <Select value={bloodTypeFilter} onValueChange={setBloodTypeFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Blood Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {bloodTypes.sort().map(bt => (
                  <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={wardFilter} onValueChange={setWardFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Ward" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Wards</SelectItem>
                {wards.map(w => (
                  <SelectItem key={w} value={w}>{w}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Desktop Table */}
      <Card className="border-0 shadow-sm hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Name</TableHead>
                <TableHead>Patient ID</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Blood Type</TableHead>
                <TableHead>Ward</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Visit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.map(patient => (
                <TableRow key={patient.id} className="cursor-pointer hover:bg-emerald-50/50 transition-colors">
                  <TableCell className="pl-4">
                    <Link href={`/nurseai/patients/${patient.id}`} className="flex items-center gap-3">
                      <Avatar className="size-8 border border-emerald-200">
                        <AvatarFallback className="bg-emerald-50 text-emerald-700 text-xs font-medium">
                          {getInitials(patient.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{patient.name}</p>
                        <p className="text-xs text-muted-foreground">{patient.primaryDiagnosis}</p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/nurseai/patients/${patient.id}`} className="text-sm font-mono text-muted-foreground">
                      {patient.patientId}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/nurseai/patients/${patient.id}`}>{patient.age}</Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/nurseai/patients/${patient.id}`}>{patient.gender}</Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/nurseai/patients/${patient.id}`}>
                      <Badge variant="outline" className="font-mono text-xs">{patient.bloodType}</Badge>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/nurseai/patients/${patient.id}`} className="text-sm">{patient.ward}</Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/nurseai/patients/${patient.id}`}>
                      <Badge variant="outline" className={`text-xs ${getStatusColor(patient.status)}`}>
                        {patient.status}
                      </Badge>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/nurseai/patients/${patient.id}`} className="text-sm text-muted-foreground">
                      {patient.lastVisit}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredPatients.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="size-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No patients found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredPatients.map(patient => (
          <Link key={patient.id} href={`/nurseai/patients/${patient.id}`}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10 border border-emerald-200">
                      <AvatarFallback className="bg-emerald-50 text-emerald-700 text-sm font-medium">
                        {getInitials(patient.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{patient.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{patient.patientId}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-xs ${getStatusColor(patient.status)}`}>
                    {patient.status}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <span>Age: <span className="text-foreground font-medium">{patient.age}</span></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <span>Gender: <span className="text-foreground font-medium">{patient.gender}</span></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <span>Blood: <span className="text-foreground font-medium">{patient.bloodType}</span></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="size-3" />
                    <span className="text-foreground font-medium truncate">{patient.ward.split(' - ')[1]}</span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground truncate">{patient.primaryDiagnosis}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
        {filteredPatients.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="size-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No patients found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground text-center">
        Showing {filteredPatients.length} of {totalPatients} patients
      </p>
    </div>
  )
}
