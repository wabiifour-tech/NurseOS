import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

/**
 * POST /api/verification/verify-registration
 * 
 * Verifies a facility registration number or professional license number
 * against known Nigerian healthcare registries and validation rules.
 * 
 * This is the SUPER_ADMIN's tool to verify that registration numbers
 * are legitimate before approving facility applications.
 * 
 * Verification layers:
 * 1. Format validation — Does the number match known CAC/FMH/NMCN formats?
 * 2. Database duplicate check — Is this number already used by another facility?
 * 3. Suspicious pattern detection — Does the facility name look fake?
 * 4. Contextual analysis — Does the registration type match the facility type?
 */
export async function POST(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  if (authUser.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Only Super Admins can verify registration numbers' }, { status: 403 })
  }

  try {
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { registrationNumber, facilityName, state, type } = body as {
      registrationNumber: string
      facilityName?: string
      state?: string
      type?: string
    }

    if (!registrationNumber) {
      return NextResponse.json({ error: 'Registration number is required' }, { status: 400 })
    }

    const regNum = String(registrationNumber).trim().toUpperCase()
    const result = verifyRegistrationNumber(regNum, facilityName, state, type)

    // Also check if this number is already used in our database
    const existingFacility = await db.facility.findUnique({
      where: { registrationNumber: regNum },
      select: {
        id: true,
        name: true,
        isVerified: true,
        accreditationStatus: true,
        city: true,
        state: true,
      },
    })

    if (existingFacility) {
      result.warnings.push(`This registration number is already registered to "${existingFacility.name}" in ${existingFacility.city}, ${existingFacility.state}. Status: ${existingFacility.isVerified ? 'VERIFIED' : existingFacility.accreditationStatus}`)
      result.databaseMatch = {
        id: existingFacility.id,
        name: existingFacility.name,
        isVerified: existingFacility.isVerified,
        status: existingFacility.accreditationStatus,
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json({ error: 'Failed to verify registration number' }, { status: 500 })
  }
}

/**
 * Core verification logic for Nigerian facility and professional registration numbers.
 * 
 * Nigerian Registration Number Formats:
 * ─────────────────────────────────────
 * CAC (Corporate Affairs Commission):
 *   - BN: Business Name — e.g., BN/1234567, BN-1234567
 *   - RC: Registered Company — e.g., RC/1234567, RC-1234567  
 *   - IT: Incorporated Trustees — e.g., IT/1234567
 *
 * FMH (Federal Ministry of Health):
 *   - FMH/2024/0891 — Year-based facility license
 *   - FMC+code — Federal Medical Centre
 *
 * SMH (State Ministry of Health):
 *   - SMH/LAG/2024/0891 — State + year + code
 *   - PHCB/xxx — Primary Health Care Board
 *
 * NMCN (Nursing & Midwifery Council of Nigeria):
 *   - RN/12345 — Registered Nurse
 *   - RM/12345 — Registered Midwife  
 *   - RPN/12345 — Registered Psychiatric Nurse
 *   - RN/RM/12345 — Dual qualification
 *
 * MDCN (Medical & Dental Council of Nigeria):
 *   - MDCN/12345 — Medical license
 *
 * PCN (Pharmacists Council of Nigeria):
 *   - PCN/12345 — Pharmacy license
 */
function verifyRegistrationNumber(
  regNum: string,
  facilityName?: string,
  state?: string,
  type?: string
): {
  isValid: boolean
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'INVALID'
  format: string
  description: string
  recommendations: string[]
  warnings: string[]
  databaseMatch: unknown | null
} {
  const warnings: string[] = []
  const recommendations: string[] = []
  let isValid = false
  let confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'INVALID' = 'INVALID'
  let format = 'UNKNOWN'
  let description = ''

  // ── CAC Registration Numbers ──
  const cacBusinessName = /^BN[\/\-]\d{4,10}$/i
  const cacRegisteredCompany = /^RC[\/\-]\d{4,10}$/i
  const cacIncorporatedTrustees = /^IT[\/\-]\d{4,10}$/i

  if (cacBusinessName.test(regNum)) {
    format = 'CAC_BUSINESS_NAME'
    description = 'Corporate Affairs Commission — Business Name Registration'
    isValid = true
    confidence = 'HIGH'
    recommendations.push('Verify at search.cac.gov.ng — CAC public search portal')
    recommendations.push('Business Name registrations are individual/sole proprietor — less rigorous than RC')
    if (type === 'HOSPITAL' || type === 'SPECIALIST_CENTER') {
      warnings.push('Hospitals and specialist centers typically require RC (company) registration, not BN (business name)')
      confidence = 'MEDIUM'
    }
  } else if (cacRegisteredCompany.test(regNum)) {
    format = 'CAC_REGISTERED_COMPANY'
    description = 'Corporate Affairs Commission — Limited Liability Company Registration'
    isValid = true
    confidence = 'HIGH'
    recommendations.push('Verify at search.cac.gov.ng — CAC public search portal')
    recommendations.push('RC registration is the gold standard — indicates a properly incorporated entity')
  } else if (cacIncorporatedTrustees.test(regNum)) {
    format = 'CAC_INCORPORATED_TRUSTEES'
    description = 'Corporate Affairs Commission — Incorporated Trustees (NGOs, religious orgs, hospitals)'
    isValid = true
    confidence = 'HIGH'
    recommendations.push('Verify at search.cac.gov.ng — CAC public search portal')
    recommendations.push('Common for faith-based hospitals and NGO-run health facilities')
  }

  // ── Federal Ministry of Health ──
  const fmhLicense = /^FMH[\/\-]\d{4}[\/\-]\d{1,6}$/i
  const fmcCode = /^FMC[\/\-]?\d{1,6}$/i

  if (fmhLicense.test(regNum)) {
    format = 'FMH_FACILITY_LICENSE'
    description = 'Federal Ministry of Health — Health Facility License'
    isValid = true
    confidence = 'HIGH'
    recommendations.push('Cross-reference with FMH facility registry at health.gov.ng')
    recommendations.push('FMH-licensed facilities are typically tertiary/secondary healthcare institutions')
  } else if (fmcCode.test(regNum)) {
    format = 'FMC_FEDERAL_MEDICAL_CENTRE'
    description = 'Federal Medical Centre — Government Healthcare Facility'
    isValid = true
    confidence = 'HIGH'
    recommendations.push('FMCs are federal government institutions — verify at health.gov.ng')
  }

  // ── State Ministry of Health ──
  const smhLicense = /^SMH[\/\-][A-Z]{2,4}[\/\-]\d{4}[\/\-]\d{1,6}$/i
  const phcbLicense = /^PHCB[\/\-]?\d{1,6}$/i

  if (smhLicense.test(regNum)) {
    format = 'SMH_STATE_LICENSE'
    description = 'State Ministry of Health — State Health Facility License'
    isValid = true
    confidence = 'MEDIUM'
    recommendations.push('Contact the relevant State Ministry of Health for verification')
    recommendations.push('Each state has its own registry — check the state website or visit the ministry office')
  } else if (phcbLicense.test(regNum)) {
    format = 'PHCB_PRIMARY_HEALTHCARE'
    description = 'Primary Health Care Board — Primary Healthcare Facility License'
    isValid = true
    confidence = 'MEDIUM'
    recommendations.push('Contact the local government PHCB office for verification')
  }

  // ── NMCN (Nursing & Midwifery Council of Nigeria) ──
  const nmcnRN = /^RN[\/\-]\d{4,8}$/i
  const nmcnRM = /^RM[\/\-]\d{4,8}$/i
  const nmcnRPN = /^RPN[\/\-]\d{4,8}$/i
  const nmcnDual = /^RN[\/\-]RM[\/\-]\d{4,8}$/i

  if (nmcnDual.test(regNum)) {
    format = 'NMCN_DUAL_RN_RM'
    description = 'Nursing & Midwifery Council of Nigeria — Dual RN/RM License'
    isValid = true
    confidence = 'HIGH'
    recommendations.push('Verify at nmcn.gov.ng — NMCN verification portal')
  } else if (nmcnRPN.test(regNum)) {
    format = 'NMCN_PSYCHIATRIC_NURSE'
    description = 'Nursing & Midwifery Council of Nigeria — Registered Psychiatric Nurse'
    isValid = true
    confidence = 'HIGH'
    recommendations.push('Verify at nmcn.gov.ng — NMCN verification portal')
  } else if (nmcnRN.test(regNum)) {
    format = 'NMCN_REGISTERED_NURSE'
    description = 'Nursing & Midwifery Council of Nigeria — Registered Nurse License'
    isValid = true
    confidence = 'HIGH'
    recommendations.push('Verify at nmcn.gov.ng — NMCN verification portal')
  } else if (nmcnRM.test(regNum)) {
    format = 'NMCN_REGISTERED_MIDWIFE'
    description = 'Nursing & Midwifery Council of Nigeria — Registered Midwife License'
    isValid = true
    confidence = 'HIGH'
    recommendations.push('Verify at nmcn.gov.ng — NMCN verification portal')
  }

  // ── MDCN (Medical & Dental Council of Nigeria) ──
  const mdcnLicense = /^MDCN[\/\-]\d{4,8}$/i
  if (mdcnLicense.test(regNum)) {
    format = 'MDCN_MEDICAL_LICENSE'
    description = 'Medical & Dental Council of Nigeria — Medical Practitioner License'
    isValid = true
    confidence = 'HIGH'
    recommendations.push('Verify at mdcn.gov.ng — MDCN verification portal')
  }

  // ── PCN (Pharmacists Council of Nigeria) ──
  const pcnLicense = /^PCN[\/\-]\d{4,8}$/i
  if (pcnLicense.test(regNum)) {
    format = 'PCN_PHARMACY_LICENSE'
    description = 'Pharmacists Council of Nigeria — Pharmacy License'
    isValid = true
    confidence = 'HIGH'
    recommendations.push('Verify at pcn.gov.ng — PCN verification portal')
  }

  // ── Generic government ID patterns ──
  const genericGovtId = /^[A-Z]{2,6}[\/\-]\d{3,10}([\/\-]\d{2,6})?$/i
  if (!isValid && genericGovtId.test(regNum)) {
    format = 'GENERIC_GOVERNMENT_ID'
    description = 'Generic government registration format — could not identify specific registry'
    isValid = true
    confidence = 'LOW'
    recommendations.push('This format looks like a government ID but could not be matched to a known registry')
    recommendations.push('Ask the applicant to provide the issuing body name')
    recommendations.push('Request supporting documents (certificate of registration, license letter)')
    warnings.push('Cannot automatically verify — manual verification required')
  }

  // ── Completely unrecognized format ──
  if (!isValid) {
    format = 'UNRECOGNIZED'
    description = 'Registration number does not match any known Nigerian healthcare or business registry format'
    isValid = false
    confidence = 'INVALID'
    warnings.push('This number does not match CAC, FMH, SMH, NMCN, MDCN, or PCN formats')
    recommendations.push('Ask the applicant for clarification on the issuing body')
    recommendations.push('Request a photo/scan of the registration certificate')
    recommendations.push('Common valid formats: BN/1234567, RC/1234567, FMH/2024/0891, RN/12345')
  }

  // ── Additional context-based checks ──
  if (facilityName && isValid) {
    const suspiciousPatterns = ['test', 'fake', 'demo', 'sample', 'xxx', 'aaa', '123']
    const lowerName = facilityName.toLowerCase()
    for (const pattern of suspiciousPatterns) {
      if (lowerName.includes(pattern)) {
        warnings.push(`Facility name contains suspicious pattern: "${pattern}"`)
        confidence = 'LOW'
      }
    }
  }

  return {
    isValid,
    confidence,
    format,
    description,
    recommendations,
    warnings,
    databaseMatch: null,
  }
}
