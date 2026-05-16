import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, getNurseProfileId, unauthorizedResponse } from '@/lib/auth'
import { createHash } from 'crypto'

// POST /api/nurseacademy/certificates/[id]/verify - Verify a certificate using SHA-256 hash
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Find the enrollment/certificate by ID
    const enrollment = await db.enrollment.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            category: true,
            level: true,
            cpdPoints: true,
          },
        },
        nurse: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                displayName: true,
              },
            },
          },
        },
      },
    })

    if (!enrollment || !enrollment.certificateIssued) {
      return NextResponse.json({
        valid: false,
        status: 'NOT_FOUND',
        message: 'Certificate not found or has not been issued.',
      }, { status: 404 })
    }

    const recipientName = enrollment.nurse?.user
      ? (enrollment.nurse.user.displayName || `${enrollment.nurse.user.firstName} ${enrollment.nurse.user.lastName}`).trim()
      : 'Unknown'

    // Build certificate data string for hashing
    const certificateData = [
      `certificate:${enrollment.certificateNumber || enrollment.id}`,
      `recipient:${recipientName}`,
      `course:${enrollment.course.title}`,
      `issued:${enrollment.completedAt?.toISOString() || enrollment.enrolledAt.toISOString()}`,
      `issuer:NurseOS Academy`,
      `cpd:${enrollment.course.cpdPoints || 0}`,
    ].join('|')

    // Compute SHA-256 hash
    const verificationHash = createHash('sha256')
      .update(certificateData)
      .digest('hex')

    // Also check if the request body contains a verification code to validate
    const body = await request.json().catch(() => ({}))
    const verificationCode = body.verificationCode as string | undefined

    let codeMatch = true
    if (verificationCode) {
      // Compare the provided code against the certificate number or hash prefix
      const expectedCode = enrollment.certificateNumber || enrollment.id
      const hashPrefix = verificationHash.slice(0, 12).toUpperCase()
      codeMatch = verificationCode === expectedCode || verificationCode.toUpperCase() === hashPrefix
    }

    const isValid = enrollment.certificateIssued && codeMatch

    return NextResponse.json({
      valid: isValid,
      status: isValid ? 'VALID' : 'INVALID',
      verification: {
        hash: verificationHash,
        hashPrefix: verificationHash.slice(0, 12).toUpperCase(),
        timestamp: new Date().toISOString(),
        algorithm: 'SHA-256',
      },
      certificate: {
        certificateNumber: enrollment.certificateNumber || `CERT/NOS/${new Date(enrollment.completedAt || enrollment.enrolledAt).getFullYear()}/${enrollment.id.slice(-6).toUpperCase()}`,
        recipient: recipientName,
        course: enrollment.course.title,
        category: enrollment.course.category,
        level: enrollment.course.level,
        cpdPoints: enrollment.course.cpdPoints,
        issuedDate: enrollment.completedAt?.toISOString() || null,
        issuer: 'NurseOS Academy',
      },
      message: isValid
        ? 'Certificate is valid and verified.'
        : codeMatch
        ? 'Certificate verification failed.'
        : 'Verification code does not match.',
    })
  } catch (error) {
    console.error('Error verifying certificate:', error)
    return NextResponse.json({
      valid: false,
      status: 'ERROR',
      message: 'Failed to verify certificate.',
    }, { status: 500 })
  }
}

// GET - Allow unauthenticated verification (for public verification)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    // Find the enrollment/certificate
    const enrollment = await db.enrollment.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            title: true,
            category: true,
            level: true,
            cpdPoints: true,
          },
        },
        nurse: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                displayName: true,
              },
            },
          },
        },
      },
    })

    if (!enrollment || !enrollment.certificateIssued) {
      return NextResponse.json({
        valid: false,
        status: 'NOT_FOUND',
        message: 'Certificate not found.',
      })
    }

    const recipientName = enrollment.nurse?.user
      ? (enrollment.nurse.user.displayName || `${enrollment.nurse.user.firstName} ${enrollment.nurse.user.lastName}`).trim()
      : 'Unknown'

    const certificateData = [
      `certificate:${enrollment.certificateNumber || enrollment.id}`,
      `recipient:${recipientName}`,
      `course:${enrollment.course.title}`,
      `issued:${enrollment.completedAt?.toISOString() || enrollment.enrolledAt.toISOString()}`,
      `issuer:NurseOS Academy`,
      `cpd:${enrollment.course.cpdPoints || 0}`,
    ].join('|')

    const verificationHash = createHash('sha256')
      .update(certificateData)
      .digest('hex')

    let codeMatch = true
    if (code) {
      const expectedCode = enrollment.certificateNumber || enrollment.id
      const hashPrefix = verificationHash.slice(0, 12).toUpperCase()
      codeMatch = code === expectedCode || code.toUpperCase() === hashPrefix
    }

    const isValid = enrollment.certificateIssued && codeMatch

    return NextResponse.json({
      valid: isValid,
      status: isValid ? 'VALID' : (codeMatch ? 'VALID' : 'INVALID'),
      verification: {
        hash: verificationHash,
        hashPrefix: verificationHash.slice(0, 12).toUpperCase(),
        timestamp: new Date().toISOString(),
        algorithm: 'SHA-256',
      },
      certificate: {
        certificateNumber: enrollment.certificateNumber || `CERT/NOS/${new Date(enrollment.completedAt || enrollment.enrolledAt).getFullYear()}/${enrollment.id.slice(-6).toUpperCase()}`,
        recipient: recipientName,
        course: enrollment.course.title,
        category: enrollment.course.category,
        level: enrollment.course.level,
        cpdPoints: enrollment.course.cpdPoints,
        issuedDate: enrollment.completedAt?.toISOString() || null,
        issuer: 'NurseOS Academy',
      },
      message: isValid
        ? 'Certificate is valid and verified.'
        : 'Verification code does not match.',
    })
  } catch (error) {
    console.error('Error verifying certificate:', error)
    return NextResponse.json({
      valid: false,
      status: 'ERROR',
      message: 'Failed to verify certificate.',
    }, { status: 500 })
  }
}
