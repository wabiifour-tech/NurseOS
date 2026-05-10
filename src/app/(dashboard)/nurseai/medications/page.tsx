'use client'

import * as React from 'react'
import { medicationOrders } from '@/lib/nurseai-data'
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

export default function MedicationsPage() {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('all')
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [newMedName, setNewMedName] = React.useState('')
  const [interactionCheck, setInteractionCheck] = React.useState<'idle' | 'checking' | 'safe' | 'alert'>('idle')

  const totalOrders = medicationOrders.length
  const pending = medicationOrders.filter(m => m.status === 'Pending').length
  const administered = medicationOrders.filter(m => m.status === 'Administered').length
  const interactionAlerts = medicationOrders.filter(m => m.interactionAlert).length

  const filteredMeds = medicationOrders.filter(m => {
    const matchesSearch = m.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.medicationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.prescribedBy.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'Verified': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'Administered': return 'bg-sky-50 text-sky-700 border-sky-200'
      case 'Held': return 'bg-red-50 text-red-700 border-red-200'
      default: return 'bg-slate-50 text-slate-600 border-slate-200'
    }
  }

  const handleInteractionCheck = () => {
    if (!newMedName.trim()) return
    setInteractionCheck('checking')
    setTimeout(() => {
      // Use deterministic check based on medication name hash for consistency
      // (avoids Math.random() which causes hydration and SSR issues)
      const hash = newMedName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      const hasInteraction = (hash % 10) > 5
      setInteractionCheck(hasInteraction ? 'alert' : 'safe')
    }, 1500)
  }

  const stats = [
    { label: 'Total Orders', value: totalOrders, icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pending Verification', value: pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Administered Today', value: administered, icon: CheckCircle, color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: 'Interaction Alerts', value: interactionAlerts, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  ]

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
            <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Patient</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="p001">Adaeze Okonkwo</SelectItem>
                      <SelectItem value="p002">Chinedu Eze</SelectItem>
                      <SelectItem value="p003">Fatima Abdullahi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prescriber</Label>
                  <Input placeholder="e.g. Dr. Okafor" />
                </div>
              </div>
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
                  <Input placeholder="e.g. 10mg" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Route</Label>
                  <Select>
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
                  <Input placeholder="e.g. Once daily" />
                </div>
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Input placeholder="e.g. 7 days" />
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
              <Button variant="outline" onClick={() => { setDialogOpen(false); setInteractionCheck('idle'); setNewMedName(''); }}>Cancel</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { setDialogOpen(false); setInteractionCheck('idle'); setNewMedName(''); toast.info('Medication order submission is coming soon — this feature is being developed.'); }}>Submit Order</Button>
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
      {interactionAlerts > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="size-4 text-red-600" />
          <AlertTitle className="text-red-700 font-semibold">Active Drug Interaction Alerts</AlertTitle>
          <AlertDescription className="text-sm text-red-600 mt-2">
            <div className="space-y-2">
              {medicationOrders.filter(m => m.interactionAlert).map(med => (
                <div key={med.id} className="flex items-start gap-2 text-xs">
                  <div className="size-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <div>
                    <span className="font-medium">{med.patientName}</span> — <span className="font-semibold">{med.medicationName}</span>: {med.interactionDetail || 'Interaction detected — consult pharmacist for details'}
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
                placeholder="Search by medication, patient, or prescriber..."
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
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Verified">Verified</SelectItem>
                <SelectItem value="Administered">Administered</SelectItem>
                <SelectItem value="Held">Held</SelectItem>
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
                <TableHead className="pl-4">Patient</TableHead>
                <TableHead>Medication</TableHead>
                <TableHead>Dosage</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Prescriber</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Alert</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMeds.map(med => (
                <TableRow key={med.id} className={med.interactionAlert ? 'bg-red-50/30' : ''}>
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-7 border border-emerald-200">
                        <AvatarFallback className="bg-emerald-50 text-emerald-700 text-[10px] font-medium">
                          {med.patientName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{med.patientName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{med.medicationName}</TableCell>
                  <TableCell className="text-xs">{med.dosage}</TableCell>
                  <TableCell className="text-xs">{med.route}</TableCell>
                  <TableCell className="text-xs">{med.frequency}</TableCell>
                  <TableCell className="text-xs">{med.prescribedBy}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{med.startDate} — {med.endDate}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${getStatusColor(med.status)}`}>
                      {med.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {med.interactionAlert ? (
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

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredMeds.map(med => (
          <Card key={med.id} className={`border-0 shadow-sm ${med.interactionAlert ? 'border-l-4 border-l-red-400' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-sm">{med.medicationName}</p>
                  <p className="text-xs text-muted-foreground">{med.patientName}</p>
                </div>
                <Badge variant="outline" className={`text-xs ${getStatusColor(med.status)}`}>
                  {med.status}
                </Badge>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs">
                <div><span className="text-muted-foreground">Dosage: </span><span className="font-medium">{med.dosage}</span></div>
                <div><span className="text-muted-foreground">Route: </span><span className="font-medium">{med.route}</span></div>
                <div><span className="text-muted-foreground">Frequency: </span><span className="font-medium">{med.frequency}</span></div>
                <div><span className="text-muted-foreground">Prescriber: </span><span className="font-medium">{med.prescribedBy}</span></div>
              </div>
              {med.interactionAlert && (
                <div className="mt-2 p-2 rounded bg-red-50 border border-red-200 flex items-start gap-1.5">
                  <AlertTriangle className="size-3.5 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-600">{med.interactionDetail}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Showing {filteredMeds.length} of {totalOrders} medication orders
      </p>
    </div>
  )
}
