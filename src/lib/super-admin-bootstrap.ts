/**
 * Super Admin Bootstrap Logic
 *
 * DESIGN PRINCIPLE: The founder logs in via the SAME flow as every other user.
 * The difference is their PERMISSIONS, not their login experience.
 *
 * Flow:
 *   1. Founder logs in via Google (identical to everyone else)
 *   2. /api/auth/oauth/link processes the login
 *   3. If no Super Admin exists in the DB AND the user's email matches
 *      FOUNDER_EMAIL env var, the user is automatically upgraded:
 *      - role stays 'ADMIN' (never store SUPER_ADMIN in the role column)
 *      - AdminProfile is created with accessLevel = 10
 *      - SUPER_ADMIN is recovered dynamically via accessLevel >= 10
 *
 * SECURITY GUARDRAILS:
 *   - Only works when ZERO users have accessLevel >= 10
 *   - Only works for the email in FOUNDER_EMAIL env var
 *   - FOUNDER_EMAIL must be set (not optional)
 *   - Idempotent — safe to call multiple times
 *   - Creates audit log entry
 *   - Works for both existing users (upgrade) and new users (first-time setup)
 *
 * ENV VARS:
 *   FOUNDER_EMAIL — The email address of the founder. Must be a valid email.
 *                   In production, this MUST be set for the bootstrap to work.
 */

import { db } from '@/lib/db'
import { randomUUID } from 'crypto'

interface BootstrapResult {
  bootstrapped: boolean
  reason?: string
}

/**
 * Check if Super Admin bootstrap should be attempted for this email.
 * Returns false quickly if conditions aren't met (no DB query needed).
 */
export function shouldAttemptBootstrap(email: string): boolean {
  const founderEmail = process.env.FOUNDER_EMAIL
  if (!founderEmail) return false
  return email.toLowerCase().trim() === founderEmail.toLowerCase().trim()
}

/**
 * Attempt to bootstrap the Super Admin.
 *
 * This is called from /api/auth/oauth/link AFTER confirming the user is ACTIVE
 * but BEFORE creating the session. If bootstrap succeeds, the user will have
 * accessLevel = 10 and will be recognized as SUPER_ADMIN on this and all
 * subsequent requests.
 *
 * Returns { bootstrapped: true } if the user was upgraded,
 * or { bootstrapped: false, reason } if no action was taken.
 */
export async function bootstrapSuperAdmin(userId: string): Promise<BootstrapResult> {
  // Step 1: Check if any Super Admin already exists
  // This is a single query — efficient even on large databases due to the index
  const existingSA = await db.adminProfile.findFirst({
    where: { accessLevel: { gte: 10 } },
    select: { id: true },
  })

  if (existingSA) {
    return { bootstrapped: false, reason: 'Super Admin already exists' }
  }

  // Step 2: Get the user
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, status: true },
  })

  if (!user) {
    return { bootstrapped: false, reason: 'User not found' }
  }

  // Step 3: Verify email matches FOUNDER_EMAIL
  const founderEmail = process.env.FOUNDER_EMAIL
  if (!founderEmail) {
    return { bootstrapped: false, reason: 'FOUNDER_EMAIL not configured' }
  }

  if (user.email.toLowerCase().trim() !== founderEmail.toLowerCase().trim()) {
    return { bootstrapped: false, reason: 'Email does not match FOUNDER_EMAIL' }
  }

  // Step 4: Ensure user has ADMIN role
  const effectiveRole = user.role === 'ADMIN' ? 'ADMIN' : 'ADMIN'
  if (user.role !== 'ADMIN') {
    await db.user.update({
      where: { id: userId },
      data: { role: 'ADMIN' },
    })
  }

  // Step 5: Create or upgrade AdminProfile to accessLevel = 10
  const existingProfile = await db.adminProfile.findUnique({
    where: { userId },
    select: { id: true, accessLevel: true },
  })

  if (existingProfile) {
    if (existingProfile.accessLevel >= 10) {
      // Already a Super Admin — shouldn't happen given Step 1, but be safe
      return { bootstrapped: false, reason: 'User already has accessLevel >= 10' }
    }
    // Upgrade existing profile
    await db.adminProfile.update({
      where: { id: existingProfile.id },
      data: { accessLevel: 10 },
    })
  } else {
    // Create new profile
    await db.adminProfile.create({
      data: {
        id: randomUUID(),
        userId,
        accessLevel: 10,
      },
    })
  }

  // Step 6: Audit log
  await db.auditLog.create({
    data: {
      userId,
      action: 'SUPER_ADMIN_BOOTSTRAP',
      resource: 'User',
      resourceId: userId,
      details: `Super Admin bootstrapped via Google OAuth for ${user.email}. No prior Super Admin existed.`,
    },
  })

  console.log(`[bootstrap] Super Admin bootstrapped: ${user.email} (userId: ${userId})`)

  return { bootstrapped: true }
}
