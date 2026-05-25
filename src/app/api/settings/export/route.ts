import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

// GET /api/settings/export — Export all user data as JSON
export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    // Gather user profile
    const user = await db.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
        nurseProfile: {
          select: {
            id: true,
            licenseNumber: true,
            specialization: true,
            yearsOfExperience: true,
            bio: true,
            skills: true,
            languages: true,
            blsCertified: true,
            aclsCertified: true,
            nursingCouncil: true,
            degree: true,
            university: true,
            graduationYear: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const exportData: Record<string, unknown> = {
      exportDate: new Date().toISOString(),
      profile: user,
    }

    // If nurse, gather nurse-specific data
    if (user.nurseProfile) {
      const nurseId = user.nurseProfile.id

      // Credentials
      const credentials = await db.credential.findMany({
        where: { nurseId },
        select: {
          credentialType: true,
          credentialName: true,
          issuingBody: true,
          issueDate: true,
          expiryDate: true,
          isVerified: true,
        },
      })

      // Competencies
      const competencies = await db.competency.findMany({
        where: { nurseId },
        select: {
          competencyArea: true,
          level: true,
          assessedAt: true,
        },
      })

      // CPD Records
      const cpdRecords = await db.cPDRecord.findMany({
        where: { nurseId },
        select: {
          activityType: true,
          title: true,
          description: true,
          cpdPoints: true,
          dateCompleted: true,
        },
      })

      // Portfolio Entries
      const portfolioEntries = await db.portfolioEntry.findMany({
        where: { nurseId },
        select: {
          entryType: true,
          title: true,
          description: true,
          startDate: true,
          endDate: true,
        },
      })

      // Nursing Notes (if nurse has facility)
      let vitals: unknown[] = []
      let nursingNotes: unknown[] = []
      if (authUser.facilityId) {
        vitals = await db.vitalSign.findMany({
          where: { recordedByNurseId: nurseId },
          select: {
            temperature: true,
            heartRate: true,
            respiratoryRate: true,
            bloodPressureSystolic: true,
            bloodPressureDiastolic: true,
            oxygenSaturation: true,
            recordedAt: true,
          },
          take: 500,
          orderBy: { recordedAt: 'desc' },
        })

        nursingNotes = await db.nursingNote.findMany({
          where: { nurseId },
          select: {
            noteType: true,
            content: true,
            isSigned: true,
            createdAt: true,
          },
          take: 500,
          orderBy: { createdAt: 'desc' },
        })
      }

      // Knowledge Articles
      const articles = await db.knowledgeArticle.findMany({
        where: { authorId: nurseId },
        select: {
          title: true,
          category: true,
          isPublished: true,
          viewCount: true,
          likeCount: true,
          createdAt: true,
        },
      })

      // Enrollments
      const enrollments = await db.enrollment.findMany({
        where: { nurseId },
        select: {
          status: true,
          progressPercent: true,
          enrolledAt: true,
          completedAt: true,
          course: { select: { title: true } },
        },
      })

      exportData.credentials = credentials
      exportData.competencies = competencies
      exportData.cpdRecords = cpdRecords
      exportData.portfolioEntries = portfolioEntries
      exportData.vitals = vitals
      exportData.nursingNotes = nursingNotes
      exportData.articles = articles
      exportData.enrollments = enrollments
    }

    // Notification preferences
    const notifPrefs = await db.notificationPreference.findMany({
      where: { userId: authUser.id },
      select: { key: true, enabled: true },
    })
    exportData.notificationPreferences = notifPrefs

    // Return as downloadable JSON
    const jsonStr = JSON.stringify(exportData, null, 2)
    return new NextResponse(jsonStr, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="nurseos-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    })
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}
