import { db } from '@/lib/db'
import { withAuth } from '@/lib/middleware'
import crypto from 'crypto'

// Generate TOTP code from secret (HMAC-SHA1 based)
function generateTOTP(secret: string, timeStep?: number): string {
  // Decode base32 secret to bytes
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let bits = ''
  for (let i = 0; i < secret.length; i++) {
    const val = base32Chars.indexOf(secret.charAt(i).toUpperCase())
    if (val === -1) continue
    bits += val.toString(2).padStart(5, '0')
  }

  const bytes: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2))
  }

  // Calculate time counter (30-second window)
  const counter = timeStep ?? Math.floor(Date.now() / 1000 / 30)
  const counterBuffer = Buffer.alloc(8)
  counterBuffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0)
  counterBuffer.writeUInt32BE(counter & 0xffffffff, 4)

  // HMAC-SHA1
  const hmac = crypto.createHmac('sha1', Buffer.from(bytes))
  hmac.update(counterBuffer)
  const hmacResult = hmac.digest()

  // Dynamic truncation
  const offset = hmacResult[hmacResult.length - 1] & 0x0f
  const code =
    ((hmacResult[offset] & 0x7f) << 24) |
    ((hmacResult[offset + 1] & 0xff) << 16) |
    ((hmacResult[offset + 2] & 0xff) << 8) |
    (hmacResult[offset + 3] & 0xff)

  return (code % 1000000).toString().padStart(6, '0')
}

// Verify a TOTP code against the secret (check current and ±1 window)
function verifyTOTP(secret: string, code: string): boolean {
  const currentStep = Math.floor(Date.now() / 1000 / 30)
  for (let offset = -1; offset <= 1; offset++) {
    const generated = generateTOTP(secret, currentStep + offset)
    if (generated === code) return true
  }
  return false
}

export const POST = withAuth({
  auditAction: 'auth.2fa.verify',
  auditResource: 'user',
  auditSeverity: 'HIGH',
}, async (ctx) => {
  const { user: authUser } = ctx

  let body
  try {
    body = await ctx.request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { code } = body
  if (!code || typeof code !== 'string' || code.length !== 6) {
    return Response.json({ error: 'A valid 6-digit code is required' }, { status: 400 })
  }

  const user = await db.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, twoFactorSecret: true, twoFactorEnabled: true },
  })

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 })
  }

  if (!user.twoFactorSecret) {
    return Response.json({ error: '2FA setup not initiated. Please set up 2FA first.' }, { status: 400 })
  }

  if (user.twoFactorEnabled) {
    return Response.json({ error: '2FA is already enabled' }, { status: 400 })
  }

  // Verify the code
  const isValid = verifyTOTP(user.twoFactorSecret, code)
  if (!isValid) {
    return Response.json({ error: 'Invalid verification code. Please try again.' }, { status: 400 })
  }

  // Enable 2FA
  await db.user.update({
    where: { id: authUser.id },
    data: { twoFactorEnabled: true },
  })

  return Response.json({ message: '2FA enabled successfully' })
})
