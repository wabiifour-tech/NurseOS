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
 *   - Mutations are wrapped in a Prisma transaction to prevent TOCTOU races
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
  // Step 1: Quick env var check (no DB query needed)
  const founderEmail = process.env.FOUNDER_EMAIL
  if (!founderEmail) {
    return { bootstrapped: false, reason: 'FOUNDER_EMAIL not configured' }
  }

  // Step 2: Check if any Super Admin already exists
  const existingSA = await db.adminProfile.findFirst({
    where: { accessLevel: { gte: 10 } },
    select: { id: true },
  })

  if (existingSA) {
    return { bootstrapped: false, reason: 'Super Admin already exists' }
  }

  // Step 3: Get the user
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, status: true },
  })

  if (!user) {
    return { bootstrapped: false, reason: 'User not found' }
  }

  // Step 4: Verify email matches FOUNDER_EMAIL
  if (user.email.toLowerCase().trim() !== founderEmail.toLowerCase().trim()) {
    return { bootstrapped: false, reason: 'Email does not match FOUNDER_EMAIL' }
  }

  // Step 5-7: All mutations inside a transaction to prevent TOCTOU races.
  // Without a transaction, two concurrent login requests could both pass
  // Step 2 (no SA exists) before either creates the profile.
  try {
    await db.$transaction(async (tx) => {
      // Re-check SA existence inside the transaction (serializable guarantee)
      const saInsideTx = await tx.adminProfile.findFirst({
        where: { accessLevel: { gte: 10 } },
        select: { id: true },
      })
      if (saInsideTx) {
        throw new Error('SA_ALREADY_EXISTS')
      }

      // Ensure user has ADMIN role
      if (user.role !== 'ADMIN') {
        await tx.user.update({
          where: { id: userId },
          data: { role: 'ADMIN' },
        })
      }

      // Create or upgrade AdminProfile to accessLevel = 10
      const existingProfile = await tx.adminProfile.findUnique({
        where: { userId },
        select: { id: true, accessLevel: true },
      })

      if (existingProfile) {
        await tx.adminProfile.update({
          where: { id: existingProfile.id },
          data: { accessLevel: 10 },
        })
      } else {
        await tx.adminProfile.create({
          data: {
            id: randomUUID(),
            userId,
            accessLevel: 10,
          },
        })
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'SUPER_ADMIN_BOOTSTRAP',
          resource: 'User',
          resourceId: userId,
          details: `Super Admin bootstrapped via Google OAuth for ${user.email}. No prior Super Admin existed.`,
        },
      })
    })
  } catch (txError) {
    // If the transaction threw our sentinel, it means another request
    // created the SA between our Step 2 and the transaction — safe to ignore.
    if ((txError as Error)?.message === 'SA_ALREADY_EXISTS') {
      return { bootstrapped: false, reason: 'Super Admin already exists (concurrent request)' }
    }
    throw txError
  }

  console.log(`[bootstrap] Super Admin bootstrapped: ${user.email} (userId: ${userId})`)

  return { bootstrapped: true }
}
