import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/middleware'

// GET /api/nurseid/profile - Get nurse profile (auto-creates if missing)
export const GET = withAuth({}, async (ctx) => {
  try {
    let nurseProfile = await db.nurseProfile.findUnique({
      where: { userId: ctx.user.id },
      include: {
        user: {
          select: {
            id: true, firstName: true, lastName: true, middleName: true,
            displayName: true, email: true, phone: true, avatarUrl: true,
            role: true, createdAt: true,
          },
        },
        credentials: { orderBy: { issueDate: 'desc' } },
        competencies: { orderBy: { updatedAt: 'desc' } },
        portfolioEntries: { orderBy: { createdAt: 'desc' } },
        cpdRecords: { orderBy: { dateCompleted: 'desc' } },
      },
    })

    // Auto-create NurseProfile for users who don't have one
    if (!nurseProfile) {
      nurseProfile = await db.nurseProfile.create({
        data: {
          userId: ctx.user.id,
          licenseNumber: '',
          skills: '[]',
          languages: '["English"]',
        },
        include: {
          user: {
            select: {
              id: true, firstName: true, lastName: true, middleName: true,
              displayName: true, email: true, phone: true, avatarUrl: true,
              role: true, createdAt: true,
            },
          },
          credentials: { orderBy: { issueDate: 'desc' } },
          competencies: { orderBy: { updatedAt: 'desc' } },
          portfolioEntries: { orderBy: { createdAt: 'desc' } },
          cpdRecords: { orderBy: { dateCompleted: 'desc' } },
        },
      })
    }

    return NextResponse.json({ profile: nurseProfile })
  } catch (error) {
    console.error('Error fetching nurse profile:', error)
    return NextResponse.json({ error: 'Failed to fetch nurse profile' }, { status: 500 })
  }
})

// PATCH /api/nurseid/profile - Update nurse profile
export const PATCH = withAuth({}, async (ctx) => {
  try {
    let body;
    try {
      body = await ctx.request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const existingProfile = await db.nurseProfile.findUnique({
      where: { userId: ctx.user.id },
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
      where: { userId: ctx.user.id },
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
})
