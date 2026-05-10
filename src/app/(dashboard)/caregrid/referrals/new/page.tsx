"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"
import {
  ArrowRightLeft,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  User,
  Building2,
  FileText,
  Stethoscope,
  Clock,
} from "lucide-react"

const steps = [
  { label: "Patient Info", icon: User },
  { label: "Facilities", icon: Building2 },
  { label: "Clinical Summary", icon: Stethoscope },
  { label: "Review", icon: CheckCircle2 },
]

const samplePatients = [
  { id: "P001", name: "Chinedu Okafor", age: 45, gender: "Male", diagnosis: "Acute MI" },
  { id: "P002", name: "Fatima Abdullahi", age: 28, gender: "Female", diagnosis: "Preeclampsia" },
  { id: "P003", name: "Emeka Nwankwo", age: 32, gender: "Male", diagnosis: "Head Injury" },
  { id: "P004", name: "Amina Bello", age: 5, gender: "Female", diagnosis: "Cerebral Malaria" },
  { id: "P005", name: "Ibrahim Musa", age: 50, gender: "Male", diagnosis: "Suspected Lassa Fever" },
]

export default function NewReferralPage() {
  const [currentStep, setCurrentStep] = React.useState(0)
  const [selectedPatient, setSelectedPatient] = React.useState("")
  const [formData, setFormData] = React.useState({
    patientId: "",
    patientName: "",
    patientAge: "",
    patientGender: "",
    patientDiagnosis: "",
    fromFacility: "",
    toFacility: "",
    urgency: "",
    reason: "",
    clinicalSummary: "",
    vitalSigns: "",
    currentMedications: "",
    allergies: "",
    specialRequirements: "",
  })

  const progressValue = ((currentStep + 1) / steps.length) * 100

  const handlePatientSelect = (patientId: string) => {
    const patient = samplePatients.find(p => p.id === patientId)
    if (patient) {
      setSelectedPatient(patientId)
      setFormData(prev => ({
        ...prev,
        patientId: patient.id,
        patientName: patient.name,
        patientAge: String(patient.age),
        patientGender: patient.gender,
        patientDiagnosis: patient.diagnosis,
      }))
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSubmit = () => {
    toast.success("Referral submitted successfully!")
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ArrowRightLeft className="size-6 text-emerald-600" />
          New Referral
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create a new patient referral in 4 steps
        </p>
      </div>

      {/* Progress Indicator */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              {steps.map((step, i) => {
                const StepIcon = step.icon
                const isActive = i === currentStep
                const isCompleted = i < currentStep
                return (
                  <React.Fragment key={step.label}>
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={`size-10 rounded-full flex items-center justify-center transition-colors ${
                        isCompleted
                          ? "bg-emerald-500 text-white"
                          : isActive
                          ? "bg-emerald-100 text-emerald-600 ring-2 ring-emerald-500"
                          : "bg-slate-100 text-slate-400"
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 className="size-5" />
                        ) : (
                          <StepIcon className="size-5" />
                        )}
                      </div>
                      <span className={`text-[11px] font-medium ${
                        isActive ? "text-emerald-600" : isCompleted ? "text-emerald-500" : "text-muted-foreground"
                      }`}>
                        {step.label}
                      </span>
                    </div>
                    {i < steps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 rounded ${
                        i < currentStep ? "bg-emerald-500" : "bg-slate-200"
                      }`} />
                    )}
                  </React.Fragment>
                )
              })}
            </div>
            <Progress value={progressValue} className="h-1.5" />
            <p className="text-xs text-muted-foreground text-center">
              Step {currentStep + 1} of {steps.length}: {steps[currentStep].label}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {React.createElement(steps[currentStep].icon, { className: "size-5 text-emerald-600" })}
            {steps[currentStep].label}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Select Existing Patient</Label>
                <Select value={selectedPatient} onValueChange={handlePatientSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a patient..." />
                  </SelectTrigger>
                  <SelectContent>
                    {samplePatients.map(patient => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name} — {patient.age}y, {patient.gender}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or enter manually</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patientName">Patient Name</Label>
                  <Input
                    id="patientName"
                    placeholder="Full name"
                    value={formData.patientName}
                    onChange={(e) => setFormData(prev => ({ ...prev, patientName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patientAge">Age</Label>
                  <Input
                    id="patientAge"
                    type="number"
                    placeholder="Age"
                    value={formData.patientAge}
                    onChange={(e) => setFormData(prev => ({ ...prev, patientAge: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select
                    value={formData.patientGender}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, patientGender: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diagnosis">Primary Diagnosis</Label>
                  <Input
                    id="diagnosis"
                    placeholder="Diagnosis"
                    value={formData.patientDiagnosis}
                    onChange={(e) => setFormData(prev => ({ ...prev, patientDiagnosis: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Referring Facility</Label>
                  <Select
                    value={formData.fromFacility}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, fromFacility: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select referring facility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="luth">Lagos University Teaching Hospital</SelectItem>
                      <SelectItem value="fmc-abuja">Federal Medical Centre, Abuja</SelectItem>
                      <SelectItem value="lsgh">Lagos State General Hospital</SelectItem>
                      <SelectItem value="garki-phc">Garki Primary Health Centre</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="rounded-lg bg-slate-50 p-3 border">
                    <p className="text-xs text-muted-foreground">The facility currently managing the patient</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Receiving Facility</Label>
                  <Select
                    value={formData.toFacility}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, toFacility: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select receiving facility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nh-abuja">National Hospital, Abuja</SelectItem>
                      <SelectItem value="uch-ibadan">University College Hospital, Ibadan</SelectItem>
                      <SelectItem value="reddington">Reddington Hospital</SelectItem>
                      <SelectItem value="unth-enugu">University of Nigeria Teaching Hospital</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="rounded-lg bg-slate-50 p-3 border">
                    <p className="text-xs text-muted-foreground">The facility that will receive the patient</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Urgency Level</Label>
                <div className="grid grid-cols-3 gap-3">
                  {(["Routine", "Urgent", "STAT"] as const).map(level => {
                    const colors = {
                      Routine: "border-emerald-300 bg-emerald-50 text-emerald-700",
                      Urgent: "border-orange-300 bg-orange-50 text-orange-700",
                      STAT: "border-red-300 bg-red-50 text-red-700",
                    }
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, urgency: level }))}
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          formData.urgency === level
                            ? colors[level] + " ring-2 ring-offset-1"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <Clock className="size-5 mx-auto mb-1" />
                        <span className="text-sm font-semibold">{level}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clinicalSummary">Clinical Summary</Label>
                <Textarea
                  id="clinicalSummary"
                  placeholder="Provide a detailed clinical summary of the patient's condition..."
                  className="min-h-[100px]"
                  value={formData.clinicalSummary}
                  onChange={(e) => setFormData(prev => ({ ...prev, clinicalSummary: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vitalSigns">Current Vital Signs</Label>
                <Input
                  id="vitalSigns"
                  placeholder="e.g., BP: 160/100, HR: 98, Temp: 38.5°C, RR: 22, SpO2: 94%"
                  value={formData.vitalSigns}
                  onChange={(e) => setFormData(prev => ({ ...prev, vitalSigns: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="medications">Current Medications</Label>
                  <Textarea
                    id="medications"
                    placeholder="List current medications and doses"
                    value={formData.currentMedications}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentMedications: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allergies">Known Allergies</Label>
                  <Textarea
                    id="allergies"
                    placeholder="List any known allergies"
                    value={formData.allergies}
                    onChange={(e) => setFormData(prev => ({ ...prev, allergies: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialRequirements">Special Requirements</Label>
                <Input
                  id="specialRequirements"
                  placeholder="e.g., Oxygen during transport, isolation required, etc."
                  value={formData.specialRequirements}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialRequirements: e.target.value }))}
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
                <h3 className="font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                  <FileText className="size-4" />
                  Referral Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div>
                      <span className="text-muted-foreground">Patient:</span>{" "}
                      <span className="font-medium">{formData.patientName || "Not specified"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Age/Gender:</span>{" "}
                      <span className="font-medium">{formData.patientAge || "—"}y, {formData.patientGender || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Diagnosis:</span>{" "}
                      <span className="font-medium">{formData.patientDiagnosis || "Not specified"}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-muted-foreground">From:</span>{" "}
                      <span className="font-medium">{formData.fromFacility || "Not selected"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">To:</span>{" "}
                      <span className="font-medium">{formData.toFacility || "Not selected"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Urgency:</span>{" "}
                      <Badge className={
                        formData.urgency === "STAT" ? "bg-red-50 text-red-700 border-red-200" :
                        formData.urgency === "Urgent" ? "bg-orange-50 text-orange-700 border-orange-200" :
                        "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }>
                        {formData.urgency || "Not set"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {(formData.clinicalSummary || formData.vitalSigns) && (
                <div className="rounded-lg border p-4 space-y-3">
                  <h4 className="font-semibold text-sm">Clinical Details</h4>
                  {formData.vitalSigns && (
                    <div>
                      <span className="text-xs text-muted-foreground">Vital Signs:</span>
                      <p className="text-sm">{formData.vitalSigns}</p>
                    </div>
                  )}
                  {formData.clinicalSummary && (
                    <div>
                      <span className="text-xs text-muted-foreground">Summary:</span>
                      <p className="text-sm">{formData.clinicalSummary}</p>
                    </div>
                  )}
                  {formData.currentMedications && (
                    <div>
                      <span className="text-xs text-muted-foreground">Medications:</span>
                      <p className="text-sm">{formData.currentMedications}</p>
                    </div>
                  )}
                  {formData.allergies && (
                    <div>
                      <span className="text-xs text-muted-foreground">Allergies:</span>
                      <p className="text-sm">{formData.allergies}</p>
                    </div>
                  )}
                  {formData.specialRequirements && (
                    <div>
                      <span className="text-xs text-muted-foreground">Special Requirements:</span>
                      <p className="text-sm">{formData.specialRequirements}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm">
                <p className="text-amber-800 font-medium">⚠️ Please verify all information before submitting.</p>
                <p className="text-amber-700 text-xs mt-1">
                  Once submitted, the receiving facility will be notified immediately for {formData.urgency === "STAT" ? "emergency" : formData.urgency === "Urgent" ? "urgent" : "routine"} processing.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ArrowLeft className="size-4" />
              Previous
            </Button>
            {currentStep < steps.length - 1 ? (
              <Button
                onClick={handleNext}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                Next
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                <CheckCircle2 className="size-4" />
                Submit Referral
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
