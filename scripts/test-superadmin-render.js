/**
 * Test that the superadmin page renders without errors.
 * Creates a session, accesses /superadmin?tab=email, and reports any errors.
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

async function main() {
  console.log('=== Super Admin Page Render Test ===\n')
  console.log('Server URL:', SERVER_URL)

  // 1. Find super admin
  const superAdmin = await prisma.user.findFirst({
    where: { email: 'wabithetechnurse@nurseos.digital' },
    select: { id: true, email: true, role: true, status: true },
  })
  console.log('✓ Super admin:', superAdmin.email, '(' + superAdmin.role + ')')

  // 2. Create session token
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  await prisma.session.create({
    data: { userId: superAdmin.id, token, expiresAt },
  })
  console.log('✓ Created session token')

  // 3. Test all superadmin tabs
  const tabs = ['overview', 'subscriptions', 'facility-approvals', 'facilities', 'users', 'email']
  console.log('\n=== Testing Super Admin Tabs ===')
  for (const tab of tabs) {
    const url = `${SERVER_URL}/superadmin?tab=${tab}`
    console.log(`\nTesting: GET ${url}`)
    try {
      const resp = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Cookie: `nurseos-token=${token}`,
        },
      })
      const text = await resp.text()
      console.log(`  Status: ${resp.status}`)
      // Check for error indicators
      const hasError = text.includes('Something went wrong') ||
                       text.includes('Application error') ||
                       text.includes('unexpected error')
      const hasEmailError = text.includes('Email') && text.includes('error')
      if (hasError) {
        console.log('  ⚠ Page contains error message!')
        // Show a snippet around the error
        const idx = text.indexOf('Something went wrong')
        if (idx >= 0) {
          console.log('  Error context:', text.substring(Math.max(0, idx - 100), idx + 200).replace(/\s+/g, ' '))
        }
      } else {
        console.log('  ✓ Page rendered without "Something went wrong" error')
      }
      // Look for key content to verify it actually rendered
      const keyContent = {
        overview: 'Super Admin Dashboard',
        subscriptions: 'Subscriptions',
        'facility-approvals': 'Facility Approvals',
        facilities: 'Facilities',
        users: 'Users',
        email: 'Email',
      }
      if (text.includes(keyContent[tab])) {
        console.log(`  ✓ Found expected content: "${keyContent[tab]}"`)
      } else {
        console.log(`  ⚠ Missing expected content: "${keyContent[tab]}"`)
      }
    } catch (e) {
      console.log('  ✗ Request failed:', e.message)
    }
  }

  // 4. Test the dashboard page (where HealthcareNews lives)
  console.log('\n=== Testing Dashboard Page (Healthcare News) ===')
  try {
    const resp = await fetch(`${SERVER_URL}/dashboard`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Cookie: `nurseos-token=${token}`,
      },
    })
    const text = await resp.text()
    console.log(`  Status: ${resp.status}`)
    const hasError = text.includes('Something went wrong') ||
                     text.includes('Application error')
    if (hasError) {
      console.log('  ⚠ Dashboard has error!')
      const idx = text.indexOf('Something went wrong')
      if (idx >= 0) {
        console.log('  Error context:', text.substring(Math.max(0, idx - 100), idx + 200).replace(/\s+/g, ' '))
      }
    } else {
      console.log('  ✓ Dashboard rendered without error')
    }
    if (text.includes('Healthcare News')) {
      console.log('  ✓ Healthcare News section found')
    } else {
      console.log('  ⚠ Healthcare News section NOT found')
    }
  } catch (e) {
    console.log('  ✗ Request failed:', e.message)
  }

  // 5. Test the news API directly
  console.log('\n=== Testing /api/news ===')
  try {
    const resp = await fetch(`${SERVER_URL}/api/news`)
    const data = await resp.json()
    console.log(`  Status: ${resp.status}`)
    console.log(`  News count: ${data.news?.length || 0}`)
    console.log(`  Cached: ${data.cached}`)
    if (data.news && data.news.length > 0) {
      console.log(`  First item: ${data.news[0].title}`)
    }
  } catch (e) {
    console.log('  ✗ Request failed:', e.message)
  }

  // 6. Test email stats API
  console.log('\n=== Testing /api/email/stats ===')
  try {
    const resp = await fetch(`${SERVER_URL}/api/email/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Cookie: `nurseos-token=${token}`,
      },
    })
    const data = await resp.json()
    console.log(`  Status: ${resp.status}`)
    console.log(`  Stats:`, JSON.stringify(data))
  } catch (e) {
    console.log('  ✗ Request failed:', e.message)
  }

  // Cleanup
  try {
    await prisma.session.delete({ where: { token } })
    console.log('\n✓ Cleaned up test session')
  } catch (e) {}
}

main()
  .catch((e) => {
    console.error('✗ Script failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
