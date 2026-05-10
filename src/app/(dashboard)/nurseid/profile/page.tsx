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
} from 'lucide-react'
import { nurseProfile } from '@/lib/nurseid-data'

export default function NurseProfilePage() {
  const [isEditing, setIsEditing] = React.useState(false)
  const [availableForConsultation, setAvailableForConsultation] = React.useState(
    nurseProfile.availableForConsultation
  )
  const [skills, setSkills] = React.useState(nurseProfile.skills)
  const [languages, setLanguages] = React.useState(nurseProfile.languages)
  const [newSkill, setNewSkill] = React.useState('')
  const [newLanguage, setNewLanguage] = React.useState('')
  const [showPreview, setShowPreview] = React.useState(false)

  // Editable fields
  const [profile, setProfile] = React.useState(nurseProfile)

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
              <AvatarImage src={profile.avatar} alt={profile.fullName} />
              <AvatarFallback className="bg-emerald-500/20 text-emerald-700 text-2xl font-bold">
                {profile.initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 sm:mt-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div>
                  <h1 className="text-2xl font-bold">{profile.fullName}</h1>
                  <p className="text-muted-foreground">{profile.title}</p>
                </div>
                <div className="flex items-center gap-2 sm:ml-auto">
                  <Button
                    variant={isEditing ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className={isEditing ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                  >
                    {isEditing ? (
                      <>
                        <Check className="size-4 mr-1" /> Save
                      </>
                    ) : (
                      <>
                        <Edit3 className="size-4 mr-1" /> Edit
                      </>
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
                              {profile.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-lg">{profile.fullName}</h3>
                            <p className="text-sm text-muted-foreground">{profile.title}</p>
                            <div className="flex items-center gap-1 mt-1">
                              {renderStars(profile.rating)}
                              <span className="text-sm text-muted-foreground ml-1">
                                ({profile.rating})
                              </span>
                            </div>
                          </div>
                        </div>
                        <Separator />
                        <p className="text-sm">{profile.bio}</p>
                        <div className="flex flex-wrap gap-1">
                          {skills.slice(0, 5).map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="size-3" /> {profile.state}, {profile.country}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" size="sm">
                    <Share2 className="size-4 mr-1" /> Share
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Shield className="size-3.5 text-emerald-600" />
                  {profile.licenseNumber}
                </span>
                <span className="flex items-center gap-1">
                  <Stethoscope className="size-3.5" />
                  {profile.specialization}
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="size-3.5" />
                  {profile.facility}
                </span>
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
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  rows={4}
                  className="resize-none"
                />
              ) : (
                <p className="text-sm leading-relaxed">{profile.bio}</p>
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
                      value={profile.fullName}
                      onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium">{profile.fullName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  {isEditing ? (
                    <Input
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Mail className="size-3.5 text-muted-foreground" /> {profile.email}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  {isEditing ? (
                    <Input
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Phone className="size-3.5 text-muted-foreground" /> {profile.phone}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Date of Birth</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={profile.dateOfBirth}
                      onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Calendar className="size-3.5 text-muted-foreground" /> {profile.dateOfBirth}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Address</Label>
                  {isEditing ? (
                    <Input
                      value={profile.address}
                      onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium flex items-center gap-1">
                      <MapPin className="size-3.5 text-muted-foreground" /> {profile.address}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">State / Country</Label>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Input
                        value={profile.state}
                        onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                      />
                      <Input
                        value={profile.country}
                        onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                        className="w-28"
                      />
                    </div>
                  ) : (
                    <p className="text-sm font-medium">
                      {profile.state}, {profile.country}
                    </p>
                  )}
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
                  <p className="text-sm font-medium">{profile.specialization}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Current Facility</Label>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Building2 className="size-3.5 text-muted-foreground" /> {profile.facility}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Ward / Department</Label>
                  <p className="text-sm font-medium">{profile.ward}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Years of Experience</Label>
                  <p className="text-sm font-medium">{profile.yearsExperience} years</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Member Since</Label>
                  <p className="text-sm font-medium">{profile.joinDate}</p>
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
                <span className="font-semibold text-emerald-600">{profile.profileCompletion}%</span>
              </div>
              <Progress value={profile.profileCompletion} className="h-2.5" />
              <p className="text-xs text-muted-foreground">
                Add your MSc degree details to reach 100%
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
                  <p className="text-xs text-muted-foreground">{profile.reviewCount} reviews</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count =
                    star === 5 ? 89 : star === 4 ? 28 : star === 3 ? 7 : star === 2 ? 2 : 1
                  return (
                    <div key={star} className="flex items-center gap-2 text-sm">
                      <span className="w-3 text-muted-foreground">{star}</span>
                      <Star className="size-3 fill-amber-400 text-amber-400" />
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${(count / profile.reviewCount) * 100}%` }}
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
                <span className="font-semibold">9</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Stethoscope className="size-4 text-emerald-600" /> Years Experience
                </span>
                <span className="font-semibold">{profile.yearsExperience}</span>
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
                <span className="font-semibold">6</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
