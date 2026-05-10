import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper to verify session from Authorization header
async function getAuthenticatedUser(request: NextRequest): Promise<{ id: string; role: string } | null> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  const session = await db.session.findUnique({
    where: { token },
    include: { user: { select: { id: true, role: true, status: true } } },
  })

  if (!session || session.expiresAt < new Date() || session.user.status !== 'ACTIVE') {
    return null
  }

  return { id: session.user.id, role: session.user.role }
}

// GET /api/nurseid/profile - Get current nurse's profile
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request)
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      )
    }

    // Find the nurse profile
    const nurseProfile = await db.nurseProfile.findUnique({
      where: { userId: authUser.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            middleName: true,
            displayName: true,
            avatarUrl: true,
            phone: true,
            countryCode: true,
            status: true,
            emailVerified: true,
            phoneVerified: true,
            twoFactorEnabled: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
        facility: {
          select: {
            id: true,
            name: true,
            type: true,
            city: true,
            state: true,
          },
        },
        credentials: {
          orderBy: { createdAt: 'desc' },
        },
        competencies: {
          orderBy: { createdAt: 'desc' },
        },
        portfolioEntries: {
          orderBy: { order: 'asc' },
        },
        cpdRecords: {
          orderBy: { dateCompleted: 'desc' },
        },
      },
    })

    if (!nurseProfile) {
      return NextResponse.json(
        { error: 'Nurse profile not found. Please ensure you have a nurse account.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      profile: nurseProfile,
    })
  } catch (error) {
    console.error('Error fetching nurse profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch nurse profile' },
      { status: 500 }
    )
  }
}

// PATCH /api/nurseid/profile - Update nurse profile
export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request)
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Find the nurse profile
    const existingProfile = await db.nurseProfile.findUnique({
      where: { userId: authUser.id },
    })

    if (!existingProfile) {
      return NextResponse.json(
        { error: 'Nurse profile not found' },
        { status: 404 }
      )
    }

    // Build update data for nurse profile
    const nurseUpdateData: Record<string, unknown> = {}

    if (body.specialization !== undefined) nurseUpdateData.specialization = body.specialization
    if (body.yearsOfExperience !== undefined) nurseUpdateData.yearsOfExperience = body.yearsOfExperience
    if (body.currentFacilityId !== undefined) nurseUpdateData.currentFacilityId = body.currentFacilityId
    if (body.blsCertified !== undefined) nurseUpdateData.blsCertified = body.blsCertified
    if (body.blsCertExpiry !== undefined) nurseUpdateData.blsCertExpiry = body.blsCertExpiry ? new Date(body.blsCertExpiry) : null
    if (body.aclsCertified !== undefined) nurseUpdateData.aclsCertified = body.aclsCertified
    if (body.aclsCertExpiry !== undefined) nurseUpdateData.aclsCertExpiry = body.aclsCertExpiry ? new Date(body.aclsCertExpiry) : null
    if (body.degree !== undefined) nurseUpdateData.degree = body.degree
    if (body.university !== undefined) nurseUpdateData.university = body.university
    if (body.graduationYear !== undefined) nurseUpdateData.graduationYear = body.graduationYear
    if (body.bio !== undefined) nurseUpdateData.bio = body.bio
    if (body.skills !== undefined) nurseUpdateData.skills = JSON.stringify(body.skills)
    if (body.languages !== undefined) nurseUpdateData.languages = JSON.stringify(body.languages)
    if (body.availableForConsult !== undefined) nurseUpdateData.availableForConsult = body.availableForConsult
    if (body.licenseExpiryDate !== undefined) nurseUpdateData.licenseExpiryDate = new Date(body.licenseExpiryDate)

    // Build update data for user
    const userUpdateData: Record<string, unknown> = {}

    if (body.firstName !== undefined) userUpdateData.firstName = body.firstName
    if (body.lastName !== undefined) userUpdateData.lastName = body.lastName
    if (body.middleName !== undefined) userUpdateData.middleName = body.middleName
    if (body.displayName !== undefined) userUpdateData.displayName = body.displayName
    if (body.avatarUrl !== undefined) userUpdateData.avatarUrl = body.avatarUrl
    if (body.phone !== undefined) userUpdateData.phone = body.phone

    // Update user if there are user fields
    if (Object.keys(userUpdateData).length > 0) {
      await db.user.update({
        where: { id: authUser.id },
        data: userUpdateData,
      })
    }

    // Update nurse profile
    const updatedProfile = await db.nurseProfile.update({
      where: { userId: authUser.id },
      data: nurseUpdateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            middleName: true,
            displayName: true,
            avatarUrl: true,
            phone: true,
            countryCode: true,
            status: true,
          },
        },
        facility: {
          select: {
            id: true,
            name: true,
            type: true,
            city: true,
            state: true,
          },
        },
      },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: authUser.id,
        action: 'PROFILE_UPDATED',
        resource: 'NurseProfile',
        resourceId: updatedProfile.id,
        details: 'Nurse profile updated',
      },
    })

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: updatedProfile,
    })
  } catch (error) {
    console.error('Error updating nurse profile:', error)
    return NextResponse.json(
      { error: 'Failed to update nurse profile' },
      { status: 500 }
    )
  }
}
