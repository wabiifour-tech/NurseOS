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
} from 'lucide-react'
import { credentials, credentialTypes } from '@/lib/nurseid-data'

type CredentialType = (typeof credentials)[number]

export default function CredentialsPage() {
  const [typeFilter, setTypeFilter] = React.useState('All')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [addDialogOpen, setAddDialogOpen] = React.useState(false)
  const [viewHashDialogOpen, setViewHashDialogOpen] = React.useState(false)
  const [selectedCredential, setSelectedCredential] = React.useState<CredentialType | null>(null)
  const [copied, setCopied] = React.useState(false)

  const filteredCredentials = credentials.filter((cred) => {
    const matchesType = typeFilter === 'All' || cred.type === typeFilter
    const matchesSearch =
      searchQuery === '' ||
      cred.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cred.issuingBody.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesSearch
  })

  const statusBadge = (status: string) => {
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

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const stats = {
    total: credentials.length,
    verified: credentials.filter((c) => c.status === 'Verified').length,
    pending: credentials.filter((c) => c.status === 'Pending').length,
    expired: credentials.filter((c) => c.status === 'Expired').length,
    expiringSoon: credentials.filter((c) => c.status === 'Expiring Soon').length,
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
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
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
                <Input id="cred-name" placeholder="e.g., Basic Life Support (BLS)" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cred-type">Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {credentialTypes.filter((t) => t !== 'All').map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cred-id">Credential ID</Label>
                  <Input id="cred-id" placeholder="e.g., AHA/BLS/2024/NG-001" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="issuing-body">Issuing Body</Label>
                <Input id="issuing-body" placeholder="e.g., Nursing & Midwifery Council of Nigeria" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="issue-date">Issue Date</Label>
                  <Input id="issue-date" type="date" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expiry-date">Expiry Date</Label>
                  <Input id="expiry-date" type="date" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setAddDialogOpen(false)}>
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
      {stats.expiringSoon > 0 && (
        <Card className="border-orange-500/30 bg-orange-50 dark:bg-orange-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="size-5 text-orange-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  Credential Expiring Soon
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  Pediatric Advanced Life Support (PALS) expires on May 31, 2025. Renew now to maintain your credentials.
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
                {credentialTypes.map((type) => (
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
              {filteredCredentials.map((cred) => (
                <TableRow key={cred.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{cred.name}</p>
                      <p className="text-xs text-muted-foreground">{cred.credentialId}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline" className="text-xs">
                      {cred.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground max-w-[200px] truncate">
                    {cred.issuingBody}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                    {cred.issueDate}
                  </TableCell>
                  <TableCell className="text-sm">
                    {cred.expiryDate ? (
                      <span className={cred.status === 'Expired' ? 'text-red-600' : cred.status === 'Expiring Soon' ? 'text-orange-600' : 'text-muted-foreground'}>
                        {cred.expiryDate}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">No expiry</span>
                    )}
                  </TableCell>
                  <TableCell>{statusBadge(cred.status)}</TableCell>
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
              ))}
            </TableBody>
          </Table>
          {filteredCredentials.length === 0 && (
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
                <p className="text-sm font-medium">{selectedCredential.name}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Credential ID</Label>
                <p className="text-sm font-mono">{selectedCredential.credentialId}</p>
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
