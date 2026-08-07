import { db } from '@/lib/db'
import { withAuth } from '@/lib/middleware'

// Allowed MIME types for avatar uploads
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export const POST = withAuth({
  auditAction: 'auth.avatar.upload',
  auditResource: 'user',
}, async (ctx) => {
  const { user: authUser, request } = ctx

  const formData = await request.formData()
  const file = formData.get('avatar') as File | null

  if (!file) {
    return Response.json(
      { error: 'No image file provided. Please select an image to upload.' },
      { status: 400 },
    )
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json(
      { error: 'Invalid file type. Only JPG, PNG, and WebP images are allowed.' },
      { status: 400 },
    )
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return Response.json(
      { error: 'Image must be less than 5MB.' },
      { status: 400 },
    )
  }

  // Convert the image to a base64 data URL
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const base64 = buffer.toString('base64')
  const dataUrl = `data:${file.type};base64,${base64}`

  // Update the user's avatarUrl in the database
  await db.user.update({
    where: { id: authUser.id },
    data: { avatarUrl: dataUrl },
  })

  // Return user data without password hash
  const updatedUser = await db.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true, role: true },
  })

  return Response.json({
    message: 'Profile picture updated successfully',
    user: updatedUser,
  })
})
