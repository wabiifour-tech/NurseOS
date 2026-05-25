'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Beaker,
  Plus,
  Loader2,
  AlertCircle,
  Search,
  Filter,
  Clock,
  User,
  TestTube,
} from 'lucide-react'
import { toast } from 'sonner'

interface LabOrder {
  id: string
  patientId: string
  patientName: string
  recordId: string
  orderedBy: string
  testName: string
  testCategory: string
  specimenType: string | null
  urgency: string
  status: string
  resultValue: string | null
  resultUnit: string | null
  referenceRange: string | null
  isAbnormal: boolean | null
  resultDate: string | null
  notes: string | null
  createdAt: string
}

const testCategories = [
  'Hematology',
  'Chemistry',
  'Microbiology',
  'Pathology',
  'Immunology',
  'Urinalysis',
  'Blood Banking',
  'Molecular Diagnostics',
  'Other',
]

const urgencyLevels = ['ROUTINE', 'URGENT', 'STAT']

const specimenTypes = [
  'Blood',
  'Urine',
  'Serum',
  'Plasma',
  'CSF',
  'Sputum',
  'Swab',
  'Tissue',
  'Other',
]

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return `${d.getDate().toString().padStart(2, '0')} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`
  } catch {
    return iso
  }
}

function getStatusColor(status: string): string {
  switch (status.toUpperCase()) {
    case 'ORDERED': return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'IN_PROGRESS': return 'bg-sky-50 text-sky-700 border-sky-200'
    case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'CANCELLED': return 'bg-slate-50 text-slate-600 border-slate-200'
    default: return 'bg-slate-50 text-slate-600 border-slate-200'
  }
}

function getUrgencyColor(urgency: string): string {
  switch (urgency.toUpperCase()) {
    case 'STAT': return 'bg-red-50 text-red-700 border-red-200'
    case 'URGENT': return 'bg-amber-50 text-amber-700 border-amber-200'
    default: return 'bg-slate-50 text-slate-600 border-slate-200'
  }
}

export default function LabOrdersPage() {
  const [labOrders, setLabOrders] = React.useState<LabOrder[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('all')

  // New lab order dialog
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [form, setForm] = React.useState({
    patientId: '',
    testName: '',
    testCategory: 'Hematology',
    specimenType: 'Blood',
    urgency: 'ROUTINE',
    notes: '',
  })

  const fetchLabOrders = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      params.set('limit', '100')

      const res = await fetch(`/api/nurseai/lab-orders?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch lab orders')
      const data = await res.json()
      setLabOrders(data.labOrders || [])
    } catch {
      toast.error('Failed to load lab orders')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  React.useEffect(() => {
    fetchLabOrders()
  }, [fetchLabOrders])

  const handleSubmit = async () => {
    if (!form.patientId.trim() || !form.testName.trim()) {
      toast.error('Patient ID and test name are required')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/nurseai/lab-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to create lab order')
        setIsSubmitting(false)
        return
      }
      toast.success('Lab order created successfully!')
      setDialogOpen(false)
      setForm({
        patientId: '',
        testName: '',
        testCategory: 'Hematology',
        specimenType: 'Blood',
        urgency: 'ROUTINE',
        notes: '',
      })
      fetchLabOrders()
    } catch {
      toast.error('Failed to create lab order')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter by search
  const filtered = labOrders.filter((order) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      order.patientName.toLowerCase().includes(q) ||
      order.testName.toLowerCase().includes(q) ||
      order.testCategory.toLowerCase().includes(q) ||
      order.status.toLowerCase().includes(q)
    )
  })

  // Stats
  const totalOrders = labOrders.length
  const pendingOrders = labOrders.filter(o => o.status.toUpperCase() === 'ORDERED').length
  const completedOrders = labOrders.filter(o => o.status.toUpperCase() === 'COMPLETED').length
  const abnormalResults = labOrders.filter(o => o.isAbnormal === true).length

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Beaker className="size-6 text-emerald-600" />
            Lab Orders
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and track laboratory test orders
          </p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          New Lab Order
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <TestTube className="size-5 text-emerald-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">{totalOrders}</p>
            <p className="text-xs text-muted-foreground">Total Orders</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <Clock className="size-5 text-amber-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">{pendingOrders}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <Beaker className="size-5 text-teal-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">{completedOrders}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <AlertCircle className="size-5 text-red-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{abnormalResults}</p>
            <p className="text-xs text-muted-foreground">Abnormal Results</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by patient, test name, category..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="size-3.5 mr-1.5" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ORDERED">Ordered</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lab Orders Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="size-8 text-emerald-600 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading lab orders...</p>
        </div>
      ) : filtered.length > 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Test Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Specimen</TableHead>
                    <TableHead>Urgency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((order) => (
                    <TableRow key={order.id} className={order.isAbnormal ? 'bg-red-50/50' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="size-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium">{order.patientName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{order.testName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{order.testCategory}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{order.specimenType || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${getUrgencyColor(order.urgency)}`}>
                          {order.urgency}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${getStatusColor(order.status)}`}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.resultValue ? (
                          <span className={`text-sm font-semibold ${order.isAbnormal ? 'text-red-600' : 'text-emerald-600'}`}>
                            {order.resultValue}{order.resultUnit ? ` ${order.resultUnit}` : ''}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Pending</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{formatDate(order.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Beaker className="size-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="font-medium text-muted-foreground">No lab orders found</p>
            <p className="text-sm text-muted-foreground">
              {labOrders.length === 0
                ? 'Create your first lab order to get started.'
                : 'No lab orders match your search criteria.'}
            </p>
            <Button
              variant="outline"
              className="mt-4 gap-2"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="size-4" /> New Lab Order
            </Button>
          </CardContent>
        </Card>
      )}

      {/* New Lab Order Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Beaker className="size-5 text-emerald-600" />
              New Lab Order
            </DialogTitle>
            <DialogDescription>
              Create a new laboratory test order for a patient
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patientId">Patient ID *</Label>
              <Input
                id="patientId"
                placeholder="Enter patient ID or search..."
                value={form.patientId}
                onChange={(e) => setForm({ ...form, patientId: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Enter the patient&apos;s unique ID</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="testName">Test Name *</Label>
              <Input
                id="testName"
                placeholder="e.g., Complete Blood Count"
                value={form.testName}
                onChange={(e) => setForm({ ...form, testName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Test Category</Label>
                <Select
                  value={form.testCategory}
                  onValueChange={(val) => setForm({ ...form, testCategory: val })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {testCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Specimen Type</Label>
                <Select
                  value={form.specimenType}
                  onValueChange={(val) => setForm({ ...form, specimenType: val })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {specimenTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Urgency</Label>
              <Select
                value={form.urgency}
                onValueChange={(val) => setForm({ ...form, urgency: val })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {urgencyLevels.map((level) => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes or clinical context..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="min-h-[80px]"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 flex-1"
                onClick={handleSubmit}
                disabled={isSubmitting || !form.patientId.trim() || !form.testName.trim()}
              >
                {isSubmitting ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Plus className="size-4 mr-1" />}
                Create Lab Order
              </Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
