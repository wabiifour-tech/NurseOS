'use client'

import * as React from 'react'
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
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import {
  Settings,
  User,
  Bell,
  Palette,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Database,
  Trash2,
  Download,
  Check,
  Loader2,
  Mail,
  Phone,
  Camera,
  Save,
  Building2,
  AlertTriangle,
  MapPin,
  Key,
  Copy,
} from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'

interface NotificationPreference {
  id: string
  label: string
  description: string
  enabled: boolean
}

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore()

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = React.useState(false)
  const [isSavingProfile, setIsSavingProfile] = React.useState(false)
  const [profileForm, setProfileForm] = React.useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: (user as Record<string, unknown> & { phone?: string })?.phone || '',
    bio: '',
  })

  // Facility selection state
  const [facilities, setFacilities] = React.useState<Array<{ id: string; name: string; type: string; city: string; state: string }>>([])
  const [isLoadingFacilities, setIsLoadingFacilities] = React.useState(false)
  const [selectedFacilityId, setSelectedFacilityId] = React.useState(user?.facilityId || '')
  const [isSavingFacility, setIsSavingFacility] = React.useState(false)
  const [facilitySearch, setFacilitySearch] = React.useState('')

  // Load profile data from server (including phone/bio from NurseProfile)
  const loadProfileData = React.useCallback(async () => {
    if (!user?.id) return
    try {
      const res = await fetch('/api/auth/profile')
      if (res.ok) {
        const data = await res.json()
        if (data.user) {
          setProfileForm({
            firstName: data.user.firstName || user.firstName || '',
            lastName: data.user.lastName || user.lastName || '',
            email: data.user.email || user.email || '',
            phone: data.user.phone || '',
            bio: data.nurseProfile?.bio || '',
          })
        }
      }
    } catch (error) {
      console.error('Error loading profile data:', error)
    }
  }, [user])

  // Update profile form when user data changes
  React.useEffect(() => {
    if (user) {
      setProfileForm(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: (user as Record<string, unknown> & { phone?: string })?.phone ?? prev.phone,
      }))
      loadProfileData()
    }
  }, [user, loadProfileData])

  // Notification preferences state
  const [notifications, setNotifications] = React.useState<NotificationPreference[]>([
    {
      id: 'patient-alerts',
      label: 'Patient Alerts',
      description: 'Receive notifications for critical patient updates and vitals changes',
      enabled: true,
    },
    {
      id: 'appointment-reminders',
      label: 'Appointment Reminders',
      description: 'Get reminded about upcoming appointments and schedule changes',
      enabled: true,
    },
    {
      id: 'medication-alerts',
      label: 'Medication Alerts',
      description: 'Notifications for medication schedules and dosage reminders',
      enabled: true,
    },
    {
      id: 'referral-updates',
      label: 'Referral Updates',
      description: 'Notifications when referral status changes or new referrals arrive',
      enabled: false,
    },
    {
      id: 'system-updates',
      label: 'System Updates',
      description: 'Updates about NurseOS features, maintenance, and improvements',
      enabled: false,
    },
    {
      id: 'email-digest',
      label: 'Email Digest',
      description: 'Receive a daily summary email of your NurseOS activity',
      enabled: false,
    },
  ])

  // Theme - managed by next-themes
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Prevent hydration mismatch for theme UI
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Appearance state - persisted to localStorage
  const [compactMode, setCompactModeState] = React.useState(false)
  const [sidebarCollapsed, setSidebarCollapsedState] = React.useState(false)

  const setCompactMode = async (val: boolean) => {
    setCompactModeState(val)
    try { localStorage.setItem('nurseos-compact', String(val)) } catch {}
    // Apply compact mode CSS class immediately to document.body
    if (val) {
      document.body.classList.add('compact-mode')
    } else {
      document.body.classList.remove('compact-mode')
    }
    // Save to server via profile endpoint
    try {
      await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compactMode: val }),
      })
    } catch {}
    toast.success(val ? 'Compact mode enabled' : 'Compact mode disabled')
  }

  const setSidebarCollapsed = async (val: boolean) => {
    setSidebarCollapsedState(val)
    try { localStorage.setItem('sidebarCollapsed', String(val)) } catch {}
    // Also set the default-collapsed key for the layout
    try { localStorage.setItem('nurseos-sidebar-default-collapsed', String(val)) } catch {}
    // Dispatch custom event for the dashboard layout to listen for
    window.dispatchEvent(new CustomEvent('sidebar-toggle', { detail: { collapsed: val } }))
    // Save to server
    try {
      await fetch('/api/settings/appearance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sidebarCollapsed: val }),
      })
    } catch {}
    toast.success(val ? 'Sidebar will start collapsed' : 'Sidebar will start expanded')
  }

  // Load persisted preferences on mount (from localStorage first, then server)
  React.useEffect(() => {
    async function loadAppearance() {
      // Load from localStorage first for instant response
      try {
        const savedCompact = localStorage.getItem('nurseos-compact')
        const savedSidebar = localStorage.getItem('sidebarCollapsed')
        if (savedCompact !== null) {
          setCompactModeState(savedCompact === 'true')
          if (savedCompact === 'true') document.body.classList.add('compact-mode')
        }
        if (savedSidebar !== null) setSidebarCollapsedState(savedSidebar === 'true')
      } catch {}
      // Then load from server to sync
      try {
        const res = await fetch('/api/settings/appearance')
        if (res.ok) {
          const data = await res.json()
          if (typeof data.compactMode === 'boolean') {
            setCompactModeState(data.compactMode)
            try { localStorage.setItem('nurseos-compact', String(data.compactMode)) } catch {}
            if (data.compactMode) document.body.classList.add('compact-mode')
            else document.body.classList.remove('compact-mode')
          }
          if (typeof data.sidebarCollapsed === 'boolean') {
            setSidebarCollapsedState(data.sidebarCollapsed)
            try { localStorage.setItem('sidebarCollapsed', String(data.sidebarCollapsed)) } catch {}
          }
        }
      } catch {}
    }
    loadAppearance()
  }, [])

  // Security state
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false)
  const [showNewPassword, setShowNewPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [passwordForm, setPasswordForm] = React.useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [isChangingPassword, setIsChangingPassword] = React.useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(false)
  const [twoFactorSetupData, setTwoFactorSetupData] = React.useState<{ secret: string; otpauthUrl: string; manualEntryKey: string } | null>(null)
  const [twoFACode, setTwoFACode] = React.useState('')
  const [isSettingUp2FA, setIsSettingUp2FA] = React.useState(false)
  const [isVerifying2FA, setIsVerifying2FA] = React.useState(false)
  const [isDisabling2FA, setIsDisabling2FA] = React.useState(false)
  const [disable2FAPassword, setDisable2FAPassword] = React.useState('')
  const [show2FASetup, setShow2FASetup] = React.useState(false)
  const [show2FADisable, setShow2FADisable] = React.useState(false)

  // Load 2FA status from server on mount
  React.useEffect(() => {
    async function load2FAStatus() {
      try {
        const res = await fetch('/api/auth/profile')
        if (res.ok) {
          const data = await res.json()
          if (data.user?.twoFactorEnabled) setTwoFactorEnabled(true)
        }
      } catch {}
    }
    load2FAStatus()
  }, [])

  const handleEnable2FA = async () => {
    setIsSettingUp2FA(true)
    try {
      const res = await fetch('/api/auth/2fa/setup', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to set up 2FA')
        setIsSettingUp2FA(false)
        return
      }
      setTwoFactorSetupData(data)
      setShow2FASetup(true)
    } catch (error) {
      console.error('2FA setup error:', error)
      toast.error('Failed to set up 2FA')
    } finally {
      setIsSettingUp2FA(false)
    }
  }

  const handleVerify2FA = async () => {
    if (!twoFACode || twoFACode.length !== 6) {
      toast.error('Please enter a valid 6-digit code')
      return
    }
    setIsVerifying2FA(true)
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: twoFACode }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Invalid code')
        setIsVerifying2FA(false)
        return
      }
      setTwoFactorEnabled(true)
      setShow2FASetup(false)
      setTwoFACode('')
      toast.success('Two-Factor Authentication enabled successfully!')
    } catch (error) {
      console.error('2FA verify error:', error)
      toast.error('Failed to verify 2FA code')
    } finally {
      setIsVerifying2FA(false)
    }
  }

  const handleDisable2FA = async () => {
    if (!disable2FAPassword) {
      toast.error('Please enter your password to disable 2FA')
      return
    }
    setIsDisabling2FA(true)
    try {
      const res = await fetch('/api/auth/2fa/setup', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: disable2FAPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to disable 2FA')
        setIsDisabling2FA(false)
        return
      }
      setTwoFactorEnabled(false)
      setShow2FADisable(false)
      setDisable2FAPassword('')
      toast.success('Two-Factor Authentication disabled')
    } catch (error) {
      console.error('2FA disable error:', error)
      toast.error('Failed to disable 2FA')
    } finally {
      setIsDisabling2FA(false)
    }
  }

  // Data & Privacy state
  const [dataRetention, setDataRetention] = React.useState('1-year')
  const [analyticsSharing, setAnalyticsSharing] = React.useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)

  const toggleNotification = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, enabled: !n.enabled } : n))
      // Persist notification preferences to localStorage AND server
      try {
        const prefs = updated.reduce((acc, n) => { acc[n.id] = n.enabled; return acc }, {} as Record<string, boolean>)
        localStorage.setItem('nurseos-notification-prefs', JSON.stringify(prefs))
      } catch {}
      // Save to server (fire and forget)
      fetch('/api/settings/notification-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: updated.reduce((acc, n) => { acc[n.id] = n.enabled; return acc }, {} as Record<string, boolean>),
        }),
      }).catch(() => {})
      return updated
    })
  }

  // Load persisted notification preferences on mount (from server first, fall back to localStorage)
  React.useEffect(() => {
    async function loadNotifPrefs() {
      try {
        const res = await fetch('/api/settings/notification-preferences')
        if (res.ok) {
          const data = await res.json()
          if (data.preferences && Object.keys(data.preferences).length > 0) {
            const prefs = data.preferences as Record<string, boolean>
            setNotifications((prev) => prev.map((n) => prefs[n.id] !== undefined ? { ...n, enabled: prefs[n.id] } : n))
            // Sync to localStorage
            try { localStorage.setItem('nurseos-notification-prefs', JSON.stringify(prefs)) } catch {}
            return
          }
        }
      } catch {}
      // Fallback to localStorage if server fails
      try {
        const saved = localStorage.getItem('nurseos-notification-prefs')
        if (saved) {
          const prefs = JSON.parse(saved) as Record<string, boolean>
          setNotifications((prev) => prev.map((n) => prefs[n.id] !== undefined ? { ...n, enabled: prefs[n.id] } : n))
        }
      } catch {}
    }
    loadNotifPrefs()
  }, [])

  const handleSaveProfile = async () => {
    setIsSavingProfile(true)
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
          phone: profileForm.phone,
          bio: profileForm.bio,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        toast.error(result.error || 'Failed to update profile')
        setIsSavingProfile(false)
        return
      }

      // Update local Zustand state with the new data
      updateUser({
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        email: profileForm.email,
      })
      setIsEditingProfile(false)
      setIsSavingProfile(false)
      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error('Failed to update profile. Please try again.')
      setIsSavingProfile(false)
    }
  }

  // Load facilities for the dropdown
  const loadFacilities = async () => {
    setIsLoadingFacilities(true)
    try {
      const res = await fetch('/api/caregrid/facilities?limit=200')
      const data = await res.json()
      if (res.ok) {
        setFacilities(data.facilities || [])
      }
    } catch (error) {
      console.error('Error loading facilities:', error)
      toast.error('Failed to load facilities')
    } finally {
      setIsLoadingFacilities(false)
    }
  }

  // Load facilities on mount
  React.useEffect(() => {
    loadFacilities()
  }, [])

  // Save facility selection
  const handleSaveFacility = async () => {
    setIsSavingFacility(true)
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          facilityId: selectedFacilityId || null,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        toast.error(result.error || 'Failed to update facility')
        setIsSavingFacility(false)
        return
      }

      // Update local Zustand state with the new facility
      updateUser({
        facilityId: selectedFacilityId || null,
        facilityName: result.facilityName || null,
      })
      setIsSavingFacility(false)
      toast.success(selectedFacilityId ? 'Facility updated successfully' : 'Facility assignment removed')
    } catch (error) {
      console.error('Facility update error:', error)
      toast.error('Failed to update facility. Please try again.')
      setIsSavingFacility(false)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword) {
      toast.error('Please enter your current password')
      return
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    setIsChangingPassword(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        toast.error(result.error || 'Failed to change password')
        setIsChangingPassword(false)
        return
      }

      setIsChangingPassword(false)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      toast.success('Password changed successfully')
    } catch (error) {
      console.error('Password change error:', error)
      toast.error('Failed to change password. Please try again.')
      setIsChangingPassword(false)
    }
  }

  const [isExporting, setIsExporting] = React.useState(false)

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      const res = await fetch('/api/settings/export')
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to export data')
        setIsExporting(false)
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `nurseos-export-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('Data exported successfully')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export data. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const [deletePassword, setDeletePassword] = React.useState('')
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error('Please enter your password to confirm account deletion')
      return
    }
    setIsDeleting(true)
    try {
      const res = await fetch('/api/settings/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to delete account')
        setIsDeleting(false)
        return
      }
      // Clear local auth state
      const { logout } = useAuthStore.getState()
      logout()
      toast.success('Account deleted successfully')
      // Redirect to landing page
      window.location.href = '/'
    } catch (error) {
      console.error('Delete account error:', error)
      toast.error('Failed to delete account. Please try again.')
      setIsDeleting(false)
    }
  }

  const firstName = user?.firstName || 'Nurse'
  const lastName = user?.lastName || ''
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <Settings className="size-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
        </div>
      </div>

      <Separator />

      {/* Profile Settings */}
      <Card className="border-emerald-500/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="size-5 text-emerald-600" />
              <CardTitle>Profile Settings</CardTitle>
            </div>
            {!isEditingProfile ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingProfile(true)}
                className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
              >
                Edit Profile
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditingProfile(false)
                    if (user) {
                      setProfileForm({
                        firstName: user.firstName || '',
                        lastName: user.lastName || '',
                        email: user.email || '',
                        phone: profileForm.phone,
                        bio: profileForm.bio,
                      })
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isSavingProfile ? (
                    <><Loader2 className="size-4 mr-1 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="size-4 mr-1" /> Save Changes</>
                  )}
                </Button>
              </div>
            )}
          </div>
          <CardDescription>Update your personal information and profile details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <Avatar className="size-20 border-2 border-emerald-500/30">
                {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={`${firstName} ${lastName}`} />}
                <AvatarFallback className="bg-emerald-500/20 text-emerald-700 text-xl font-bold">
                  {initials || 'NU'}
                </AvatarFallback>
              </Avatar>
              {isEditingProfile && (
                <Button variant="outline" size="sm" className="text-xs" onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = 'image/*'
                  input.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (!file) return
                    if (file.size > 5 * 1024 * 1024) {
                      toast.error('Image must be less than 5MB')
                      return
                    }
                    const formData = new FormData()
                    formData.append('avatar', file)
                    formData.append('userId', user?.id || '')
                    try {
                      const res = await fetch('/api/auth/avatar', { method: 'POST', body: formData })
                      if (res.ok) {
                        toast.success('Photo uploaded successfully! It may take a moment to update.')
                        setTimeout(() => window.location.reload(), 1000)
                      } else {
                        const data = await res.json()
                        toast.error(data.error || 'Failed to upload photo')
                      }
                    } catch {
                      toast.error('Failed to upload photo. Please try again.')
                    }
                  }
                  input.click()
                }}>
                  <Camera className="size-3.5 mr-1" /> Change Photo
                </Button>
              )}
            </div>

            {/* Profile Fields */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-xs text-muted-foreground">First Name</Label>
                {isEditingProfile ? (
                  <Input
                    id="firstName"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    className="h-9"
                  />
                ) : (
                  <p className="text-sm font-medium">{firstName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-xs text-muted-foreground">Last Name</Label>
                {isEditingProfile ? (
                  <Input
                    id="lastName"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    className="h-9"
                  />
                ) : (
                  <p className="text-sm font-medium">{lastName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs text-muted-foreground">
                  <Mail className="size-3 inline mr-1" />Email
                </Label>
                {isEditingProfile ? (
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="h-9"
                  />
                ) : (
                  <p className="text-sm font-medium">{user?.email || 'Not provided'}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-xs text-muted-foreground">Role</Label>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20"
                  >
                    {user?.role || 'Nurse'}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs text-muted-foreground">
                  <Phone className="size-3 inline mr-1" />Phone
                </Label>
                {isEditingProfile ? (
                  <Input
                    id="phone"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="+234 803 456 7890"
                    className="h-9"
                  />
                ) : (
                  <p className="text-sm font-medium">{profileForm.phone || 'Not provided'}</p>
                )}
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="bio" className="text-xs text-muted-foreground">Bio</Label>
                {isEditingProfile ? (
                  <Textarea
                    id="bio"
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    className="resize-none"
                  />
                ) : (
                  <p className="text-sm">{profileForm.bio || 'No bio added yet.'}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Facility Assignment */}
      <Card className={`border-2 ${!user?.facilityId ? 'border-amber-500/30' : 'border-emerald-500/10'}`}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-emerald-600" />
            <CardTitle>Facility Assignment</CardTitle>
            {!user?.facilityId && (
              <Badge variant="outline" className="gap-1 text-[10px] border-amber-500/30 bg-amber-500/10 text-amber-600">
                <AlertTriangle className="size-3" />
                Required
              </Badge>
            )}
          </div>
          <CardDescription>
            {!user?.facilityId
              ? 'You must select a facility to access patient data, records, and clinical tools. Your data will be isolated to this facility.'
              : 'Your data is isolated to this facility. You can only see patients and records from your assigned facility.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current Facility */}
            {user?.facilityId && user?.facilityName && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                <Building2 className="size-5 text-emerald-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 truncate">{user.facilityName}</p>
                  <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Currently assigned facility</p>
                </div>
                <Check className="size-4 text-emerald-600 shrink-0" />
              </div>
            )}

            {/* No Facility Warning */}
            {!user?.facilityId && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                <AlertTriangle className="size-5 text-amber-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300">No facility assigned</p>
                  <p className="text-xs text-amber-600/70 dark:text-amber-400/70">You cannot access patient data until you select a facility.</p>
                </div>
              </div>
            )}

            {/* Facility Selector */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Select Your Facility</Label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search facilities by name, city, or state..."
                  value={facilitySearch}
                  onChange={(e) => setFacilitySearch(e.target.value)}
                  className="h-9 pr-8"
                />
                {facilitySearch && (
                  <button
                    type="button"
                    onClick={() => setFacilitySearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Facility List */}
              <div className="max-h-[240px] overflow-y-auto space-y-1 border rounded-lg p-1">
                {isLoadingFacilities ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading facilities...</span>
                  </div>
                ) : (
                  <>
                    {/* Clear selection option */}
                    {user?.facilityId && (
                      <button
                        type="button"
                        onClick={() => setSelectedFacilityId('')}
                        className={`w-full text-left p-2.5 rounded-md transition-colors text-sm flex items-center gap-2 ${
                          selectedFacilityId === '' ? 'bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20' : 'hover:bg-muted'
                        }`}
                      >
                        <AlertTriangle className="size-4 text-amber-500 shrink-0" />
                        <div>
                          <p className="font-medium text-amber-600">Remove facility assignment</p>
                          <p className="text-xs text-muted-foreground">You will lose access to patient data</p>
                        </div>
                      </button>
                    )}
                    {facilities
                      .filter((f) => {
                        if (!facilitySearch) return true
                        const q = facilitySearch.toLowerCase()
                        return f.name.toLowerCase().includes(q) || f.city.toLowerCase().includes(q) || f.state.toLowerCase().includes(q)
                      })
                      .map((facility) => (
                        <button
                          key={facility.id}
                          type="button"
                          onClick={() => setSelectedFacilityId(facility.id)}
                          className={`w-full text-left p-2.5 rounded-md transition-colors text-sm flex items-center gap-2 ${
                            selectedFacilityId === facility.id
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20'
                              : 'hover:bg-muted'
                          }`}
                        >
                          <Building2 className={`size-4 shrink-0 ${selectedFacilityId === facility.id ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium truncate ${selectedFacilityId === facility.id ? 'text-emerald-700 dark:text-emerald-300' : ''}`}>
                              {facility.name}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="size-3" />
                              {facility.city}, {facility.state}
                              {facility.type && <span className="ml-1">• {facility.type.replace(/_/g, ' ')}</span>}
                            </p>
                          </div>
                          {selectedFacilityId === facility.id && <Check className="size-4 text-emerald-600 shrink-0" />}
                        </button>
                      ))}
                    {facilities.length === 0 && !isLoadingFacilities && (
                      <div className="text-center py-6 text-sm text-muted-foreground">
                        No facilities found. Please contact your administrator.
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Save Facility Button */}
            {selectedFacilityId !== (user?.facilityId || '') && (
              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={handleSaveFacility}
                  disabled={isSavingFacility}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isSavingFacility ? (
                    <><Loader2 className="size-4 mr-1 animate-spin" /> Saving...</>
                  ) : (
                    <><Building2 className="size-4 mr-1" /> Update Facility</>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  {selectedFacilityId ? 'You will only see data from this facility.' : 'Removing facility will restrict your access to clinical data.'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="size-5 text-emerald-600" />
            <CardTitle>Notification Preferences</CardTitle>
          </div>
          <CardDescription>Choose which notifications you want to receive</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <div className="flex items-center justify-between py-3">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-sm font-medium">{notification.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{notification.description}</p>
                  </div>
                  <Switch
                    checked={notification.enabled}
                    onCheckedChange={() => toggleNotification(notification.id)}
                  />
                </div>
                {index < notifications.length - 1 && <Separator />}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="size-5 text-emerald-600" />
            <CardTitle>Appearance</CardTitle>
          </div>
          <CardDescription>Customize how NurseOS looks and feels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Theme Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Theme</Label>
              <div className="grid grid-cols-3 gap-3">
                {(['light', 'dark', 'system'] as const).map((themeOption) => (
                  <button
                    key={themeOption}
                    onClick={() => setTheme(themeOption)}
                    disabled={!mounted}
                    className={`relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all hover:border-emerald-500/50 ${
                      mounted && theme === themeOption
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                        : 'border-border'
                    } ${!mounted ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className={`size-8 rounded-md ${
                      themeOption === 'light'
                        ? 'bg-white border border-gray-200'
                        : themeOption === 'dark'
                        ? 'bg-slate-900 border border-slate-700'
                        : 'bg-gradient-to-br from-white to-slate-900 border border-gray-200'
                    }`} />
                    <span className="text-xs font-medium capitalize">{themeOption}</span>
                    {mounted && theme === themeOption && (
                      <div className="absolute top-2 right-2">
                        <Check className="size-3.5 text-emerald-600" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                NurseOS uses your system theme by default. Select a theme to override.
              </p>
            </div>

            <Separator />

            {/* Compact Mode */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Compact Mode</p>
                <p className="text-xs text-muted-foreground">Reduce spacing and padding for denser information display</p>
              </div>
              <Switch checked={compactMode} onCheckedChange={setCompactMode} />
            </div>

            <Separator />

            {/* Sidebar Default */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Collapsed Sidebar</p>
                <p className="text-xs text-muted-foreground">Start with the sidebar collapsed by default</p>
              </div>
              <Switch checked={sidebarCollapsed} onCheckedChange={setSidebarCollapsed} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="size-5 text-emerald-600" />
            <CardTitle>Security</CardTitle>
          </div>
          <CardDescription>Manage your password and security settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Two-Factor Authentication */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <Lock className="size-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Two-Factor Authentication</p>
                    <p className="text-xs text-muted-foreground">Add an extra layer of security to your account</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {twoFactorEnabled ? (
                    <Badge variant="outline" className="text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
                      Enabled
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] border-slate-300 bg-slate-50 text-slate-500">
                      Disabled
                    </Badge>
                  )}
                </div>
              </div>

              {/* 2FA Actions */}
              {!twoFactorEnabled && !show2FASetup && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEnable2FA}
                  disabled={isSettingUp2FA}
                  className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                >
                  {isSettingUp2FA ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Key className="size-4 mr-1" />}
                  Set Up 2FA
                </Button>
              )}

              {/* 2FA Setup Flow */}
              {show2FASetup && twoFactorSetupData && (
                <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Step 1: Scan QR Code or Enter Key</p>
                    <p className="text-xs text-muted-foreground">
                      Scan the QR code below with your authenticator app (Google Authenticator, Authy, etc.) or manually enter the secret key.
                    </p>
                    {/* QR Code as a data URI */}
                    <div className="flex flex-col items-center gap-3 py-3">
                      <div className="p-3 bg-white rounded-lg border">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(twoFactorSetupData.otpauthUrl)}`}
                          alt="2FA QR Code"
                          width={200}
                          height={200}
                          className="rounded"
                        />
                      </div>
                      <div className="w-full space-y-2">
                        <p className="text-xs text-muted-foreground font-medium">Manual Entry Key:</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-xs bg-muted p-2 rounded font-mono break-all select-all">
                            {twoFactorSetupData.manualEntryKey}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0"
                            onClick={() => {
                              navigator.clipboard.writeText(twoFactorSetupData.manualEntryKey)
                              toast.success('Secret key copied to clipboard')
                            }}
                          >
                            <Copy className="size-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Step 2: Verify with Code</p>
                    <p className="text-xs text-muted-foreground">Enter the 6-digit code from your authenticator app to enable 2FA.</p>
                    <div className="flex items-center gap-2">
                      <Input
                        value={twoFACode}
                        onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="h-9 font-mono text-center text-lg tracking-widest w-40"
                        maxLength={6}
                      />
                      <Button
                        size="sm"
                        onClick={handleVerify2FA}
                        disabled={isVerifying2FA || twoFACode.length !== 6}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        {isVerifying2FA ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Check className="size-4 mr-1" />}
                        Verify
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setShow2FASetup(false); setTwoFACode('') }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Disable 2FA */}
              {twoFactorEnabled && !show2FADisable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShow2FADisable(true)}
                  className="border-red-500/30 text-red-600 hover:bg-red-500/10"
                >
                  <Lock className="size-4 mr-1" /> Disable 2FA
                </Button>
              )}

              {twoFactorEnabled && show2FADisable && (
                <div className="space-y-3 p-4 rounded-lg border border-red-200 bg-red-50/50 dark:border-red-500/20 dark:bg-red-500/5">
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">Disable Two-Factor Authentication</p>
                  <p className="text-xs text-muted-foreground">Enter your password to confirm. Your account will be less secure without 2FA.</p>
                  <div className="flex items-center gap-2">
                    <Input
                      type="password"
                      value={disable2FAPassword}
                      onChange={(e) => setDisable2FAPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="h-9 flex-1"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDisable2FA}
                      disabled={isDisabling2FA || !disable2FAPassword}
                    >
                      {isDisabling2FA ? <Loader2 className="size-4 mr-1 animate-spin" /> : null}
                      Disable
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setShow2FADisable(false); setDisable2FAPassword('') }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Change Password */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Lock className="size-4 text-emerald-600" />
                <h3 className="text-sm font-semibold">Change Password</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-xs text-muted-foreground">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                      className="h-9 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-xs text-muted-foreground">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="Enter new password"
                      className="h-9 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-xs text-muted-foreground">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                      className="h-9 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {passwordForm.newPassword && (
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 w-8 rounded-full transition-colors ${
                          passwordForm.newPassword.length >= level * 2
                            ? level <= 1
                              ? 'bg-red-400'
                              : level <= 2
                              ? 'bg-amber-400'
                              : level <= 3
                              ? 'bg-emerald-400'
                              : 'bg-emerald-500'
                            : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                )}
                {passwordForm.newPassword && (
                  <span className="text-xs text-muted-foreground">
                    {passwordForm.newPassword.length < 4
                      ? 'Weak'
                      : passwordForm.newPassword.length < 8
                      ? 'Fair'
                      : passwordForm.newPassword.length < 12
                      ? 'Strong'
                      : 'Very Strong'}
                  </span>
                )}
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isChangingPassword ? (
                  <><Loader2 className="size-4 mr-1 animate-spin" /> Changing Password...</>
                ) : (
                  <><Lock className="size-4 mr-1" /> Update Password</>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="size-5 text-emerald-600" />
            <CardTitle>Data & Privacy</CardTitle>
          </div>
          <CardDescription>Control your data and privacy preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Data Retention */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Data Retention Period</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { value: '6-months', label: '6 Months' },
                  { value: '1-year', label: '1 Year' },
                  { value: '2-years', label: '2 Years' },
                  { value: 'indefinite', label: 'Indefinite' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setDataRetention(option.value)}
                    className={`rounded-lg border-2 px-3 py-2 text-xs font-medium transition-all ${
                      dataRetention === option.value
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                        : 'border-border hover:border-emerald-500/50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                How long NurseOS retains your activity and usage data.
              </p>
            </div>

            <Separator />

            {/* Analytics Sharing */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Usage Analytics</p>
                <p className="text-xs text-muted-foreground">Help improve NurseOS by sharing anonymous usage data</p>
              </div>
              <Switch checked={analyticsSharing} onCheckedChange={setAnalyticsSharing} />
            </div>

            <Separator />

            {/* Export Data */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">Export Your Data</p>
                </div>
                <p className="text-xs text-muted-foreground">Download a copy of all your data from NurseOS</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
                disabled={isExporting}
              >
                {isExporting ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Download className="size-4 mr-1" />} Export Data
              </Button>
            </div>

            <Separator />

            {/* Delete Account */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-destructive">Delete Account</p>
                </div>
                <p className="text-xs text-muted-foreground">Permanently delete your account and all associated data. This action cannot be undone.</p>
              </div>
              {showDeleteConfirm ? (
                <div className="flex flex-col items-end gap-3">
                  <p className="text-xs text-destructive font-medium">This will permanently erase all your data. Enter your password to confirm.</p>
                  <div className="flex items-center gap-2 w-full">
                    <Input
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Enter your password"
                      className="h-9 flex-1"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteAccount}
                      disabled={isDeleting || !deletePassword}
                    >
                      {isDeleting ? <Loader2 className="size-4 mr-1 animate-spin" /> : <AlertTriangle className="size-4 mr-1" />}
                      Confirm Delete
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setShowDeleteConfirm(false); setDeletePassword('') }}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-destructive/30 text-destructive hover:bg-destructive/10"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="size-4 mr-1" /> Delete Account
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer spacer */}
      <div className="h-4" />
    </div>
  )
}
