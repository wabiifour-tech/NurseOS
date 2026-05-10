'use client'

import * as React from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Users, UserCheck, Stethoscope, AlertTriangle, Search, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Patient {
  id: string
  patientId: string
  dateOfBirth: string | null
  gender: string | null
  bloodType: string | null
  genotype: string | null
  allergies: string
  nationality: string | null
  createdAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    displayName: string | null
    email: string
    phone: string | null
    avatarUrl: string | null
  } | null
}

export default function PatientsPage() {
  const [patients, setPatients] = React.useState<Patient[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [genderFilter, setGenderFilter] = React.useState('all')
  const [bloodTypeFilter, setBloodTypeFilter] = React.useState('all')
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  // Form state
  const [formFirstName, setFormFirstName] = React.useState('')
  const [formLastName, setFormLastName] = React.useState('')
  const [formAge, setFormAge] = React.useState('')
  const [formGender, setFormGender] = React.useState('')
  const [formBloodType, setFormBloodType] = React.useState('')
  const [formPhone, setFormPhone] = React.useState('')
  const [formEmail, setFormEmail] = React.useState('')
  const [formAllergies, setFormAllergies] = React.useState('')

  // Fetch patients from API
  const fetchPatients = React.useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      if (genderFilter && genderFilter !== 'all') params.set('gender', genderFilter)
      if (bloodTypeFilter && bloodTypeFilter !== 'all') params.set('bloodType', bloodTypeFilter)
      params.set('limit', '50')

      const res = await fetch(`/api/nurseai/patients?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setPatients(data.patients || [])
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, genderFilter, bloodTypeFilter])

  React.useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  // Create patient
  const handleCreatePatient = async () => {
    if (!formFirstName || !formLastName) {
      toast.error('First name and last name are required')
      return
    }
    setSubmitting(true)
    try {
      const dob = formAge ? new Date(new Date().getFullYear() - parseInt(formAge), 0, 1).toISOString() : null

      const res = await fetch('/api/nurseai/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formFirstName,
          lastName: formLastName,
          email: formEmail || undefined,
          phone: formPhone || undefined,
          dateOfBirth: dob,
          gender: formGender || undefined,
          bloodType: formBloodType || undefined,
          allergies: formAllergies ? formAllergies.split(',').map(a => a.trim()) : [],
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to create patient')
        setSubmitting(false)
        return
      }

      toast.success(`Patient ${formFirstName} ${formLastName} registered successfully!`)
      setDialogOpen(false)
      // Reset form
      setFormFirstName('')
      setFormLastName('')
      setFormAge('')
      setFormGender('')
      setFormBloodType('')
      setFormPhone('')
      setFormEmail('')
      setFormAllergies('')
      // Refresh patients list
      fetchPatients()
    } catch {
      toast.error('Failed to create patient. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const getAge = (dob: string | null) => {
    if (!dob) return '—'
    const birth = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age
  }

  const totalPatients = patients.length
  const malePatients = patients.filter(p => p.gender === 'Male').length
  const femalePatients = patients.filter(p => p.gender === 'Female').length

  const bloodTypes = [...new Set(patients.map(p => p.bloodType).filter(Boolean))] as string[]

  const stats = [
    { label: 'Total Patients', value: totalPatients, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Male', value: malePatients, icon: UserCheck, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Female', value: femalePatients, icon: Stethoscope, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { label: 'New This Month', value: patients.filter(p => {
      const created = new Date(p.createdAt)
      const now = new Date()
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
    }).length, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
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
          <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            Add New Patient
          </Button>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Register New Patient</DialogTitle>
              <DialogDescription>Enter patient demographic and clinical information.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input id="firstName" placeholder="e.g. Adaeze" value={formFirstName} onChange={e => setFormFirstName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input id="lastName" placeholder="e.g. Okonkwo" value={formLastName} onChange={e => setFormLastName(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" type="number" placeholder="34" value={formAge} onChange={e => setFormAge(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formGender} onValueChange={setFormGender}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bloodType">Blood Type</Label>
                  <Select value={formBloodType} onValueChange={setFormBloodType}>
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
                <Input id="phone" placeholder="+234 800 000 0000" value={formPhone} onChange={e => setFormPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (optional)</Label>
                <Input id="email" type="email" placeholder="patient@email.com" value={formEmail} onChange={e => setFormEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="allergies">Allergies (comma-separated)</Label>
                <Input id="allergies" placeholder="e.g. Penicillin, Sulfa drugs" value={formAllergies} onChange={e => setFormAllergies(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleCreatePatient} disabled={submitting}>
                {submitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                Register Patient
              </Button>
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
                placeholder="Search by name, ID, or email..."
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
                  <SelectItem key={bt} value={bt!}>{bt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <>
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
                    <TableHead>Allergies</TableHead>
                    <TableHead>Registered</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map(patient => (
                    <TableRow key={patient.id} className="cursor-pointer hover:bg-emerald-50/50 transition-colors">
                      <TableCell className="pl-4">
                        <Link href={`/nurseai/patients/${patient.id}`} className="flex items-center gap-3">
                          <Avatar className="size-8 border border-emerald-200">
                            <AvatarFallback className="bg-emerald-50 text-emerald-700 text-xs font-medium">
                              {patient.user ? getInitials(patient.user.firstName, patient.user.lastName) : 'PT'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">
                              {patient.user ? `${patient.user.firstName} ${patient.user.lastName}` : 'Unknown'}
                            </p>
                            <p className="text-xs text-muted-foreground">{patient.user?.email || '—'}</p>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link href={`/nurseai/patients/${patient.id}`} className="text-sm font-mono text-muted-foreground">
                          {patient.patientId}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link href={`/nurseai/patients/${patient.id}`}>{getAge(patient.dateOfBirth)}</Link>
                      </TableCell>
                      <TableCell>
                        <Link href={`/nurseai/patients/${patient.id}`}>{patient.gender || '—'}</Link>
                      </TableCell>
                      <TableCell>
                        <Link href={`/nurseai/patients/${patient.id}`}>
                          <Badge variant="outline" className="font-mono text-xs">{patient.bloodType || '—'}</Badge>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link href={`/nurseai/patients/${patient.id}`} className="text-sm">
                          {(() => {
                            try {
                              const allergies = JSON.parse(patient.allergies || '[]')
                              return allergies.length > 0 ? allergies.join(', ') : 'None'
                            } catch { return 'None' }
                          })()}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link href={`/nurseai/patients/${patient.id}`} className="text-sm text-muted-foreground">
                          {new Date(patient.createdAt).toLocaleDateString()}
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {patients.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="size-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No patients yet</p>
                  <p className="text-sm">Register your first patient to get started</p>
                  <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={() => setDialogOpen(true)}>
                    <Plus className="size-4" />
                    Add First Patient
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {patients.map(patient => (
              <Link key={patient.id} href={`/nurseai/patients/${patient.id}`}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="size-10 border border-emerald-200">
                        <AvatarFallback className="bg-emerald-50 text-emerald-700 text-sm font-medium">
                          {patient.user ? getInitials(patient.user.firstName, patient.user.lastName) : 'PT'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                          {patient.user ? `${patient.user.firstName} ${patient.user.lastName}` : 'Unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">{patient.patientId}</p>
                        <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                          <span>Age: <span className="text-foreground font-medium">{getAge(patient.dateOfBirth)}</span></span>
                          <span>Gender: <span className="text-foreground font-medium">{patient.gender || '—'}</span></span>
                          <span>Blood: <span className="text-foreground font-medium">{patient.bloodType || '—'}</span></span>
                          <span>Added: <span className="text-foreground font-medium">{new Date(patient.createdAt).toLocaleDateString()}</span></span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {patients.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="size-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No patients yet</p>
                <p className="text-sm">Register your first patient to get started</p>
                <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={() => setDialogOpen(true)}>
                  <Plus className="size-4" />
                  Add First Patient
                </Button>
              </div>
            )}
          </div>

          {/* Results count */}
          <p className="text-xs text-muted-foreground text-center">
            Showing {patients.length} patient{patients.length !== 1 ? 's' : ''}
          </p>
        </>
      )}
    </div>
  )
}
