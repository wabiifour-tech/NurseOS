import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

// GET /api/nurseid/profile/[nurseId] - Get a nurse's public profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ nurseId: string }> }
) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const { nurseId } = await params

    const nurseProfile = await db.nurseProfile.findUnique({
      where: { id: nurseId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            displayName: true,
            avatarUrl: true,
            countryCode: true,
            createdAt: true,
            // Do NOT include email, phone, or status for public view
          },
        },
        credentials: {
          where: { isPublic: true },
          orderBy: { issueDate: 'desc' },
          select: {
            id: true,
            credentialName: true,
            credentialType: true,
            isVerified: true,
          },
        },
        competencies: {
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            competencyArea: true,
            level: true,
          },
        },
        portfolioEntries: {
          where: { isPublic: true },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            entryType: true,
            description: true,
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

    if (!nurseProfile) {
      return NextResponse.json(
        { error: 'Nurse profile not found' },
        { status: 404 }
      )
    }

    // Build public profile — only include fields safe for public viewing
    const publicProfile = {
      id: nurseProfile.id,
      licenseNumber: nurseProfile.licenseNumber,
      specialization: nurseProfile.specialization,
      yearsOfExperience: nurseProfile.yearsOfExperience,
      blsCertified: nurseProfile.blsCertified,
      aclsCertified: nurseProfile.aclsCertified,
      degree: nurseProfile.degree,
      university: nurseProfile.university,
      bio: nurseProfile.bio,
      skills: nurseProfile.skills,
      languages: nurseProfile.languages,
      availableForConsult: nurseProfile.availableForConsult,
      rating: nurseProfile.rating,
      totalRatings: nurseProfile.totalRatings,
      nursingCouncil: nurseProfile.nursingCouncil,
      createdAt: nurseProfile.createdAt,
      user: {
        id: nurseProfile.user.id,
        firstName: nurseProfile.user.firstName,
        lastName: nurseProfile.user.lastName,
        middleName: nurseProfile.user.middleName,
        displayName: nurseProfile.user.displayName,
        avatarUrl: nurseProfile.user.avatarUrl,
        countryCode: nurseProfile.user.countryCode,
        memberSince: nurseProfile.user.createdAt,
      },
      credentials: nurseProfile.credentials,
      competencies: nurseProfile.competencies,
      portfolioEntries: nurseProfile.portfolioEntries,
      facility: nurseProfile.facility,
    }

    return NextResponse.json({ profile: publicProfile })
  } catch (error) {
    console.error('Error fetching public nurse profile:', error)
    return NextResponse.json({ error: 'Failed to fetch nurse profile' }, { status: 500 })
  }
}
