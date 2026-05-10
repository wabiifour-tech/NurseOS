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
} from 'lucide-react'
import { toast } from 'sonner'

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
    phone: '',
    bio: '',
  })

  // Update profile form when user data changes
  React.useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: '',
        bio: '',
      })
    }
  }, [user])

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

  // Appearance state
  const [theme, setTheme] = React.useState<'light' | 'dark' | 'system'>('system')
  const [compactMode, setCompactMode] = React.useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)

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

  // Data & Privacy state
  const [dataRetention, setDataRetention] = React.useState('1-year')
  const [analyticsSharing, setAnalyticsSharing] = React.useState(true)
  const [isExportingData, setIsExportingData] = React.useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)

  const toggleNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, enabled: !n.enabled } : n))
    )
  }

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

  const handleExportData = async () => {
    setIsExportingData(true)
    // Data export is a coming-soon feature
    await new Promise((resolve) => setTimeout(resolve, 500))
    setIsExportingData(false)
    toast.info('Data export is coming soon. This feature will allow you to download all your data from NurseOS.')
  }

  const handleDeleteAccount = () => {
    toast.error('Account deletion is not available in the demo. Please contact support.')
    setShowDeleteConfirm(false)
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
                        phone: '',
                        bio: '',
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
                <Button variant="outline" size="sm" className="text-xs">
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
                    className={`relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all hover:border-emerald-500/50 ${
                      theme === themeOption
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                        : 'border-border'
                    }`}
                  >
                    <div className={`size-8 rounded-md ${
                      themeOption === 'light'
                        ? 'bg-white border border-gray-200'
                        : themeOption === 'dark'
                        ? 'bg-slate-900 border border-slate-700'
                        : 'bg-gradient-to-br from-white to-slate-900 border border-gray-200'
                    }`} />
                    <span className="text-xs font-medium capitalize">{themeOption}</span>
                    {theme === themeOption && (
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
                {twoFactorEnabled && (
                  <Badge
                    variant="secondary"
                    className="bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20 text-xs"
                  >
                    Enabled
                  </Badge>
                )}
                <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
              </div>
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
                <p className="text-sm font-medium">Export Your Data</p>
                <p className="text-xs text-muted-foreground">Download a copy of all your data from NurseOS</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
                disabled={isExportingData}
                className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
              >
                {isExportingData ? (
                  <><Loader2 className="size-4 mr-1 animate-spin" /> Exporting...</>
                ) : (
                  <><Download className="size-4 mr-1" /> Export</>
                )}
              </Button>
            </div>

            <Separator />

            {/* Delete Account */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-destructive">Delete Account</p>
                <p className="text-xs text-muted-foreground">Permanently delete your account and all associated data</p>
              </div>
              {showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteAccount}
                  >
                    <Trash2 className="size-4 mr-1" /> Confirm Delete
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="border-red-500/30 text-red-600 hover:bg-red-500/10 hover:text-red-700"
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
