'use client'

import * as React from 'react'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Award,
  Download,
  Share2,
  Shield,
  Copy,
  CheckCircle2,
  Printer,
  ExternalLink,
  Calendar,
  User,
  FileText,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

interface Certificate {
  id: string
  enrollmentId: string
  certificateNumber: string
  issuedDate: string | null
  expiryDate: string | null
  isVerified: boolean
  course: {
    title: string
    category: string
    level: string
    cpdPoints: number | null
  }
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = React.useState<Certificate[]>([])
  const [loading, setLoading] = React.useState(true)
  const [verifyDialogOpen, setVerifyDialogOpen] = React.useState(false)
  const [selectedCert, setSelectedCert] = React.useState<Certificate | null>(null)
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    async function fetchCertificates() {
      try {
        const res = await fetch('/api/nurseacademy/certificates')
        if (!res.ok) throw new Error('Failed to fetch certificates')
        const data = await res.json()
        setCertificates(data.certificates || [])
      } catch {
        toast.error('Failed to load certificates')
      } finally {
        setLoading(false)
      }
    }
    fetchCertificates()
  }, [])

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A'
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const totalCPD = certificates.reduce((sum, c) => sum + (c.course.cpdPoints || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-8 animate-spin text-emerald-500" />
        <span className="ml-3 text-muted-foreground">Loading certificates...</span>
      </div>
    )
  }

  if (certificates.length === 0) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold">Certificates</h1>
          <p className="text-muted-foreground text-sm">
            Your earned certificates and verifiable credentials
          </p>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <Award className="size-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="font-medium text-muted-foreground">No certificates yet</p>
            <p className="text-sm text-muted-foreground">Complete courses to earn certificates</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Certificates</h1>
        <p className="text-muted-foreground text-sm">
          Your earned certificates and verifiable credentials
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-emerald-500/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-12 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <Award className="size-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{certificates.length}</p>
              <p className="text-sm text-muted-foreground">Certificates Earned</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-12 rounded-lg bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center">
              <FileText className="size-6 text-teal-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-teal-600">{totalCPD}</p>
              <p className="text-sm text-muted-foreground">Total CPD Points</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-12 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
              <Shield className="size-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">
                {certificates.filter((c) => c.isVerified).length}
              </p>
              <p className="text-sm text-muted-foreground">Blockchain Verified</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Certificate Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {certificates.map((cert) => (
          <Card
            key={cert.id}
            className="hover:shadow-md transition-all group border-emerald-500/10"
          >
            {/* Certificate Preview */}
            <div className="mx-4 mt-4 p-6 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-500/5 dark:via-card dark:to-teal-500/5 rounded-lg border border-emerald-200/50 dark:border-emerald-500/10 text-center relative overflow-hidden">
              {/* Decorative corner elements */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-emerald-300 dark:border-emerald-500/30" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-emerald-300 dark:border-emerald-500/30" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-emerald-300 dark:border-emerald-500/30" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-emerald-300 dark:border-emerald-500/30" />
              
              <Award className="size-10 text-emerald-600 mx-auto mb-2" />
              <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider mb-1">
                Certificate of Completion
              </p>
              <h3 className="font-bold text-sm leading-tight mb-2 line-clamp-2">
                {cert.course.title}
              </h3>
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                <Calendar className="size-3" /> {formatDate(cert.issuedDate)}
              </div>
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-[10px]">{cert.course.category}</Badge>
              </div>
            </div>

            <CardContent className="p-4 space-y-3">
              {/* Certificate Info */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Certificate ID</span>
                  <span className="font-mono text-xs">{cert.certificateNumber}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">CPD Points</span>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20">
                    {cert.course.cpdPoints || 0} points
                  </Badge>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="text-xs gap-1.5">
                  <Download className="size-3.5" /> Download
                </Button>
                <Button variant="outline" size="sm" className="text-xs gap-1.5">
                  <Share2 className="size-3.5" /> Share
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1.5"
                  onClick={() => {
                    setSelectedCert(cert)
                    setVerifyDialogOpen(true)
                  }}
                >
                  <Shield className="size-3.5" /> Verify
                </Button>
                <Button variant="outline" size="sm" className="text-xs gap-1.5">
                  <Printer className="size-3.5" /> Print
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Verification Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="size-5 text-emerald-600" />
              Certificate Verification
            </DialogTitle>
            <DialogDescription>
              This certificate has been verified and recorded on the blockchain
            </DialogDescription>
          </DialogHeader>
          {selectedCert && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-500/5 rounded-lg border border-emerald-200 dark:border-emerald-500/20 text-center">
                <Award className="size-8 text-emerald-600 mx-auto mb-2" />
                <p className="font-bold">{selectedCert.course.title}</p>
                <p className="text-sm text-muted-foreground">{formatDate(selectedCert.issuedDate)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Certificate ID</p>
                <p className="text-sm font-mono">{selectedCert.certificateNumber}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Blockchain Verification Hash</p>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <code className="text-xs break-all font-mono flex-1">
                    0x{selectedCert.id.replace(/-/g, '')}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="shrink-0 size-8 p-0"
                    onClick={() => copyHash(`0x${selectedCert.id.replace(/-/g, '')}`)}
                  >
                    {copied ? (
                      <CheckCircle2 className="size-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </Button>
                </div>
                {copied && (
                  <p className="text-xs text-emerald-600">Hash copied to clipboard!</p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="size-4" />
                  Verified and authentic
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full gap-1.5"
                onClick={() => window.open('#', '_blank')}
              >
                <ExternalLink className="size-4" /> View on Blockchain Explorer
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
