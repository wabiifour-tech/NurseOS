import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/middleware/compose'

// GET /api/settings/notification-preferences — Load notification preferences from server
export const GET = withAuth({}, async (ctx) => {
  try {
    const prefs = await db.notificationPreference.findMany({
      where: { userId: ctx.user.id },
      select: { key: true, enabled: true },
    })

    // Convert to object format for the frontend
    const preferences: Record<string, boolean> = {}
    for (const pref of prefs) {
      preferences[pref.key] = pref.enabled
    }

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('Error fetching notification preferences:', error)
    return NextResponse.json({ error: 'Failed to fetch notification preferences' }, { status: 500 })
  }
})

// PUT /api/settings/notification-preferences — Save notification preferences to server
export const PUT = withAuth({}, async (ctx) => {
  try {
    let body
    try {
      body = await ctx.request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { preferences } = body as { preferences: Record<string, boolean> }
    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json({ error: 'Invalid preferences data' }, { status: 400 })
    }

    // Upsert each preference
    const operations = Object.entries(preferences).map(([key, enabled]) =>
      db.notificationPreference.upsert({
        where: {
          userId_key: { userId: ctx.user.id, key },
        },
        create: {
          userId: ctx.user.id,
          key,
          enabled,
        },
        update: {
          enabled,
        },
      })
    )

    await Promise.all(operations)

    return NextResponse.json({ message: 'Notification preferences saved successfully' })
  } catch (error) {
    console.error('Error saving notification preferences:', error)
    return NextResponse.json({ error: 'Failed to save notification preferences' }, { status: 500 })
  }
})
