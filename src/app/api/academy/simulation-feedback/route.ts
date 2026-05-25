import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

// Fallback templates — used ONLY if AI is unavailable
const FALLBACK_TEMPLATES: Record<string, { strengths: string[]; improvements: string[]; notes: string }> = {
  Emergency: {
    strengths: ['Recognized the urgency of the situation', 'Prioritized patient assessment', 'Considered vital sign interpretation'],
    improvements: ['Include activation of rapid response team', 'Consider IV fluid resuscitation steps', 'Document timeline of interventions'],
    notes: 'Emergency scenarios require systematic ABC (Airway, Breathing, Circulation) approach with clear delegation and timely escalation.',
  },
  'Clinical Decision': {
    strengths: ['Identified critical lab abnormalities', 'Considered the patient\'s clinical context', 'Recognized potential complications'],
    improvements: ['Specify notification protocols for provider', 'Detail electrolyte replacement guidelines', 'Include ongoing monitoring parameters'],
    notes: 'Clinical decisions should integrate lab data with patient presentation and follow institutional protocols for critical values.',
  },
  Communication: {
    strengths: ['Demonstrated empathy for family members', 'Recognized different emotional responses', 'Showed awareness of patient needs'],
    improvements: ['Include therapeutic communication techniques', 'Consider cultural sensitivity', 'Plan for follow-up support resources'],
    notes: 'Effective communication in crisis involves active listening, acknowledging emotions, and providing clear, compassionate information.',
  },
  'Ethical Dilemma': {
    strengths: ['Respected patient autonomy', 'Acknowledged family concerns', 'Recognized the ethical complexity'],
    improvements: ['Involve ethics committee consultation', 'Document patient decision-making capacity', 'Coordinate with social work and chaplaincy'],
    notes: 'Ethical dilemmas require balancing autonomy, beneficence, and non-maleficence while following institutional policies and legal frameworks.',
  },
  Default: {
    strengths: ['Demonstrated patient-centered approach', 'Showed thoroughness in assessment', 'Considered holistic care needs'],
    improvements: ['Include specific assessment tools', 'Detail patient education components', 'Plan for care coordination'],
    notes: 'Comprehensive nursing care integrates assessment, intervention, patient education, and interdisciplinary collaboration.',
  },
}

const SYSTEM_PROMPT = `You are an expert nursing education AI that provides personalized, constructive feedback on clinical simulation responses.

Given a nursing simulation scenario and a nurse's response, provide detailed, personalized feedback that:
1. Identifies specific strengths in their response — cite what they did well
2. Identifies areas for improvement — be specific and actionable
3. Provides a clinical note with best practice guidance
4. Assigns a score from 0-100 based on clinical accuracy, completeness, safety awareness, and critical thinking

Format your response as valid JSON:
{
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2", "improvement3"],
  "notes": "Clinical guidance note",
  "score": 85
}

Rules:
- Always provide at least 3 strengths and 3 improvements
- Be specific to the nurse's actual response, not generic
- Score should reflect: clinical accuracy (40%), completeness (30%), safety awareness (20%), critical thinking (10%)
- If the response is very brief or off-topic, score lower but still provide constructive feedback
- Use professional nursing terminology
- Include relevant evidence-based practice references when possible
- Consider Nigerian healthcare context when applicable`

export async function POST(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { scenarioType, userResponse, scenarioContext, simulationId, difficulty } = body as {
      scenarioType: string
      userResponse: string
      scenarioContext?: string
      simulationId?: string
      difficulty?: string
    }

    // Validate required fields
    if (!scenarioType || !userResponse || typeof userResponse !== 'string') {
      return NextResponse.json(
        { error: 'scenarioType and userResponse are required' },
        { status: 400 }
      )
    }

    if (userResponse.trim().length === 0) {
      return NextResponse.json(
        { error: 'User response cannot be empty' },
        { status: 400 }
      )
    }

    if (userResponse.length > 10000) {
      return NextResponse.json(
        { error: 'Response must be less than 10,000 characters' },
        { status: 400 }
      )
    }

    // Build the user message with context
    let userMessage = `Scenario Type: ${scenarioType}\nDifficulty: ${difficulty || 'Medium'}\n\n`
    if (scenarioContext) {
      userMessage += `Clinical Scenario:\n${scenarioContext}\n\n`
    }
    userMessage += `Nurse's Response:\n${userResponse.trim()}`

    let feedback: {
      strengths: string[]
      improvements: string[]
      notes: string
      score: number
    }
    let usedAI = false

    // Try AI feedback first
    try {
      const zai = await ZAI.create()
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
      })

      const aiContent = completion.choices?.[0]?.message?.content || ''

      // Try to parse the AI response as JSON
      try {
        const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, aiContent]
        const jsonStr = jsonMatch[1] || aiContent
        const parsed = JSON.parse(jsonStr.trim())

        if (
          Array.isArray(parsed.strengths) &&
          Array.isArray(parsed.improvements) &&
          typeof parsed.notes === 'string' &&
          typeof parsed.score === 'number'
        ) {
          feedback = {
            strengths: parsed.strengths.filter((s: unknown) => typeof s === 'string').slice(0, 5),
            improvements: parsed.improvements.filter((s: unknown) => typeof s === 'string').slice(0, 5),
            notes: parsed.notes,
            score: Math.min(Math.max(Math.round(parsed.score), 0), 100),
          }
          usedAI = true
        } else {
          throw new Error('Invalid feedback structure')
        }
      } catch {
        // AI response wasn't valid JSON — use fallback
        const template =
          FALLBACK_TEMPLATES[scenarioType] || FALLBACK_TEMPLATES.Default
        const baseScore = calculateBaseScore(userResponse, difficulty || 'Medium')
        feedback = {
          strengths: template.strengths,
          improvements: template.improvements,
          notes: template.notes,
          score: baseScore,
        }
      }
    } catch (aiError) {
      // AI is unavailable — fall back to templates
      console.error('AI feedback unavailable, using fallback:', aiError)
      const template =
        FALLBACK_TEMPLATES[scenarioType] || FALLBACK_TEMPLATES.Default
      const baseScore = calculateBaseScore(userResponse, difficulty || 'Medium')
      feedback = {
        strengths: template.strengths,
        improvements: template.improvements,
        notes: template.notes,
        score: baseScore,
      }
    }

    // Save simulation attempt to database if nurse profile and simulation ID are available
    if (authUser.nurseProfileId && simulationId) {
      try {
        await db.simulationAttempt.create({
          data: {
            simulationId,
            nurseId: authUser.nurseProfileId,
            completedAt: new Date(),
            score: feedback.score,
            maxScore: 100,
            actionsTaken: userResponse.trim(),
            aiEvaluation: usedAI ? 'AI-generated' : 'Template fallback',
            strengths: JSON.stringify(feedback.strengths),
            areasForImprovement: JSON.stringify(feedback.improvements),
          },
        })

        // Update simulation avg score and completion count
        const attempts = await db.simulationAttempt.findMany({
          where: { simulationId },
          select: { score: true },
        })
        const avgScore =
          attempts.length > 0
            ? attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length
            : 0
        await db.simulation.update({
          where: { id: simulationId },
          data: {
            completionCount: { increment: 1 },
            avgScore: Math.round(avgScore * 10) / 10,
          },
        })
      } catch (dbError) {
        // Don't fail the request if DB save fails
        console.error('Failed to save simulation attempt:', dbError)
      }
    }

    return NextResponse.json({
      feedback,
      usedAI,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Simulation feedback error:', error)
    return NextResponse.json(
      { error: 'Failed to generate simulation feedback' },
      { status: 500 }
    )
  }
}

// Calculate a base score from response characteristics (used for fallback only)
function calculateBaseScore(response: string, difficulty: string): number {
  let score = 60
  score += Math.min(response.length / 10, 15)
  const medicalTerms = [
    'assessment',
    'vital',
    'monitor',
    'intervene',
    'notify',
    'evaluate',
    'document',
    'communicate',
    'priority',
    'protocol',
  ]
  const usedTerms = medicalTerms.filter((term) =>
    response.toLowerCase().includes(term)
  )
  score += usedTerms.length * 2
  const difficultyModifier: Record<string, number> = {
    Easy: 5,
    Medium: 0,
    Hard: -5,
    Expert: -10,
  }
  score += difficultyModifier[difficulty] ?? 0
  return Math.min(Math.max(Math.round(score), 40), 98)
}
