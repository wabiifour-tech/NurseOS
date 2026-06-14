import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

// Allowed MIME types for avatar uploads
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const formData = await request.formData()
    const file = formData.get('avatar') as File | null
    const userIdFromBody = formData.get('userId') as string | null

    // Use authenticated user's ID (ignore body userId for security)
    const userId = authUser.id

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided. Please select an image to upload.' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG, and WebP images are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Image must be less than 5MB.' },
        { status: 400 }
      )
    }

    // Convert the image to a base64 data URL
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    // Update the user's avatarUrl in the database
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { avatarUrl: dataUrl },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        userId,
        action: 'AVATAR_UPDATED',
        resource: 'User',
        resourceId: userId,
        details: 'User updated their profile picture',
      },
    })

    // Return user data without password hash
    const { passwordHash: _, ...userWithoutPassword } = updatedUser

    return NextResponse.json({
      message: 'Profile picture updated successfully',
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error('Avatar upload error:', error)
    return NextResponse.json(
      { error: 'An error occurred while uploading your profile picture. Please try again.' },
      { status: 500 }
    )
  }
}
