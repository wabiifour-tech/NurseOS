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
  const [recipientName, setRecipientName] = React.useState<string>('')

  React.useEffect(() => {
    async function fetchData() {
      try {
        const [certRes, profileRes] = await Promise.allSettled([
          fetch('/api/nurseacademy/certificates'),
          fetch('/api/nurseid/profile'),
        ])

        if (certRes.status === 'fulfilled' && certRes.value.ok) {
          const data = await certRes.value.json()
          setCertificates(data.certificates || [])
        } else {
          toast.error('Failed to load certificates')
        }

        if (profileRes.status === 'fulfilled' && profileRes.value.ok) {
          const profileData = await profileRes.value.json()
          const user = profileData.profile?.user
          if (user) {
            const name = user.displayName || [user.firstName, user.lastName].filter(Boolean).join(' ')
            setRecipientName(name || '')
          }
        }
      } catch {
        toast.error('Failed to load certificates')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const generateCertificateHTML = (cert: Certificate) => {
    const issuedDate = formatDate(cert.issuedDate)
    const expiryDate = formatDate(cert.expiryDate)
    const displayName = recipientName || 'Certificate Holder'

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Certificate - ${cert.certificateNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f0fdf4;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
    }

    .print-bar {
      position: sticky;
      top: 0;
      z-index: 10;
      background: white;
      border: 1px solid #d1d5db;
      border-radius: 12px;
      padding: 12px 24px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .print-bar p {
      font-size: 14px;
      color: #6b7280;
    }

    .print-btn {
      background: linear-gradient(135deg, #059669, #0d9488);
      color: white;
      border: none;
      padding: 10px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .print-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
    }

    .certificate-wrapper {
      width: 100%;
      max-width: 900px;
    }

    .certificate {
      background: white;
      position: relative;
      padding: 8px;
      border-radius: 4px;
    }

    .certificate-outer-border {
      border: 3px solid #059669;
      border-radius: 2px;
      padding: 6px;
    }

    .certificate-inner-border {
      border: 1.5px solid #0d9488;
      padding: 60px 70px;
      position: relative;
      min-height: 600px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    /* Corner ornaments */
    .corner {
      position: absolute;
      width: 60px;
      height: 60px;
    }
    .corner svg { width: 100%; height: 100%; }
    .corner-tl { top: 10px; left: 10px; }
    .corner-tr { top: 10px; right: 10px; transform: scaleX(-1); }
    .corner-bl { bottom: 10px; left: 10px; transform: scaleY(-1); }
    .corner-br { bottom: 10px; right: 10px; transform: scale(-1, -1); }

    .logo-area {
      margin-bottom: 8px;
    }
    .logo-area img {
      height: 48px;
      width: auto;
    }

    .org-name {
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #0d9488;
      margin-bottom: 24px;
    }

    .cert-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 38px;
      font-weight: 700;
      color: #064e3b;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    .cert-subtitle-line {
      width: 120px;
      height: 2px;
      background: linear-gradient(90deg, transparent, #059669, transparent);
      margin: 0 auto 28px;
    }

    .presented-text {
      font-size: 14px;
      color: #6b7280;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-bottom: 12px;
    }

    .recipient-name {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 32px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 6px;
      padding: 0 20px;
    }

    .recipient-underline {
      width: 320px;
      height: 1px;
      background: linear-gradient(90deg, transparent, #059669, #0d9488, #059669, transparent);
      margin: 0 auto 28px;
    }

    .completion-text {
      font-size: 15px;
      color: #374151;
      margin-bottom: 16px;
      line-height: 1.6;
    }

    .course-name {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 24px;
      font-weight: 600;
      color: #064e3b;
      margin-bottom: 24px;
      padding: 0 40px;
    }

    .details-grid {
      display: flex;
      justify-content: center;
      gap: 40px;
      margin-bottom: 40px;
      flex-wrap: wrap;
    }

    .detail-item {
      text-align: center;
    }
    .detail-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #6b7280;
      margin-bottom: 4px;
    }
    .detail-value {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
    }

    .signatures {
      display: flex;
      justify-content: center;
      gap: 80px;
      margin-top: auto;
      padding-top: 20px;
    }

    .sig-block {
      text-align: center;
      min-width: 160px;
    }
    .sig-line {
      width: 160px;
      height: 1px;
      background: #374151;
      margin: 0 auto 8px;
    }
    .sig-name {
      font-size: 13px;
      font-weight: 600;
      color: #111827;
    }
    .sig-title {
      font-size: 11px;
      color: #6b7280;
    }

    .cert-id-footer {
      margin-top: 30px;
      font-size: 10px;
      color: #9ca3af;
      letter-spacing: 0.5px;
    }

    .verified-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 4px;
      padding: 3px 10px;
      font-size: 10px;
      color: #059669;
      font-weight: 500;
      margin-top: 10px;
    }

    @media print {
      body { background: white; padding: 0; }
      .print-bar { display: none !important; }
      .certificate-wrapper { max-width: none; }
      .certificate-inner-border { min-height: auto; }
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <p>Your certificate is ready</p>
    <button class="print-btn" onclick="window.print()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
      Print / Save as PDF
    </button>
  </div>

  <div class="certificate-wrapper">
    <div class="certificate">
      <div class="certificate-outer-border">
        <div class="certificate-inner-border">
          <!-- Corner ornaments -->
          <div class="corner corner-tl">
            <svg viewBox="0 0 60 60" fill="none">
              <path d="M2 58V18C2 8 8 2 18 2H58" stroke="#059669" stroke-width="2" fill="none"/>
              <circle cx="58" cy="2" r="2" fill="#059669"/>
              <circle cx="2" cy="58" r="2" fill="#059669"/>
              <path d="M12 58V28C12 18 18 12 28 12H58" stroke="#0d9488" stroke-width="1" opacity="0.4" fill="none"/>
            </svg>
          </div>
          <div class="corner corner-tr">
            <svg viewBox="0 0 60 60" fill="none">
              <path d="M2 58V18C2 8 8 2 18 2H58" stroke="#059669" stroke-width="2" fill="none"/>
              <circle cx="58" cy="2" r="2" fill="#059669"/>
              <circle cx="2" cy="58" r="2" fill="#059669"/>
              <path d="M12 58V28C12 18 18 12 28 12H58" stroke="#0d9488" stroke-width="1" opacity="0.4" fill="none"/>
            </svg>
          </div>
          <div class="corner corner-bl">
            <svg viewBox="0 0 60 60" fill="none">
              <path d="M2 58V18C2 8 8 2 18 2H58" stroke="#059669" stroke-width="2" fill="none"/>
              <circle cx="58" cy="2" r="2" fill="#059669"/>
              <circle cx="2" cy="58" r="2" fill="#059669"/>
              <path d="M12 58V28C12 18 18 12 28 12H58" stroke="#0d9488" stroke-width="1" opacity="0.4" fill="none"/>
            </svg>
          </div>
          <div class="corner corner-br">
            <svg viewBox="0 0 60 60" fill="none">
              <path d="M2 58V18C2 8 8 2 18 2H58" stroke="#059669" stroke-width="2" fill="none"/>
              <circle cx="58" cy="2" r="2" fill="#059669"/>
              <circle cx="2" cy="58" r="2" fill="#059669"/>
              <path d="M12 58V28C12 18 18 12 28 12H58" stroke="#0d9488" stroke-width="1" opacity="0.4" fill="none"/>
            </svg>
          </div>

          <!-- Logo -->
          <div class="logo-area">
            <img src="/nurseos-logo.png" alt="NurseOS" onerror="this.style.display='none'" />
          </div>

          <div class="org-name">NurseOS Academy</div>

          <h1 class="cert-title">Certificate of Completion</h1>
          <div class="cert-subtitle-line"></div>

          <p class="presented-text">This is to certify that</p>
          <h2 class="recipient-name">${displayName}</h2>
          <div class="recipient-underline"></div>

          <p class="completion-text">has successfully completed the course</p>
          <h3 class="course-name">${cert.course.title}</h3>

          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-label">Category</div>
              <div class="detail-value">${cert.course.category}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Level</div>
              <div class="detail-value">${cert.course.level}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">CPD Points</div>
              <div class="detail-value">${cert.course.cpdPoints || 0}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Date Issued</div>
              <div class="detail-value">${issuedDate}</div>
            </div>
            ${cert.expiryDate ? '<div class="detail-item"><div class="detail-label">Valid Until</div><div class="detail-value">' + expiryDate + '</div></div>' : ''}
          </div>

          <div class="signatures">
            <div class="sig-block">
              <div class="sig-line"></div>
              <div class="sig-name">NurseOS Academy</div>
              <div class="sig-title">Authorized Signatory</div>
            </div>
          </div>

          <div class="cert-id-footer">
            Certificate ID: ${cert.certificateNumber}
            ${cert.isVerified ? '<span class="verified-badge"><svg width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z\"/></svg> Platform Verified</span>' : ''}
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`
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
              <p className="text-sm text-muted-foreground">Platform Verified</p>
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
                <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => {
                  const html = generateCertificateHTML(cert)
                  const newWindow = window.open('', '_blank')
                  if (newWindow) {
                    newWindow.document.write(html)
                    newWindow.document.close()
                    toast.success('Certificate opened — use Print / Save as PDF')
                  } else {
                    toast.error('Please allow popups to view certificate')
                  }
                }}>
                  <Download className="size-3.5" /> Download
                </Button>
                <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => {
                  const shareText = `I earned a certificate in "${cert.course.title}" on NurseOS! Certificate ID: ${cert.certificateNumber}`
                  if (navigator.share) {
                    navigator.share({ title: 'NurseOS Certificate', text: shareText }).catch(() => {})
                  } else {
                    navigator.clipboard.writeText(shareText).then(() => {
                      toast.success('Certificate link copied to clipboard!')
                    }).catch(() => {
                      toast.error('Failed to share')
                    })
                  }
                }}>
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
                <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => {
                  const html = generateCertificateHTML(cert)
                  const printWindow = window.open('', '_blank')
                  if (printWindow) {
                    printWindow.document.write(html)
                    printWindow.document.close()
                    setTimeout(() => printWindow.print(), 500)
                  } else {
                    toast.error('Please allow popups to print certificates')
                  }
                }}>
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
              This certificate has been verified by NurseOS Academy
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
                <p className="text-xs text-muted-foreground">Verification Code</p>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <code className="text-xs break-all font-mono flex-1">
                    {selectedCert.certificateNumber}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="shrink-0 size-8 p-0"
                    onClick={() => copyHash(selectedCert.certificateNumber)}
                  >
                    {copied ? (
                      <CheckCircle2 className="size-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </Button>
                </div>
                {copied && (
                  <p className="text-xs text-emerald-600">Code copied to clipboard!</p>
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
                onClick={() => toast.info('Blockchain verification is a planned future feature. Currently, certificates are verified through the NurseOS platform. On-chain verification and explorer integration are coming soon!')}
              >
                <ExternalLink className="size-4" /> View on Blockchain Explorer
                <Badge className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20 text-[10px] px-1.5 py-0 ml-1">
                  Coming Soon
                </Badge>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
