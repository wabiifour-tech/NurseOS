import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/middleware/compose'

// GET /api/settings/appearance — load compactMode & sidebarCollapsed from server
export const GET = withAuth({}, async (ctx) => {
  try {
    const user = await db.user.findUnique({
      where: { id: ctx.user.id },
      select: { compactMode: true, sidebarCollapsed: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      compactMode: user.compactMode,
      sidebarCollapsed: user.sidebarCollapsed,
    })
  } catch (error) {
    console.error('Error fetching appearance settings:', error)
    return NextResponse.json({ error: 'Failed to fetch appearance settings' }, { status: 500 })
  }
})

// PUT /api/settings/appearance — save compactMode & sidebarCollapsed
export const PUT = withAuth({}, async (ctx) => {
  try {
    let body
    try {
      body = await ctx.request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { compactMode, sidebarCollapsed } = body

    const updateData: Record<string, unknown> = {}
    if (typeof compactMode === 'boolean') updateData.compactMode = compactMode
    if (typeof sidebarCollapsed === 'boolean') updateData.sidebarCollapsed = sidebarCollapsed

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    await db.user.update({
      where: { id: ctx.user.id },
      data: updateData,
    })

    return NextResponse.json({ message: 'Appearance settings updated successfully' })
  } catch (error) {
    console.error('Error updating appearance settings:', error)
    return NextResponse.json({ error: 'Failed to update appearance settings' }, { status: 500 })
  }
})
