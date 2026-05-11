'use client'

import * as React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  MoreHorizontal,
  Copy,
  Eye,
  Download,
  Shield,
  Filter,
  Search,
  Link2,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'

// API response type
interface ApiCredential {
  id: string
  nurseId: string
  credentialType: string
  credentialName: string
  issuingBody: string
  issueDate: string
  expiryDate: string | null
  credentialNumber: string | null
  verificationHash: string | null
  isVerified: boolean
  documentUrl: string | null
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

// Computed display status
type DisplayStatus = 'Verified' | 'Pending' | 'Expired' | 'Expiring Soon'

const CREDENTIAL_TYPES = ['License', 'Certification', 'Degree', 'BLS', 'ACLS']

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function computeStatus(cred: ApiCredential): DisplayStatus {
  if (!cred.isVerified) {
    return 'Pending'
  }
  if (cred.expiryDate) {
    const expiry = new Date(cred.expiryDate)
    const now = new Date()
    const thirtyDays = 30 * 24 * 60 * 60 * 1000
    if (expiry < now) return 'Expired'
    if (expiry.getTime() - now.getTime() < thirtyDays) return 'Expiring Soon'
  }
  return 'Verified'
}

export default function CredentialsPage() {
  const { token } = useAuthStore()
  const [credentials, setCredentials] = React.useState<ApiCredential[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [typeFilter, setTypeFilter] = React.useState('All')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [addDialogOpen, setAddDialogOpen] = React.useState(false)
  const [viewHashDialogOpen, setViewHashDialogOpen] = React.useState(false)
  const [selectedCredential, setSelectedCredential] = React.useState<ApiCredential | null>(null)
  const [copied, setCopied] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  // Form state
  const [formName, setFormName] = React.useState('')
  const [formType, setFormType] = React.useState('')
  const [formCredId, setFormCredId] = React.useState('')
  const [formIssuingBody, setFormIssuingBody] = React.useState('')
  const [formIssueDate, setFormIssueDate] = React.useState('')
  const [formExpiryDate, setFormExpiryDate] = React.useState('')

  // Fetch credentials
  const fetchCredentials = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const headers: HeadersInit = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch('/api/nurseid/credentials', { headers })
      if (!res.ok) throw new Error(`Failed to fetch credentials (${res.status})`)
      const data = await res.json()
      setCredentials(data.credentials || [])
    } catch (err) {
      console.error('Error fetching credentials:', err)
      const msg = err instanceof Error ? err.message : 'Failed to load credentials'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [token])

  React.useEffect(() => {
    fetchCredentials()
  }, [fetchCredentials])

  // Submit new credential
  const handleSubmit = async () => {
    if (!formName || !formType || !formIssuingBody) {
      toast.error('Credential name, type, and issuing body are required')
      return
    }
    setSubmitting(true)
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch('/api/nurseid/credentials', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          credentialName: formName,
          credentialType: formType,
          issuingBody: formIssuingBody,
          issueDate: formIssueDate || undefined,
          expiryDate: formExpiryDate || undefined,
          credentialNumber: formCredId || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add credential')
      }

      toast.success('Credential submitted for verification')
      setAddDialogOpen(false)
      resetForm()
      fetchCredentials()
    } catch (err) {
      console.error('Error adding credential:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to add credential')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormName('')
    setFormType('')
    setFormCredId('')
    setFormIssuingBody('')
    setFormIssueDate('')
    setFormExpiryDate('')
  }

  const filteredCredentials = credentials.filter((cred) => {
    const matchesType = typeFilter === 'All' || cred.credentialType === typeFilter
    const matchesSearch =
      searchQuery === '' ||
      cred.credentialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cred.issuingBody.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesSearch
  })

  const statusBadge = (status: DisplayStatus) => {
    switch (status) {
      case 'Verified':
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20 gap-1">
            <CheckCircle2 className="size-3" /> Verified
          </Badge>
        )
      case 'Pending':
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20 gap-1">
            <Clock className="size-3" /> Pending
          </Badge>
        )
      case 'Expired':
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20 gap-1">
            <XCircle className="size-3" /> Expired
          </Badge>
        )
      case 'Expiring Soon':
        return (
          <Badge className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/20 gap-1">
            <AlertTriangle className="size-3" /> Expiring Soon
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const copyHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for browsers/contexts where Clipboard API is unavailable
      try {
        const textarea = document.createElement('textarea')
        textarea.value = hash
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {
        toast.error('Failed to copy to clipboard')
      }
    }
  }

  // Compute stats from real data
  const computedStatuses = credentials.map((c) => computeStatus(c))
  const stats = {
    total: credentials.length,
    verified: computedStatuses.filter((s) => s === 'Verified').length,
    pending: computedStatuses.filter((s) => s === 'Pending').length,
    expired: computedStatuses.filter((s) => s === 'Expired').length,
    expiringSoon: computedStatuses.filter((s) => s === 'Expiring Soon').length,
  }

  // Find expiring soon credentials for alert
  const expiringSoonCreds = credentials.filter(
    (c) => computeStatus(c) === 'Expiring Soon'
  )

  // Loading state
  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Credentials</h1>
            <p className="text-muted-foreground text-sm">
              Manage your licenses, certifications, and degrees
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="p-3">
              <div className="text-center">
                <div className="h-8 w-12 bg-muted rounded animate-pulse mx-auto" />
                <div className="h-3 w-10 bg-muted rounded animate-pulse mx-auto mt-2" />
              </div>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-12 flex flex-col items-center justify-center">
            <Loader2 className="size-8 text-emerald-600 animate-spin mb-3" />
            <p className="text-sm text-muted-foreground">Loading credentials...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Credentials</h1>
            <p className="text-muted-foreground text-sm">
              Manage your licenses, certifications, and degrees
            </p>
          </div>
        </div>
        <Card className="border-red-500/30 bg-red-50 dark:bg-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <XCircle className="size-5 text-red-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                  Failed to load credentials
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="ml-auto shrink-0 border-red-300 text-red-700 hover:bg-red-100 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
                onClick={() => fetchCredentials()}
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Credentials</h1>
          <p className="text-muted-foreground text-sm">
            Manage your licenses, certifications, and degrees
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="size-4 mr-2" /> Add Credential
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Credential</DialogTitle>
              <DialogDescription>
                Add your professional credential for verification
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="cred-name">Credential Name</Label>
                <Input
                  id="cred-name"
                  placeholder="e.g., Basic Life Support (BLS)"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cred-type">Type</Label>
                  <Select value={formType} onValueChange={setFormType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CREDENTIAL_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cred-id">Credential ID</Label>
                  <Input
                    id="cred-id"
                    placeholder="e.g., AHA/BLS/2024/NG-001"
                    value={formCredId}
                    onChange={(e) => setFormCredId(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="issuing-body">Issuing Body</Label>
                <Input
                  id="issuing-body"
                  placeholder="e.g., Nursing & Midwifery Council of Nigeria"
                  value={formIssuingBody}
                  onChange={(e) => setFormIssuingBody(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="issue-date">Issue Date</Label>
                  <Input
                    id="issue-date"
                    type="date"
                    value={formIssueDate}
                    onChange={(e) => setFormIssueDate(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expiry-date">Expiry Date</Label>
                  <Input
                    id="expiry-date"
                    type="date"
                    value={formExpiryDate}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setAddDialogOpen(false); resetForm() }}>
                Cancel
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                Submit for Verification
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="p-3">
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </Card>
        <Card className="p-3 border-emerald-500/20">
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{stats.verified}</p>
            <p className="text-xs text-muted-foreground">Verified</p>
          </div>
        </Card>
        <Card className="p-3 border-amber-500/20">
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
        </Card>
        <Card className="p-3 border-orange-500/20">
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{stats.expiringSoon}</p>
            <p className="text-xs text-muted-foreground">Expiring Soon</p>
          </div>
        </Card>
        <Card className="p-3 border-red-500/20">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
            <p className="text-xs text-muted-foreground">Expired</p>
          </div>
        </Card>
      </div>

      {/* Expiry Alert */}
      {expiringSoonCreds.length > 0 && (
        <Card className="border-orange-500/30 bg-orange-50 dark:bg-orange-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="size-5 text-orange-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  Credential Expiring Soon
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  {expiringSoonCreds.map((c) => c.credentialName).join(', ')}{' '}
                  {expiringSoonCreds.length === 1 ? 'expires' : 'expire'} soon. Renew to maintain your credentials.
                </p>
              </div>
              <Button size="sm" variant="outline" className="ml-auto shrink-0 border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-500/30 dark:text-orange-300 dark:hover:bg-orange-500/10">
                Renew
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search credentials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="size-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['All', ...CREDENTIAL_TYPES].map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Credentials Table */}
      <Card>
        <CardContent className="p-0">
          {credentials.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Shield className="size-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="font-medium">No credentials yet</p>
              <p className="text-sm">Add your first credential to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Credential</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden lg:table-cell">Issuing Body</TableHead>
                  <TableHead className="hidden sm:table-cell">Issue Date</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCredentials.map((cred) => {
                  const status = computeStatus(cred)
                  return (
                    <TableRow key={cred.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{cred.credentialName}</p>
                          <p className="text-xs text-muted-foreground">{cred.credentialNumber || '—'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="text-xs">
                          {cred.credentialType}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground max-w-[200px] truncate">
                        {cred.issuingBody}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {formatDate(cred.issueDate)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {cred.expiryDate ? (
                          <span className={status === 'Expired' ? 'text-red-600' : status === 'Expiring Soon' ? 'text-orange-600' : 'text-muted-foreground'}>
                            {formatDate(cred.expiryDate)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">No expiry</span>
                        )}
                      </TableCell>
                      <TableCell>{statusBadge(status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="size-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            {cred.verificationHash && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedCredential(cred)
                                  setViewHashDialogOpen(true)
                                }}
                              >
                                <Link2 className="size-4 mr-2" /> View Verification
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <Download className="size-4 mr-2" /> Download Certificate
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="size-4 mr-2" /> Copy ID
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
          {credentials.length > 0 && filteredCredentials.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <Shield className="size-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="font-medium">No credentials found</p>
              <p className="text-sm">Try adjusting your search or filter</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Blockchain Verification Dialog */}
      <Dialog open={viewHashDialogOpen} onOpenChange={setViewHashDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="size-5 text-emerald-600" />
              Blockchain Verification
            </DialogTitle>
            <DialogDescription>
              This credential has been verified and recorded on the blockchain
            </DialogDescription>
          </DialogHeader>
          {selectedCredential && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Credential</Label>
                <p className="text-sm font-medium">{selectedCredential.credentialName}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Credential ID</Label>
                <p className="text-sm font-mono">{selectedCredential.credentialNumber || '—'}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Verification Hash</Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <code className="text-xs break-all font-mono flex-1">
                    {selectedCredential.verificationHash}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="shrink-0 size-8 p-0"
                    onClick={() => selectedCredential.verificationHash && copyHash(selectedCredential.verificationHash)}
                  >
                    <Copy className="size-3.5" />
                  </Button>
                </div>
                {copied && (
                  <p className="text-xs text-emerald-600">Hash copied to clipboard!</p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="size-4" />
                  Verified on blockchain network
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
