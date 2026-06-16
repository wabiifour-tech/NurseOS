/**
 * Test email send directly to wabithetechnurse@nurseos.digital
 *
 * This script bypasses the HTTP API and calls the email service directly.
 * It will:
 *   1. Connect to the database
 *   2. Find the super admin user (wabithetechnurse@nurseos.digital)
 *   3. Call sendEmail() to send a test email
 *   4. Report the result
 *
 * The email is logged to the EmailLog table. Without RESEND_API_KEY, the email
 * is saved as PENDING status and not actually delivered.
 */

// Load env
require('dotenv').config({ path: '.env' })

// Override DATABASE_URL if it's the SQLite default
if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:')) {
  process.env.DATABASE_URL =
    'postgresql://neondb_owner:npg_RFQg1JTECq7U@ep-snowy-firefly-ap4ppwzh-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require'
  process.env.DIRECT_URL = process.env.DATABASE_URL
}

const crypto = require('crypto')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('=== NurseOS Email Send Test ===\n')

  // 1. Find the super admin
  const superAdmin = await prisma.user.findFirst({
    where: { email: 'wabithetechnurse@nurseos.digital' },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, status: true },
  })

  if (!superAdmin) {
    console.error('✗ Super admin user not found')
    process.exit(1)
  }

  console.log('✓ Found super admin:')
  console.log('  ID:', superAdmin.id)
  console.log('  Email:', superAdmin.email)
  console.log('  Name:', superAdmin.firstName, superAdmin.lastName)
  console.log('  Role:', superAdmin.role)
  console.log('  Status:', superAdmin.status)
  console.log()

  // 2. Check env vars
  console.log('=== Environment Check ===')
  console.log('  RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✓ SET' : '✗ NOT SET')
  console.log('  EMAIL_FROM:', process.env.EMAIL_FROM || 'NurseOS <onboarding@nurseos.digital> (default)')
  console.log('  EMAIL_REPLY_TO:', process.env.EMAIL_REPLY_TO || 'support@nurseos.digital (default)')
  console.log('  NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL || 'https://www.nurseos.digital (default)')
  console.log()

  // 3. Try to import the email service
  console.log('=== Loading Email Service ===')
  let sendEmail, EMAIL_CONFIG
  try {
    const emailModule = require('./src/lib/email.ts')
    sendEmail = emailModule.sendEmail
    EMAIL_CONFIG = emailModule.EMAIL_CONFIG
    console.log('✓ Email module loaded')
  } catch (e) {
    console.log('! Could not load TS module directly:', e.message)
    console.log('  Falling back to direct Resend test...')

    // Direct test with Resend
    const RESEND_API_KEY = process.env.RESEND_API_KEY
    if (!RESEND_API_KEY) {
      console.log('\n✗ RESEND_API_KEY is not set. Email CANNOT be actually sent.')
      console.log('  The email would be logged as PENDING in the EmailLog table.')
      console.log('  To actually send emails, set RESEND_API_KEY in .env')
    } else {
      console.log('\n✓ RESEND_API_KEY is set. Attempting direct send via Resend API...')
      const fetch = require('node-fetch')
      try {
        const resp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'NurseOS <onboarding@nurseos.digital>',
            to: ['wabithetechnurse@nurseos.digital'],
            subject: 'Test Email from NurseOS Super Admin',
            html: '<h1>Test Email</h1><p>This is a test email sent from NurseOS.</p><p>Time: ' + new Date().toISOString() + '</p>',
          }),
        })
        const data = await resp.json()
        console.log('Response status:', resp.status)
        console.log('Response body:', JSON.stringify(data, null, 2))
      } catch (err) {
        console.error('✗ Resend API call failed:', err.message)
      }
    }
    return
  }

  // 4. Build the email template
  const React = require('react')
  const { CustomEmail } = require('./src/emails/custom')

  const recipientName = `${superAdmin.firstName} ${superAdmin.lastName}`
  const senderName = 'NurseOS System'
  const subject = 'Test Email from NurseOS — ' + new Date().toLocaleString()

  const react = CustomEmail({
    recipientName,
    message:
      'Hello ' +
      recipientName +
      ',\n\nThis is a test email sent from the NurseOS Super Admin dashboard to verify that the email system is working correctly.\n\nIf you received this email, the email integration is functioning properly.\n\nBest regards,\nThe NurseOS Team',
    senderName,
    senderRole: 'SUPER_ADMIN',
    ctaUrl: 'https://www.nurseos.digital/dashboard',
    ctaLabel: 'Go to Dashboard',
  })

  // 5. Send the email
  console.log('=== Sending Email ===')
  console.log('  From:', EMAIL_CONFIG.from)
  console.log('  To:', superAdmin.email)
  console.log('  Subject:', subject)
  console.log()

  const result = await sendEmail({
    to: superAdmin.email,
    subject,
    templateId: 'custom',
    react,
    senderId: superAdmin.id,
    recipientId: superAdmin.id,
    metadata: { test: true, source: 'test-email-send-script' },
  })

  console.log('=== Result ===')
  console.log('  Success:', result.success)
  console.log('  Email Log ID:', result.emailLogId)
  if (result.providerId) console.log('  Provider ID:', result.providerId)
  if (result.error) console.log('  Error:', result.error)
  console.log()

  // 6. Check the email log entry
  const log = await prisma.emailLog.findUnique({
    where: { id: result.emailLogId },
  })
  console.log('=== EmailLog Entry ===')
  console.log('  Status:', log.status)
  console.log('  To:', log.toEmail)
  console.log('  From:', log.fromEmail)
  console.log('  Subject:', log.subject)
  console.log('  Template:', log.templateId)
  console.log('  Created:', log.createdAt)
  if (log.error) console.log('  Error:', log.error)
  console.log()

  // 7. Print summary
  console.log('=== SUMMARY ===')
  if (result.success) {
    console.log('✓ Email was SENT successfully via Resend!')
    console.log('  Check the inbox at:', superAdmin.email)
    console.log('  Provider ID:', result.providerId)
  } else {
    console.log('✗ Email was NOT actually sent.')
    console.log('  Reason:', result.error)
    console.log()
    console.log('  The email was logged to the EmailLog table with status: PENDING')
    console.log('  To actually deliver emails, you need to:')
    console.log('    1. Sign up at https://resend.com (free — 100 emails/day)')
    console.log('    2. Verify your domain (nurseos.digital) OR use onboarding@resend.dev for testing')
    console.log('    3. Generate an API key at https://resend.com/api-keys')
    console.log('    4. Add to .env:')
    console.log('       RESEND_API_KEY=re_your_api_key_here')
    console.log('       EMAIL_FROM=NurseOS <onboarding@resend.dev>')
    console.log('       EMAIL_REPLY_TO=support@nurseos.digital')
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
