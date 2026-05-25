import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

// GET /api/nurseacademy/simulations - List simulations
export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || ''
    const difficulty = searchParams.get('difficulty') || ''
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = { isPublished: true }
    if (type) where.scenarioType = type
    if (difficulty) where.difficulty = difficulty

    const simulations = await db.simulation.findMany({
      where,
      include: {
        _count: { select: { attempts: true } },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    // Get distinct types and difficulties for filters
    const [types, difficulties] = await Promise.all([
      db.simulation.findMany({
        where: { isPublished: true },
        select: { scenarioType: true },
        distinct: ['scenarioType'],
      }),
      db.simulation.findMany({
        where: { isPublished: true },
        select: { difficulty: true },
        distinct: ['difficulty'],
      }),
    ])

    return NextResponse.json({
      simulations,
      types: types.map((t) => t.scenarioType),
      difficulties: difficulties.map((d) => d.difficulty),
    })
  } catch (error) {
    console.error('Error fetching simulations:', error)
    return NextResponse.json({ error: 'Failed to fetch simulations' }, { status: 500 })
  }
}
