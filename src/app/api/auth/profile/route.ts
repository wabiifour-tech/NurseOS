import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

// GET /api/auth/profile — Load full profile including NurseProfile data
export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const user = await db.user.findUnique({
      where: { id: authUser.id },
      include: {
        nurseProfile: {
          select: {
            bio: true,
            licenseNumber: true,
            specialization: true,
            yearsOfExperience: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { passwordHash: _, ...userWithoutPassword } = user
    return NextResponse.json({
      user: userWithoutPassword,
      nurseProfile: user.nurseProfile,
    })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching your profile.' },
      { status: 500 }
    )
  }
}

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
    const { firstName, lastName, phone, bio, facilityId, compactMode } = body

    // Use the authenticated user's ID from the session, not from the request body
    const userId = authUser.id

    // Find the user
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Build update data for User model
    const updateData: Record<string, unknown> = {}
    if (firstName !== undefined) updateData.firstName = firstName
    if (lastName !== undefined) updateData.lastName = lastName
    if (firstName && lastName) updateData.displayName = `${firstName} ${lastName}`
    if (phone !== undefined) updateData.phone = phone
    if (typeof compactMode === 'boolean') updateData.compactMode = compactMode

    // Update the user
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
    })

    // Handle bio field update for nurses (bio is on NurseProfile, not User)
    if (bio !== undefined && user.role === 'NURSE') {
      await db.nurseProfile.update({
        where: { userId },
        data: { bio },
      })
    }

    // 🔒 FACILITY ISOLATION: Handle facility assignment update
    if (facilityId !== undefined) {
      // Validate that the facility exists
      if (facilityId) {
        const facility = await db.facility.findUnique({
          where: { id: facilityId },
        })
        if (!facility) {
          return NextResponse.json(
            { error: 'Facility not found' },
            { status: 404 }
          )
        }
      }

      // Update the nurse's current facility
      if (user.role === 'NURSE') {
        await db.nurseProfile.update({
          where: { userId },
          data: { currentFacilityId: facilityId || null },
        })
      } else if (user.role === 'ADMIN') {
        await db.adminProfile.update({
          where: { userId },
          data: { facilityId: facilityId || null },
        })
      }

      // Create audit log for facility change
      await db.auditLog.create({
        data: {
          userId: user.id,
          action: 'FACILITY_UPDATED',
          resource: 'NurseProfile',
          resourceId: userId,
          details: `Facility assignment changed to: ${facilityId || 'None'}`,
        },
      })
    }

    // Create audit log for profile update
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'PROFILE_UPDATED',
        resource: 'User',
        resourceId: user.id,
        details: 'User updated their profile',
      },
    })

    // Get the updated facility info for the response
    let updatedFacilityId = facilityId !== undefined ? facilityId : authUser.facilityId
    let facilityName: string | null = null
    if (updatedFacilityId) {
      const facility = await db.facility.findUnique({
        where: { id: updatedFacilityId },
        select: { name: true },
      })
      facilityName = facility?.name || null
    }

    // Return user data without password hash
    const { passwordHash: _, ...userWithoutPassword } = updatedUser

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: userWithoutPassword,
      facilityId: updatedFacilityId,
      facilityName,
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'An error occurred while updating your profile. Please try again.' },
      { status: 500 }
    )
  }
}
