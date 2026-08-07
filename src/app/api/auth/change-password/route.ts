import { db } from '@/lib/db'
import { withAuth } from '@/lib/middleware'
import bcrypt from 'bcryptjs'

export const POST = withAuth({
  auditAction: 'auth.password.change',
  auditResource: 'user',
  auditSeverity: 'HIGH',
}, async (ctx) => {
  const { user: authUser, request } = ctx

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { currentPassword, newPassword } = body

  if (!currentPassword || !newPassword) {
    return Response.json(
      { error: 'Current password and new password are required' },
      { status: 400 },
    )
  }

  // Validate new password strength
  if (newPassword.length < 8) {
    return Response.json(
      { error: 'New password must be at least 8 characters' },
      { status: 400 },
    )
  }
  if (!/[A-Z]/.test(newPassword)) {
    return Response.json(
      { error: 'New password must contain at least one uppercase letter' },
      { status: 400 },
    )
  }
  if (!/[0-9]/.test(newPassword)) {
    return Response.json(
      { error: 'New password must contain at least one number' },
      { status: 400 },
    )
  }

  // Find the user
  const user = await db.user.findUnique({
    where: { id: authUser.id },
  })

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 })
  }

  // Verify current password
  const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!passwordMatch) {
    return Response.json({ error: 'Current password is incorrect' }, { status: 401 })
  }

  // Hash the new password
  const newPasswordHash = await bcrypt.hash(newPassword, 10)

  // Update the password
  await db.user.update({
    where: { id: authUser.id },
    data: { passwordHash: newPasswordHash },
  })

  // Invalidate all OTHER sessions for this user (keep current session)
  const currentToken = request.cookies.get('nurseos-token')?.value ||
    request.headers.get('Authorization')?.replace('Bearer ', '')
  if (currentToken) {
    await db.session.deleteMany({
      where: {
        userId: user.id,
        NOT: { token: currentToken },
      },
    })
  }

  return Response.json({
    message: 'Password changed successfully',
  })
})
