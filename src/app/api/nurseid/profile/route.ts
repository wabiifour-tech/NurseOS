import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

// GET /api/nurseid/profile - Get nurse profile
export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const nurseProfile = await db.nurseProfile.findUnique({
      where: { userId: authUser.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            displayName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            role: true,
            createdAt: true,
          },
        },
        credentials: { orderBy: { issueDate: 'desc' } },
        competencies: { orderBy: { updatedAt: 'desc' } },
        portfolioEntries: { orderBy: { createdAt: 'desc' } },
        cpdRecords: { orderBy: { dateCompleted: 'desc' } },
      },
    })

    if (!nurseProfile) {
      return NextResponse.json(
        { error: 'Nurse profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ profile: nurseProfile })
  } catch (error) {
    console.error('Error fetching nurse profile:', error)
    return NextResponse.json({ error: 'Failed to fetch nurse profile' }, { status: 500 })
  }
}

// PATCH /api/nurseid/profile - Update nurse profile
export async function PATCH(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const existingProfile = await db.nurseProfile.findUnique({
      where: { userId: authUser.id },
    })

    if (!existingProfile) {
      return NextResponse.json(
        { error: 'Nurse profile not found' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (body.specialization !== undefined) updateData.specialization = body.specialization
    if (body.skills !== undefined) updateData.skills = JSON.stringify(body.skills)
    if (body.languages !== undefined) updateData.languages = JSON.stringify(body.languages)
    if (body.yearsOfExperience !== undefined) updateData.yearsOfExperience = body.yearsOfExperience
    if (body.degree !== undefined) updateData.degree = body.degree
    if (body.university !== undefined) updateData.university = body.university
    if (body.graduationYear !== undefined) updateData.graduationYear = body.graduationYear
    if (body.bio !== undefined) updateData.bio = body.bio
    if (body.availableForConsult !== undefined) updateData.availableForConsult = body.availableForConsult

    const updatedProfile = await db.nurseProfile.update({
      where: { userId: authUser.id },
      data: updateData,
    })

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: updatedProfile,
    })
  } catch (error) {
    console.error('Error updating nurse profile:', error)
    return NextResponse.json({ error: 'Failed to update nurse profile' }, { status: 500 })
  }
}
