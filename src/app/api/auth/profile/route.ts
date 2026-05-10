import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, firstName, lastName, phone, bio } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

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

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (firstName !== undefined) updateData.firstName = firstName
    if (lastName !== undefined) updateData.lastName = lastName
    if (firstName && lastName) updateData.displayName = `${firstName} ${lastName}`
    if (phone !== undefined) updateData.phone = phone

    // Update the user
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'PROFILE_UPDATED',
        resource: 'User',
        resourceId: user.id,
        details: 'User updated their profile',
      },
    })

    // Return user data without password hash
    const { passwordHash: _, ...userWithoutPassword } = updatedUser

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'An error occurred while updating your profile. Please try again.' },
      { status: 500 }
    )
  }
}
