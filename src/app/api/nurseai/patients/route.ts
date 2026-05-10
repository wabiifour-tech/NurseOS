import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/nurseai/patients
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 50))
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { user: { firstName: { contains: search } } },
        { user: { lastName: { contains: search } } },
        { user: { displayName: { contains: search } } },
        { patientId: { contains: search } },
      ]
    }

    const patients = await db.patientProfile.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const formatted = patients.map((p) => ({
      id: p.id,
      patientId: p.patientId,
      firstName: p.user?.firstName ?? '',
      lastName: p.user?.lastName ?? '',
      displayName: p.user?.displayName ?? null,
      fullName: p.user
        ? `${p.user.firstName} ${p.user.lastName}`
        : p.patientId,
      gender: p.gender,
      bloodType: p.bloodType,
      dateOfBirth: p.dateOfBirth?.toISOString() ?? null,
    }))

    return NextResponse.json({ patients: formatted })
  } catch (error) {
    console.error('Error fetching patients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch patients' },
      { status: 500 }
    )
  }
}
