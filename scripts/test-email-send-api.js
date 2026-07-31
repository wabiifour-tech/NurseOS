/**
 * Test email send via the actual HTTP API endpoint.
 *
 * This script:
 *   1. Connects to the database
 *   2. Creates a session token for the super admin
 *   3. Starts the Next.js dev server (if not running)
 *   4. Calls POST /api/email/send with the super admin's token
 *   5. Reports the result
 *   6. Cleans up the session token
 */

require('dotenv').config({ path: '.env' })

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:')) {
  process.env.DATABASE_URL =
    'postgresql://neondb_owner:npg_RFQg1JTECq7U@ep-snowy-firefly-ap4ppwzh-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require'
  process.env.DIRECT_URL = process.env.DATABASE_URL
}

const crypto = require('crypto')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000'
const SUPER_ADMIN_EMAIL = 'wabithetechnurse@nurseos.digital'

async function main() {
  console.log('=== NurseOS Email Send Test (via HTTP API) ===\n')
  console.log('Server URL:', SERVER_URL)
  console.log()

  // 1. Find the super admin
  const superAdmin = await prisma.user.findFirst({
    where: { email: SUPER_ADMIN_EMAIL },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, status: true },
  })

  if (!superAdmin) {
    console.error('✗ Super admin user not found:', SUPER_ADMIN_EMAIL)
    process.exit(1)
  }

  console.log('✓ Found super admin:')
  console.log('  ID:', superAdmin.id)
  console.log('  Email:', superAdmin.email)
  console.log('  Name:', superAdmin.firstName, superAdmin.lastName)
  console.log('  Role:', superAdmin.role)
  console.log()

  // 2. Create a session token directly in the DB
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  await prisma.session.create({
    data: {
      userId: superAdmin.id,
      token,
      expiresAt,
    },
  })

  console.log('✓ Created session token for super admin')
  console.log('  Token:', token.substring(0, 16) + '...')
  console.log()

  // 3. Check server health
  console.log('=== Checking Server Health ===')
  let serverOk = false
  try {
    const healthResp = await fetch(`${SERVER_URL}/api/health`)
    if (healthResp.ok) {
      const health = await healthResp.json()
      console.log('✓ Server is healthy')
      console.log('  Database:', health.database)
      console.log('  Tables exist:', health.tablesExist)
      serverOk = true
    } else {
      console.log('✗ Server health check failed:', healthResp.status)
    }
  } catch (e) {
    console.log('✗ Server is not running at', SERVER_URL)
    console.log('  Error:', e.message)
  }
  console.log()

  if (!serverOk) {
    console.log('Please start the dev server first: npm run dev')
    console.log('Or specify a different SERVER_URL environment variable.')
    await cleanupSession(token)
    process.exit(1)
  }

  // 4. Call POST /api/email/send
  console.log('=== Sending Email via /api/email/send ===')
  const subject = `NurseOS Test Email — ${new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}`
  const message =
    `Hello ${superAdmin.firstName},\n\n` +
    `This is a test email sent from the NurseOS Super Admin dashboard to verify that the email system is working correctly.\n\n` +
    `Timestamp: ${new Date().toISOString()}\n\n` +
    `If you received this email, the email integration is functioning properly.\n\n` +
    `Best regards,\n` +
    `The NurseOS Team`

  const emailResp = await fetch(`${SERVER_URL}/api/email/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Cookie: `nurseos-token=${token}`,
    },
    body: JSON.stringify({
      recipientId: superAdmin.id,
      subject,
      templateId: 'custom',
      message,
      ctaUrl: 'https://www.nurseos.digital/dashboard',
      ctaLabel: 'Go to Dashboard',
    }),
  })

  const emailData = await emailResp.json()
  console.log('Response status:', emailResp.status)
  console.log('Response body:', JSON.stringify(emailData, null, 2))
  console.log()

  // 5. Check the email log entry in the DB
  if (emailData.emailLogId) {
    console.log('=== EmailLog Entry (from DB) ===')
    const log = await prisma.emailLog.findUnique({
      where: { id: emailData.emailLogId },
    })
    if (log) {
      console.log('  ID:', log.id)
      console.log('  Status:', log.status)
      console.log('  To:', log.toEmail)
      console.log('  From:', log.fromEmail)
      console.log('  Subject:', log.subject)
      console.log('  Template:', log.templateId)
      console.log('  Sender ID:', log.senderId)
      console.log('  Recipient ID:', log.recipientId)
      console.log('  Provider ID:', log.providerId || '(none)')
      console.log('  Created:', log.createdAt)
      console.log('  Sent At:', log.sentAt || '(not sent)')
      if (log.error) console.log('  Error:', log.error)
    } else {
      console.log('  ! EmailLog entry not found')
    }
    console.log()
  }

  // 6. Final summary
  console.log('=== FINAL SUMMARY ===')
  console.log()
  if (emailData.success) {
    console.log('✓✓✓ EMAIL WAS SENT SUCCESSFULLY! ✓✓✓')
    console.log()
    console.log('  The email was sent to:', superAdmin.email)
    console.log('  Provider ID:', emailData.providerId || emailData.emailLogId)
    console.log()
    console.log('  Please check the inbox at:', superAdmin.email)
    console.log('  (Also check spam/junk folder if not visible in inbox)')
  } else {
    console.log('✗ EMAIL WAS NOT ACTUALLY SENT')
    console.log()
    console.log('  Reason:', emailData.error || emailData.message)
    console.log()
    console.log('  The email WAS logged to the database with status: PENDING')
    console.log('  EmailLog ID:', emailData.emailLogId)
    console.log()
    console.log('  To actually deliver emails to recipients:')
    console.log('    1. Sign up at https://resend.com (FREE — 100 emails/day)')
    console.log('    2. Generate an API key at https://resend.com/api-keys')
    console.log('    3. Add these env vars to .env AND Vercel project settings:')
    console.log('       RESEND_API_KEY=re_your_api_key_here')
    console.log('       EMAIL_FROM=NurseOS <onboarding@resend.dev>  (for testing)')
    console.log('       EMAIL_REPLY_TO=support@nurseos.digital')
    console.log('    4. Redeploy the app')
    console.log()
    console.log('  Until RESEND_API_KEY is set, all emails are saved as PENDING')
    console.log('  in the EmailLog table but not actually delivered.')
  }

  // Cleanup session
  await cleanupSession(token)
}

async function cleanupSession(token) {
  try {
    await prisma.session.delete({ where: { token } })
    console.log()
    console.log('✓ Cleaned up test session token')
  } catch (e) {
    // ignore
  }
}

main()
  .catch((e) => {
    console.error('✗ Script failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
