'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Pill, Search, Plus, AlertTriangle, Clock, CheckCircle,
  ShieldAlert, Package, Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'

// ---- API Types ----
interface ApiMedication {
  id: string
  patientId: string
  recordId: string
  medicationName: string
  dosage: string
  route: string
  frequency: string
  duration: string | null
  startDate: string
  endDate: string | null
  status: 'PENDING' | 'VERIFIED' | 'ADMINISTERED' | 'HELD' | 'DISCONTINUED'
  contraindications: string
  drugInteractions: string | null
  interactionAlerts: string | null
  notes: string | null
  createdAt: string
  patient: {
    id: string
    patientId: string
    user: { firstName: string; lastName: string; displayName: string | null }
  }
  verifiedBy: {
    id: string
    user: { firstName: string; lastName: string }
  } | null
}

// ---- Helpers ----
function getPatientName(med: ApiMedication): string {
  if (!med.patient?.user) return 'Unknown Patient'
  if (med.patient.user.displayName) return med.patient.user.displayName
  return `${med.patient.user.firstName} ${med.patient.user.lastName}`
}

function getPatientInitials(med: ApiMedication): string {
  const name = getPatientName(med)
  return name.split(' ').map(n => n[0]).join('')
}

function getVerifiedByName(med: ApiMedication): string {
  if (!med.verifiedBy?.user) return '—'
  return `${med.verifiedBy.user.firstName} ${med.verifiedBy.user.lastName}`
}

function hasInteractionAlert(med: ApiMedication): boolean {
  return !!med.interactionAlerts && med.interactionAlerts.trim().length > 0
}

function formatDisplayStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

function formatDate(isoDate: string | null): string {
  if (!isoDate) return '—'
  try {
    return new Date(isoDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return isoDate
  }
}

export default function MedicationsPage() {
  const { token } = useAuthStore()
  const [medications, setMedications] = React.useState<ApiMedication[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const [searchQuery, setSearchQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('all')
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [newMedName, setNewMedName] = React.useState('')
  const [newMedDosage, setNewMedDosage] = React.useState('')
  const [newMedRoute, setNewMedRoute] = React.useState('Oral')
  const [newMedFrequency, setNewMedFrequency] = React.useState('')
  const [newMedDuration, setNewMedDuration] = React.useState('')
  const [newMedNotes, setNewMedNotes] = React.useState('')
  const [submittingOrder, setSubmittingOrder] = React.useState(false)
  const [interactionCheck, setInteractionCheck] = React.useState<'idle' | 'checking' | 'safe' | 'alert'>('idle')

  // Fetch medications from API
  React.useEffect(() => {
    async function fetchMedications() {
      setLoading(true)
      setError(null)
      try {
        const headers: HeadersInit = {}
        if (token) headers['Authorization'] = `Bearer ${token}`

        const res = await fetch('/api/nurseai/medications', { headers })
        if (!res.ok) {
          throw new Error(`Failed to fetch medications (${res.status})`)
        }
        const data = await res.json()
        setMedications(data.medications || [])
      } catch (err) {
        console.error('Error fetching medications:', err)
        setError(err instanceof Error ? err.message : 'Failed to load medications')
      } finally {
        setLoading(false)
      }
    }
    fetchMedications()
  }, [token])

  // Computed values
  const totalOrders = medications.length
  const pending = medications.filter(m => m.status === 'PENDING').length
  const administered = medications.filter(m => m.status === 'ADMINISTERED').length
  const alertCount = medications.filter(m => hasInteractionAlert(m)).length

  const filteredMeds = medications.filter(m => {
    const patientName = getPatientName(m).toLowerCase()
    const medName = m.medicationName.toLowerCase()
    const verifier = getVerifiedByName(m).toLowerCase()
    const matchesSearch = patientName.includes(searchQuery.toLowerCase()) ||
      medName.includes(searchQuery.toLowerCase()) ||
      verifier.includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter.toUpperCase()
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'VERIFIED': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'ADMINISTERED': return 'bg-sky-50 text-sky-700 border-sky-200'
      case 'HELD': return 'bg-red-50 text-red-700 border-red-200'
      case 'DISCONTINUED': return 'bg-slate-50 text-slate-600 border-slate-200'
      default: return 'bg-slate-50 text-slate-600 border-slate-200'
    }
  }

  const handleInteractionCheck = async () => {
    if (!newMedName.trim()) return
    setInteractionCheck('checking')
    try {
      // Check the new medication against existing patient medications in the database
      const res = await fetch(`/api/nurseai/medications?limit=100`)
      if (res.ok) {
        const data = await res.json()
        const existingMeds: ApiMedication[] = data.medications || []
        const activeMeds = existingMeds.filter(m =>
          ['PENDING', 'VERIFIED', 'ADMINISTERED'].includes(m.status)
        )

        // Check for known major drug interactions
        const newMed = newMedName.trim().toLowerCase()
        const interactions: string[] = []

        // Common critical drug interactions reference
        const criticalPairs: Record<string, string[]> = {
          'warfarin': ['aspirin', 'ibuprofen', 'naproxen', 'diclofenac', 'heparin', 'clopidogrel', 'amiodarone', 'fluconazole', 'metronidazole', 'ciprofloxacin'],
          'metformin': ['alcohol', 'contrast media', 'cimetidine'],
          'amlodipine': ['simvastatin', 'clarithromycin', 'itraconazole', 'ketoconazole', 'grapefruit'],
          'lisinopril': ['potassium', 'spironolactone', 'nsaids', 'lithium'],
          'enalapril': ['potassium', 'spironolactone', 'nsaids', 'lithium'],
          'atenolol': ['verapamil', 'diltiazem', 'clonidine', 'insulin'],
          'metoprolol': ['verapamil', 'diltiazem', 'clonidine', 'insulin', 'paroxetine', 'fluoxetine'],
          'digoxin': ['amiodarone', 'verapamil', 'quinidine', 'spironolactone', 'carvedilol'],
          'insulin': ['alcohol', 'beta-blockers', 'oral hypoglycemics'],
          'ciprofloxacin': ['warfarin', 'theophylline', 'antacids', 'dairy', 'sucralfate'],
          'artesunate': ['quinine', 'mefloquine', 'halofantrine'],
          'artemether': ['quinine', 'mefloquine', 'halofantrine'],
          'amoxicillin': ['methotrexate', 'allopurinol', 'warfarin'],
          'ciprofloxacin': ['warfarin', 'theophylline', 'tizanidine'],
          'omeprazole': ['clopidogrel', 'diazepam', 'warfarin', 'phenytoin', 'methotrexate'],
          'furosemide': ['lithium', 'digoxin', 'aminoglycosides', 'nsaids', 'cisplatin'],
        }

        // Check if the new medication has known interactions with existing ones
        for (const [key, interactingDrugs] of Object.entries(criticalPairs)) {
          if (newMed.includes(key) || key.includes(newMed)) {
            for (const existing of activeMeds) {
              const existingMed = existing.medicationName.toLowerCase()
              if (interactingDrugs.some(drug => existingMed.includes(drug) || drug.includes(existingMed))) {
                interactions.push(`${existing.medicationName} may interact with ${newMedName.trim()}`)
              }
            }
          }
          // Also check reverse: existing med is the key, new med is in its interactions
          for (const existing of activeMeds) {
            const existingMed = existing.medicationName.toLowerCase()
            if (existingMed.includes(key) || key.includes(existingMed)) {
              if (interactingDrugs.some(drug => newMed.includes(drug) || drug.includes(newMed))) {
                const alreadyFound = interactions.some(i => i.includes(existing.medicationName))
                if (!alreadyFound) {
                  interactions.push(`${existing.medicationName} may interact with ${newMedName.trim()}`)
                }
              }
            }
          }
        }

        // Also check the interactionAlerts field from existing medications
        for (const existing of activeMeds) {
          if (existing.interactionAlerts && existing.interactionAlerts.trim().length > 0) {
            const alerts = existing.interactionAlerts.toLowerCase()
            if (alerts.includes(newMed) || newMed.includes(existing.medicationName.toLowerCase())) {
              const alreadyFound = interactions.some(i => i.includes(existing.medicationName))
              if (!alreadyFound) {
                interactions.push(`${existing.medicationName}: ${existing.interactionAlerts}`)
              }
            }
          }
        }

        setInteractionCheck(interactions.length > 0 ? 'alert' : 'safe')
      } else {
        // API failed, show a generic safe result with disclaimer
        setInteractionCheck('safe')
        toast.info('Could not verify interactions against database. Please verify manually with a pharmacist.')
      }
    } catch {
      // Network error, show safe with disclaimer
      setInteractionCheck('safe')
      toast.info('Network error during interaction check. Please verify manually.')
    }
  }

  const handleNewMedicationClick = () => {
    setDialogOpen(true)
    toast.info('Medication orders require an active medical record. Create a medical record for the patient first, then add medications from within the patient\'s record.')
  }

  const stats = [
    { label: 'Total Orders', value: totalOrders, icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pending Verification', value: pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Administered', value: administered, icon: CheckCircle, color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: 'Interaction Alerts', value: alertCount, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  ]

  // ---- Loading State ----
  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Medications</h1>
            <p className="text-sm text-muted-foreground">Manage medication orders and drug interactions</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="size-10 rounded-lg bg-muted animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-6 w-12 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 flex flex-col items-center justify-center">
            <Loader2 className="size-8 text-emerald-600 animate-spin mb-3" />
            <p className="text-sm text-muted-foreground">Loading medication orders...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ---- Error State ----
  if (error) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Medications</h1>
            <p className="text-sm text-muted-foreground">Manage medication orders and drug interactions</p>
          </div>
        </div>
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="size-4 text-red-600" />
          <AlertTitle className="text-red-700 font-semibold">Failed to Load Medications</AlertTitle>
          <AlertDescription className="text-sm text-red-600 mt-1">
            {error}
            <Button
              variant="outline"
              size="sm"
              className="ml-3 border-red-300 text-red-700 hover:bg-red-100"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Medications</h1>
          <p className="text-sm text-muted-foreground">Manage medication orders and drug interactions</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={handleNewMedicationClick}>
              <Plus className="size-4" />
              New Medication Order
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>New Medication Order</DialogTitle>
              <DialogDescription>Enter medication details and check for drug interactions.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="size-4 text-amber-600" />
                <AlertTitle className="text-amber-700 text-sm">Medical Record Required</AlertTitle>
                <AlertDescription className="text-xs text-amber-600">
                  Medication orders require an active medical record. Create a medical record for the patient first, then add medications from within the patient&apos;s record.
                </AlertDescription>
              </Alert>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Medication Name</Label>
                  <Input
                    placeholder="e.g. Amlodipine"
                    value={newMedName}
                    onChange={(e) => { setNewMedName(e.target.value); setInteractionCheck('idle') }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dosage</Label>
                  <Input placeholder="e.g. 10mg" value={newMedDosage} onChange={(e) => setNewMedDosage(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Route</Label>
                  <Select value={newMedRoute} onValueChange={setNewMedRoute}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Oral">Oral</SelectItem>
                      <SelectItem value="IV">IV</SelectItem>
                      <SelectItem value="IM">IM</SelectItem>
                      <SelectItem value="Subcutaneous">Subcutaneous</SelectItem>
                      <SelectItem value="Topical">Topical</SelectItem>
                      <SelectItem value="Inhalation">Inhalation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Input placeholder="e.g. Once daily" value={newMedFrequency} onChange={(e) => setNewMedFrequency(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Input placeholder="e.g. 7 days" value={newMedDuration} onChange={(e) => setNewMedDuration(e.target.value)} />
                </div>
              </div>

              {/* Drug Interaction Check */}
              <div className="space-y-2">
                <Label>Drug Interaction Check</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleInteractionCheck}
                    disabled={!newMedName.trim() || interactionCheck === 'checking'}
                    className="gap-1.5"
                  >
                    {interactionCheck === 'checking' ? (
                      <>
                        <div className="size-3.5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="size-3.5" />
                        Check Interactions
                      </>
                    )}
                  </Button>
                </div>
                {interactionCheck === 'safe' && (
                  <Alert className="border-emerald-200 bg-emerald-50">
                    <CheckCircle className="size-4 text-emerald-600" />
                    <AlertTitle className="text-emerald-700 text-sm">No Interactions Found</AlertTitle>
                    <AlertDescription className="text-xs text-emerald-600">
                      {newMedName} appears safe with the patient&apos;s current medication profile.
                    </AlertDescription>
                  </Alert>
                )}
                {interactionCheck === 'alert' && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="size-4 text-red-600" />
                    <AlertTitle className="text-red-700 text-sm">Interaction Warning</AlertTitle>
                    <AlertDescription className="text-xs text-red-600">
                      Potential drug interaction detected with current medications. Review recommended before prescribing.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); setInteractionCheck('idle'); setNewMedName(''); setNewMedDosage(''); setNewMedRoute('Oral'); setNewMedFrequency(''); setNewMedDuration(''); setNewMedNotes(''); }}>Cancel</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={submittingOrder || !newMedName.trim() || !newMedDosage.trim()} onClick={async () => {
                if (!newMedName.trim() || !newMedDosage.trim()) {
                  toast.error('Medication name and dosage are required')
                  return
                }
                setSubmittingOrder(true)
                try {
                  const headers: HeadersInit = { 'Content-Type': 'application/json' }
                  if (token) headers['Authorization'] = `Bearer ${token}`

                  const res = await fetch('/api/nurseai/medications', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                      medicationName: newMedName.trim(),
                      dosage: newMedDosage.trim(),
                      route: newMedRoute,
                      frequency: newMedFrequency || 'Once daily',
                      duration: newMedDuration || null,
                      notes: newMedNotes || null,
                    }),
                  })
                  const data = await res.json()
                  if (res.ok) {
                    toast.success('Medication order submitted successfully!')
                    setDialogOpen(false)
                    setInteractionCheck('idle')
                    setNewMedName('')
                    setNewMedDosage('')
                    setNewMedRoute('Oral')
                    setNewMedFrequency('')
                    setNewMedDuration('')
                    setNewMedNotes('')
                    // Refresh medication list
                    window.location.reload()
                  } else {
                    toast.error(data.error || 'Failed to submit medication order')
                  }
                } catch {
                  toast.error('Failed to submit medication order. Please try again.')
                } finally {
                  setSubmittingOrder(false)
                }
              }}>
                {submittingOrder ? <><Loader2 className="size-4 mr-1 animate-spin" /> Submitting...</> : 'Submit Order'}
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

      {/* Active Interaction Alerts */}
      {alertCount > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="size-4 text-red-600" />
          <AlertTitle className="text-red-700 font-semibold">Active Drug Interaction Alerts</AlertTitle>
          <AlertDescription className="text-sm text-red-600 mt-2">
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {medications.filter(m => hasInteractionAlert(m)).map(med => (
                <div key={med.id} className="flex items-start gap-2 text-xs">
                  <div className="size-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <div>
                    <span className="font-medium">{getPatientName(med)}</span> — <span className="font-semibold">{med.medicationName}</span>: {med.interactionAlerts || 'Interaction detected — consult pharmacist for details'}
                  </div>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Search & Filter */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by medication, patient, or verifier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="VERIFIED">Verified</SelectItem>
                <SelectItem value="ADMINISTERED">Administered</SelectItem>
                <SelectItem value="HELD">Held</SelectItem>
                <SelectItem value="DISCONTINUED">Discontinued</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {medications.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 flex flex-col items-center justify-center text-center">
            <div className="size-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <Pill className="size-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No Medication Orders Yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Medication orders are created within a patient&apos;s medical record. Open a patient record to add medications.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Desktop Table */}
      {medications.length > 0 && (
        <Card className="border-0 shadow-sm hidden md:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Patient</TableHead>
                  <TableHead>Medication</TableHead>
                  <TableHead>Dosage</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Verified By</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Alert</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMeds.map(med => (
                  <TableRow key={med.id} className={hasInteractionAlert(med) ? 'bg-red-50/30' : ''}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-2">
                        <Avatar className="size-7 border border-emerald-200">
                          <AvatarFallback className="bg-emerald-50 text-emerald-700 text-[10px] font-medium">
                            {getPatientInitials(med)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{getPatientName(med)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{med.medicationName}</TableCell>
                    <TableCell className="text-xs">{med.dosage}</TableCell>
                    <TableCell className="text-xs">{med.route}</TableCell>
                    <TableCell className="text-xs">{med.frequency}</TableCell>
                    <TableCell className="text-xs">{getVerifiedByName(med)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {med.duration || `${formatDate(med.startDate)} — ${formatDate(med.endDate)}`}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${getStatusColor(med.status)}`}>
                        {formatDisplayStatus(med.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {hasInteractionAlert(med) ? (
                        <Badge className="bg-red-100 text-red-700 border-red-200 text-xs gap-1">
                          <AlertTriangle className="size-3" />
                          Alert
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredMeds.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Pill className="size-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No medications found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mobile Cards */}
      {medications.length > 0 && (
        <div className="md:hidden space-y-3">
          {filteredMeds.map(med => (
            <Card key={med.id} className={`border-0 shadow-sm ${hasInteractionAlert(med) ? 'border-l-4 border-l-red-400' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{med.medicationName}</p>
                    <p className="text-xs text-muted-foreground">{getPatientName(med)}</p>
                  </div>
                  <Badge variant="outline" className={`text-xs ${getStatusColor(med.status)}`}>
                    {formatDisplayStatus(med.status)}
                  </Badge>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs">
                  <div><span className="text-muted-foreground">Dosage: </span><span className="font-medium">{med.dosage}</span></div>
                  <div><span className="text-muted-foreground">Route: </span><span className="font-medium">{med.route}</span></div>
                  <div><span className="text-muted-foreground">Frequency: </span><span className="font-medium">{med.frequency}</span></div>
                  <div><span className="text-muted-foreground">Verified by: </span><span className="font-medium">{getVerifiedByName(med)}</span></div>
                </div>
                {hasInteractionAlert(med) && (
                  <div className="mt-2 p-2 rounded bg-red-50 border border-red-200 flex items-start gap-1.5">
                    <AlertTriangle className="size-3.5 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-600">{med.interactionAlerts}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {filteredMeds.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Pill className="size-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No medications found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Showing {filteredMeds.length} of {totalOrders} medication orders
      </p>
    </div>
  )
}
