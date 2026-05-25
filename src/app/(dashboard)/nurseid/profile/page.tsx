'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Star,
  Edit3,
  Share2,
  Eye,
  MapPin,
  Phone,
  Mail,
  Building2,
  Calendar,
  Shield,
  Plus,
  X,
  Check,
  Globe,
  Stethoscope,
  Award,
  Loader2,
  ArrowLeft,
  MessageCircle,
} from 'lucide-react'
import { toast } from 'sonner'

interface NurseProfileData {
  id: string
  licenseNumber: string
  specialization: string | null
  yearsOfExperience: number | null
  blsCertified: boolean
  aclsCertified: boolean
  degree: string | null
  university: string | null
  bio: string | null
  skills: string
  languages: string
  availableForConsult: boolean
  rating: number
  totalRatings: number
  nursingCouncil: string
  licenseExpiryDate: string
  createdAt: string
  user: {
    id: string
    email?: string
    firstName: string
    lastName: string
    middleName: string | null
    displayName: string | null
    avatarUrl: string | null
    phone?: string | null
    countryCode: string
    status?: string
    createdAt: string
    memberSince?: string
  }
  facility: {
    id: string
    name: string
    type: string
    city: string
    state: string
  } | null
  credentials: { id: string; credentialName: string; credentialType: string; isVerified?: boolean }[]
  competencies: { id: string; competencyArea: string; level: string }[]
  portfolioEntries: { id: string; title: string; entryType: string; description?: string }[]
  cpdRecords?: { id: string; title: string; cpdPoints: number }[]
}

export default function NurseProfilePage() {
  const { user, token } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [profile, setProfile] = React.useState<NurseProfileData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [isEditing, setIsEditing] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [showPreview, setShowPreview] = React.useState(false)
  const [isPublicView, setIsPublicView] = React.useState(false)

  // Editable fields
  const [editData, setEditData] = React.useState({
    firstName: '',
    lastName: '',
    phone: '',
    bio: '',
    specialization: '',
    yearsOfExperience: 0,
    degree: '',
    university: '',
  })
  const [availableForConsultation, setAvailableForConsultation] = React.useState(false)
  const [skills, setSkills] = React.useState<string[]>([])
  const [languages, setLanguages] = React.useState<string[]>([])
  const [newSkill, setNewSkill] = React.useState('')
  const [newLanguage, setNewLanguage] = React.useState('')

  // H16: Read nurseId query parameter for public profile view
  const nurseIdParam = searchParams.get('nurseId')

  // Fetch profile
  React.useEffect(() => {
    async function fetchProfile() {
      try {
        const headers: Record<string, string> = {}
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }

        // H16: If nurseId is present AND different from current user, fetch public profile
        if (nurseIdParam) {
          const currentNurseProfileId = user?.nurseProfileId
          if (currentNurseProfileId && nurseIdParam !== currentNurseProfileId) {
            // Public profile view
            setIsPublicView(true)
            const res = await fetch(`/api/nurseid/profile/${nurseIdParam}`, { headers })
            if (res.ok) {
              const data = await res.json()
              setProfile(data.profile as NurseProfileData)
              try { setSkills(JSON.parse(data.profile.skills || '[]')) } catch { setSkills([]) }
              try { setLanguages(JSON.parse(data.profile.languages || '["English"]')) } catch { setLanguages(['English']) }
            } else {
              toast.error('Failed to load this nurse\'s profile.')
            }
            setLoading(false)
            return
          }
        }

        // Own profile (default behavior)
        setIsPublicView(false)
        const res = await fetch('/api/nurseid/profile', { headers })
        if (res.ok) {
          const data = await res.json()
          const p = data.profile as NurseProfileData
          setProfile(p)
          setAvailableForConsultation(p.availableForConsult)
          try { setSkills(JSON.parse(p.skills)) } catch { setSkills([]) }
          try { setLanguages(JSON.parse(p.languages)) } catch { setLanguages(['English']) }
          setEditData({
            firstName: p.user.firstName,
            lastName: p.user.lastName,
            phone: p.user.phone || '',
            bio: p.bio || '',
            specialization: p.specialization || '',
            yearsOfExperience: p.yearsOfExperience || 0,
            degree: p.degree || '',
            university: p.university || '',
          })
        } else {
          toast.error('Failed to load profile. Please ensure you are logged in.')
        }
      } catch {
        toast.error('Network error. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [token, nurseIdParam, user?.nurseProfileId])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      const res = await fetch('/api/nurseid/profile', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          firstName: editData.firstName,
          lastName: editData.lastName,
          phone: editData.phone,
          bio: editData.bio,
          specialization: editData.specialization,
          yearsOfExperience: editData.yearsOfExperience,
          degree: editData.degree,
          university: editData.university,
          skills,
          languages,
          availableForConsult: availableForConsultation,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setProfile(data.profile as NurseProfileData)
        setIsEditing(false)
        toast.success('Profile updated successfully')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update profile')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill('')
    }
  }

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill))
  }

  const addLanguage = () => {
    if (newLanguage.trim() && !languages.includes(newLanguage.trim())) {
      setLanguages([...languages, newLanguage.trim()])
      setNewLanguage('')
    }
  }

  const removeLanguage = (lang: string) => {
    setLanguages(languages.filter((l) => l !== lang))
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`size-4 ${
          i < Math.floor(rating)
            ? 'fill-amber-400 text-amber-400'
            : i < rating
            ? 'fill-amber-400/50 text-amber-400'
            : 'text-muted-foreground/30'
        }`}
      />
    ))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-emerald-500" />
        <span className="ml-3 text-muted-foreground">Loading profile...</span>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="size-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Profile Not Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {isPublicView
                ? "We couldn't find this nurse's profile."
                : "We couldn't load your nurse profile. Please ensure you are logged in with a nurse account."
              }
            </p>
            <Button variant="outline" onClick={() => router.push(isPublicView ? '/caregrid/directory' : '/login')}>
              {isPublicView ? 'Back to Directory' : 'Go to Login'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const fullName = `${profile.user.firstName} ${profile.user.lastName}`
  const initials = `${profile.user.firstName?.[0] || ''}${profile.user.lastName?.[0] || ''}`

  // Public view rendering
  if (isPublicView) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
        {/* Back button */}
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => router.back()}>
          <ArrowLeft className="size-4" /> Back
        </Button>

        {/* Public Profile Header */}
        <Card className="border-emerald-500/20 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')] opacity-50" />
          </div>
          <CardContent className="relative pb-6">
            <div className="flex flex-col sm:flex-row gap-4 -mt-12">
              <Avatar className="size-24 border-4 border-background shadow-lg">
                <AvatarImage src={profile.user.avatarUrl || ''} alt={fullName} />
                <AvatarFallback className="bg-emerald-500/20 text-emerald-700 text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 sm:mt-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-bold">{fullName}</h1>
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] gap-1">
                        <Eye className="size-3" />
                        Public Profile
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{profile.specialization || 'Registered Nurse'}</p>
                  </div>
                  <div className="flex items-center gap-2 sm:ml-auto">
                    {profile.availableForConsult && (
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                        onClick={() => {
                          router.push(`/caregrid/consultations?requestNurseId=${profile.id}`)
                        }}
                      >
                        <MessageCircle className="size-4 mr-1" /> Request Consultation
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Shield className="size-3.5 text-emerald-600" />
                    {profile.licenseNumber}
                  </span>
                  {profile.specialization && (
                    <span className="flex items-center gap-1">
                      <Stethoscope className="size-3.5" />
                      {profile.specialization}
                    </span>
                  )}
                  {profile.facility && (
                    <span className="flex items-center gap-1">
                      <Building2 className="size-3.5" />
                      {profile.facility.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Professional Bio</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{profile.bio || 'No bio available.'}</p>
              </CardContent>
            </Card>

            {/* Professional Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Professional Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">License Number</Label>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Shield className="size-3.5 text-emerald-600" /> {profile.licenseNumber}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Specialization</Label>
                    <p className="text-sm font-medium">{profile.specialization || 'Not specified'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Current Facility</Label>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Building2 className="size-3.5 text-muted-foreground" /> {profile.facility?.name || 'Not assigned'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Years of Experience</Label>
                    <p className="text-sm font-medium">{profile.yearsOfExperience ?? 0} years</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Degree</Label>
                    <p className="text-sm font-medium">{profile.degree || 'Not specified'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">University</Label>
                    <p className="text-sm font-medium">{profile.university || 'Not specified'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Skills */}
            {skills.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="py-1.5 px-3 bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Languages */}
            {languages.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Languages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {languages.map((lang) => (
                      <Badge key={lang} variant="outline" className="py-1.5 px-3 flex items-center gap-1">
                        <Globe className="size-3 text-emerald-600" />
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Public Portfolio Entries */}
            {profile.portfolioEntries && profile.portfolioEntries.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Portfolio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profile.portfolioEntries.map((entry) => (
                    <div key={entry.id} className="border rounded-lg p-3">
                      <h4 className="text-sm font-semibold">{entry.title}</h4>
                      <Badge variant="outline" className="text-[10px] mt-1">{entry.entryType}</Badge>
                      {entry.description && <p className="text-xs text-muted-foreground mt-1">{entry.description}</p>}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Rating Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Rating</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-emerald-600">{profile.rating}</span>
                  <div>
                    <div className="flex">{renderStars(profile.rating)}</div>
                    <p className="text-xs text-muted-foreground">{profile.totalRatings} reviews</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Credentials */}
            {profile.credentials && profile.credentials.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Credentials</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {profile.credentials.map((cred) => (
                    <div key={cred.id} className="flex items-center gap-2 text-sm">
                      <Award className="size-4 text-emerald-600 shrink-0" />
                      <span className="font-medium">{cred.credentialName}</span>
                      {cred.isVerified && (
                        <Badge className="text-[8px] bg-emerald-50 text-emerald-700">Verified</Badge>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Award className="size-4 text-emerald-600" /> Credentials
                  </span>
                  <span className="font-semibold">{profile.credentials?.length || 0}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Stethoscope className="size-4 text-emerald-600" /> Years Experience
                  </span>
                  <span className="font-semibold">{profile.yearsOfExperience ?? 0}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="size-4 text-emerald-600" /> Languages
                  </span>
                  <span className="font-semibold">{languages.length}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="size-4 text-emerald-600" /> Portfolio Items
                  </span>
                  <span className="font-semibold">{profile.portfolioEntries?.length || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Own profile (existing behavior)
  const profileCompletion = Math.min(100, [
    profile.bio,
    profile.specialization,
    profile.yearsOfExperience,
    profile.user?.phone,
    skills.length > 0,
    languages.length > 0,
    profile.degree,
    profile.university,
    profile.facility,
  ].filter(Boolean).length * 12)

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Profile Header Card */}
      <Card className="border-emerald-500/20 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')] opacity-50" />
        </div>
        <CardContent className="relative pb-6">
          <div className="flex flex-col sm:flex-row gap-4 -mt-12">
            <Avatar className="size-24 border-4 border-background shadow-lg">
              <AvatarImage src={profile.user.avatarUrl || ''} alt={fullName} />
              <AvatarFallback className="bg-emerald-500/20 text-emerald-700 text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 sm:mt-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div>
                  <h1 className="text-2xl font-bold">{fullName}</h1>
                  <p className="text-muted-foreground">Registered Nurse</p>
                </div>
                <div className="flex items-center gap-2 sm:ml-auto">
                  <Button
                    variant={isEditing ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      if (isEditing) {
                        handleSave()
                      } else {
                        setIsEditing(true)
                      }
                    }}
                    disabled={isSaving}
                    className={isEditing ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                  >
                    {isSaving ? (
                      <><Loader2 className="size-4 mr-1 animate-spin" /> Saving...</>
                    ) : isEditing ? (
                      <><Check className="size-4 mr-1" /> Save</>
                    ) : (
                      <><Edit3 className="size-4 mr-1" /> Edit</>
                    )}
                  </Button>
                  <Dialog open={showPreview} onOpenChange={setShowPreview}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="size-4 mr-1" /> Preview
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Public Profile Preview</DialogTitle>
                        <DialogDescription>
                          This is how your profile appears to other nurses and facilities
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="size-16 border-2 border-emerald-500/30">
                            <AvatarFallback className="bg-emerald-500/20 text-emerald-700 text-lg font-bold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-lg">{fullName}</h3>
                            <p className="text-sm text-muted-foreground">{profile.specialization || 'Registered Nurse'}</p>
                            <div className="flex items-center gap-1 mt-1">
                              {renderStars(profile.rating)}
                              <span className="text-sm text-muted-foreground ml-1">
                                ({profile.rating})
                              </span>
                            </div>
                          </div>
                        </div>
                        <Separator />
                        <p className="text-sm">{profile.bio || 'No bio added yet.'}</p>
                        <div className="flex flex-wrap gap-1">
                          {skills.slice(0, 5).map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        {profile.facility && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="size-3" /> {profile.facility.city}, {profile.facility.state}
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" size="sm" onClick={async () => {
                    const profileUrl = `${window.location.origin}/nurseid/profile`
                    if (navigator.share) {
                      try {
                        await navigator.share({ title: `${fullName} - NurseOS Profile`, url: profileUrl })
                      } catch {
                        // User cancelled share — do nothing
                      }
                    } else {
                      try {
                        await navigator.clipboard.writeText(profileUrl)
                        toast.success('Profile link copied to clipboard!')
                      } catch {
                        toast.error('Failed to copy link')
                      }
                    }
                  }}>
                    <Share2 className="size-4 mr-1" /> Share
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Shield className="size-3.5 text-emerald-600" />
                  {profile.licenseNumber}
                </span>
                {profile.specialization && (
                  <span className="flex items-center gap-1">
                    <Stethoscope className="size-3.5" />
                    {profile.specialization}
                  </span>
                )}
                {profile.facility && (
                  <span className="flex items-center gap-1">
                    <Building2 className="size-3.5" />
                    {profile.facility.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bio Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Professional Bio</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={editData.bio}
                  onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                  rows={4}
                  className="resize-none"
                  placeholder="Tell others about your nursing experience and expertise..."
                />
              ) : (
                <p className="text-sm leading-relaxed">{profile.bio || 'No bio added yet. Click Edit to add your professional bio.'}</p>
              )}
            </CardContent>
          </Card>

          {/* Personal Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Full Name</Label>
                  {isEditing ? (
                    <Input
                      value={editData.firstName + ' ' + editData.lastName}
                      onChange={(e) => {
                        const parts = e.target.value.split(' ')
                        setEditData({ ...editData, firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '' })
                      }}
                    />
                  ) : (
                    <p className="text-sm font-medium">{fullName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Mail className="size-3.5 text-muted-foreground" /> {profile.user?.email ?? '—'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  {isEditing ? (
                    <Input
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      placeholder="+234 803 456 7890"
                    />
                  ) : (
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Phone className="size-3.5 text-muted-foreground" /> {profile.user?.phone || 'Not provided'}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Member Since</Label>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Calendar className="size-3.5 text-muted-foreground" /> {new Date(profile.user?.createdAt ?? profile.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Professional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">License Number</Label>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Shield className="size-3.5 text-emerald-600" /> {profile.licenseNumber}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Specialization</Label>
                  {isEditing ? (
                    <Input
                      value={editData.specialization}
                      onChange={(e) => setEditData({ ...editData, specialization: e.target.value })}
                      placeholder="e.g. Emergency & Critical Care"
                    />
                  ) : (
                    <p className="text-sm font-medium">{profile.specialization || 'Not specified'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Current Facility</Label>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Building2 className="size-3.5 text-muted-foreground" /> {profile.facility?.name || 'Not assigned'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Years of Experience</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editData.yearsOfExperience}
                      onChange={(e) => setEditData({ ...editData, yearsOfExperience: parseInt(e.target.value) || 0 })}
                    />
                  ) : (
                    <p className="text-sm font-medium">{profile.yearsOfExperience ?? 0} years</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Degree</Label>
                  {isEditing ? (
                    <Input
                      value={editData.degree}
                      onChange={(e) => setEditData({ ...editData, degree: e.target.value })}
                      placeholder="e.g. BNSc, MSc Nursing"
                    />
                  ) : (
                    <p className="text-sm font-medium">{profile.degree || 'Not specified'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">University</Label>
                  {isEditing ? (
                    <Input
                      value={editData.university}
                      onChange={(e) => setEditData({ ...editData, university: e.target.value })}
                      placeholder="e.g. University of Lagos"
                    />
                  ) : (
                    <p className="text-sm font-medium">{profile.university || 'Not specified'}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Skills</CardTitle>
              <CardDescription>Your clinical and professional skills</CardDescription>
            </CardHeader>
            <CardContent>
              {skills.length === 0 && !isEditing ? (
                <p className="text-sm text-muted-foreground">No skills added yet. Click Edit to add your skills.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="py-1.5 px-3 gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20"
                    >
                      {skill}
                      {isEditing && (
                        <button onClick={() => removeSkill(skill)} className="ml-1 hover:text-red-500">
                          <X className="size-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                  {isEditing && (
                    <div className="flex items-center gap-1">
                      <Input
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                        placeholder="Add skill..."
                        className="h-8 w-32 text-sm"
                      />
                      <Button size="sm" variant="ghost" onClick={addSkill} className="size-8 p-0">
                        <Plus className="size-4 text-emerald-600" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Languages */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Languages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {languages.map((lang) => (
                  <Badge
                    key={lang}
                    variant="outline"
                    className="py-1.5 px-3 gap-1 flex items-center"
                  >
                    <Globe className="size-3 mr-1 text-emerald-600" />
                    {lang}
                    {isEditing && (
                      <button onClick={() => removeLanguage(lang)} className="ml-1 hover:text-red-500">
                        <X className="size-3" />
                      </button>
                    )}
                  </Badge>
                ))}
                {isEditing && (
                  <div className="flex items-center gap-1">
                    <Input
                      value={newLanguage}
                      onChange={(e) => setNewLanguage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addLanguage()}
                      placeholder="Add language..."
                      className="h-8 w-32 text-sm"
                    />
                    <Button size="sm" variant="ghost" onClick={addLanguage} className="size-8 p-0">
                      <Plus className="size-4 text-emerald-600" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Profile Completion */}
          <Card className="border-emerald-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Profile Completion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold text-emerald-600">{profileCompletion}%</span>
              </div>
              <Progress value={profileCompletion} className="h-2.5" />
              <p className="text-xs text-muted-foreground">
                {profileCompletion < 100 ? 'Complete your profile to increase visibility' : 'Your profile is complete!'}
              </p>
            </CardContent>
          </Card>

          {/* Rating Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Rating</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-emerald-600">{profile.rating}</span>
                <div>
                  <div className="flex">{renderStars(profile.rating)}</div>
                  <p className="text-xs text-muted-foreground">{profile.totalRatings} reviews</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = profile.totalRatings > 0
                    ? Math.round(profile.totalRatings * (star === 5 ? 0.7 : star === 4 ? 0.2 : star === 3 ? 0.07 : star === 2 ? 0.02 : 0.01))
                    : 0
                  return (
                    <div key={star} className="flex items-center gap-2 text-sm">
                      <span className="w-3 text-muted-foreground">{star}</span>
                      <Star className="size-3 fill-amber-400 text-amber-400" />
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${profile.totalRatings > 0 ? (count / profile.totalRatings) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8">{count}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Consultation Toggle */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Consultation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Available for Consultation</p>
                  <p className="text-xs text-muted-foreground">
                    Allow facilities to request your expertise
                  </p>
                </div>
                <Switch
                  checked={availableForConsultation}
                  onCheckedChange={setAvailableForConsultation}
                />
              </div>
              {availableForConsultation && (
                <div className="mt-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                  <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                    <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    Currently visible in nurse directory
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Award className="size-4 text-emerald-600" /> Credentials
                </span>
                <span className="font-semibold">{profile.credentials?.length || 0}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Stethoscope className="size-4 text-emerald-600" /> Years Experience
                </span>
                <span className="font-semibold">{profile.yearsOfExperience ?? 0}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="size-4 text-emerald-600" /> Languages
                </span>
                <span className="font-semibold">{languages.length}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="size-4 text-emerald-600" /> Portfolio Items
                </span>
                <span className="font-semibold">{profile.portfolioEntries?.length || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
