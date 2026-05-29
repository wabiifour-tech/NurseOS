/**
 * NurseOS — Notification Helper
 *
 * Centralized, preference-aware notification creation.
 * All notification-creating code should use this instead of db.notification.create directly.
 * This ensures user notification preferences are respected.
 */

import { db } from '@/lib/db'

// Map notification type to the preference key that controls it
const NOTIFICATION_TYPE_TO_PREF_KEY: Record<string, string> = {
  CONSULTATION: 'consultation-updates',
  MESSAGE: 'direct-messages',
  REFERRAL: 'referral-updates',
  SUPPORT: 'system-updates',
  USER_APPROVAL: 'system-updates',
  ACCOUNT_APPROVED: 'system-updates',
  ALERT: 'patient-alerts',
  SYSTEM: 'system-updates',
  COURSE: 'training-updates',
  ANNOUNCEMENT: 'announcements',
  DM: 'direct-messages',
  OUTBREAK: 'patient-alerts',
  SHIFT: 'appointment-reminders',
  APPOINTMENT: 'appointment-reminders',
}

export interface CreateNotificationParams {
  userId: string
  type: string
  title: string
  message: string
  data?: string | null
  /** If true, skip preference check and always deliver (e.g., critical system alerts) */
  force?: boolean
}

/**
 * Create a notification for a user, respecting their notification preferences.
 * If the user has disabled notifications for this type, the notification is silently skipped
 * (unless `force` is true for critical alerts).
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  data,
  force = false,
}: CreateNotificationParams): Promise<void> {
  try {
    // Check notification preference
    if (!force) {
      const prefKey = NOTIFICATION_TYPE_TO_PREF_KEY[type]
      if (prefKey) {
        const pref = await db.notificationPreference.findUnique({
          where: { userId_key: { userId, key: prefKey } },
        })
        if (pref && !pref.enabled) {
          // User has disabled this notification type — skip creation
          return
        }
      }
    }

    await db.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data || null,
      },
    })
  } catch (error) {
    console.error('[Notify] Failed to create notification:', error)
    // Non-blocking — never throw from notification creation
  }
}

/**
 * Create notifications for multiple users (bulk).
 * Respects each user's notification preferences.
 */
export async function createBulkNotifications(
  users: { id: string }[],
  params: Omit<CreateNotificationParams, 'userId'>
): Promise<void> {
  await Promise.all(
    users.map((user) =>
      createNotification({
        ...params,
        userId: user.id,
      })
    )
  )
}

/**
 * Create a notification for all users in a facility.
 * Respects each user's notification preferences.
 */
export async function notifyFacilityUsers(
  facilityId: string,
  params: Omit<CreateNotificationParams, 'userId'>
): Promise<number> {
  const users = await db.user.findMany({
    where: { facilityId, status: 'ACTIVE' },
    select: { id: true },
  })

  await createBulkNotifications(users, params)
  return users.length
}

/**
 * Create a notification for all active admin users (facility admins + super admins).
 */
export async function notifyAdmins(
  params: Omit<CreateNotificationParams, 'userId'>
): Promise<number> {
  const admins = await db.user.findMany({
    where: {
      status: 'ACTIVE',
      OR: [
        { role: 'SUPER_ADMIN' },
        { role: 'ADMIN' },
      ],
    },
    select: { id: true },
  })

  await createBulkNotifications(admins, params)
  return admins.length
}

/**
 * Generate a thread key for direct messages between two users.
 * Always sorts the user IDs alphabetically so the same pair always gets the same key.
 */
export function generateThreadKey(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join('::')
}
