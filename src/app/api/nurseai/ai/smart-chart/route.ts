import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse, requireFacility, crossFacilityDeniedResponse } from '@/lib/auth'

// System prompts for different note types
const SYSTEM_PROMPTS: Record<string, string> = {
  SOAP: `You are a nursing documentation AI assistant specializing in SOAP notes. 
Given a nurse's free-text input about a patient encounter, generate a structured SOAP note with:
- Subjective: Patient's reported symptoms, concerns, and statements
- Objective: Measurable/findings data including vitals, physical exam findings
- Assessment: Nursing diagnosis and clinical interpretation
- Plan: Interventions, follow-up, and patient education

Always use professional medical terminology. Include relevant Nigerian healthcare context when applicable.
Format your response as valid JSON with keys: subjective, objective, assessment, plan, confidenceScore (0-1).`,

  SBAR: `You are a nursing documentation AI assistant specializing in SBAR communication.
Given a nurse's free-text input about a patient situation, generate a structured SBAR note with:
- Situation: Brief statement of the problem/reason for communication
- Background: Relevant patient history and context
- Assessment: Your clinical assessment of the situation
- Recommendation: What you need/recommend

Always use professional medical terminology. Include relevant Nigerian healthcare context when applicable.
Format your response as valid JSON with keys: situation, background, assessment, recommendation, confidenceScore (0-1).`,

  NARRATIVE: `You are a nursing documentation AI assistant specializing in narrative nursing notes.
Given a nurse's free-text input about a patient encounter, generate a comprehensive narrative note that:
- Tells the clinical story in a chronological flow
- Includes relevant patient data, assessments, and interventions
- Maintains professional nursing documentation standards
- Is organized and easy to follow

Always use professional medical terminology. Include relevant Nigerian healthcare context when applicable.
Format your response as valid JSON with keys: narrative, keyFindings (array of strings), actionItems (array of strings), confidenceScore (0-1).`,

  FLOW: `You are a nursing documentation AI assistant specializing in flow sheet documentation.
Given a nurse's free-text input, extract and structure the data into flow sheet format with:
- Vital signs and measurements
- Intake and output data
- Assessment findings
- Interventions performed

Format your response as valid JSON with keys: vitals (object), intakeOutput (object), assessments (array), interventions (array), confidenceScore (0-1).`,
}

export async function POST(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  // 🔒 FACILITY ISOLATION: Require a facility assignment to use AI charting
  const facilityId = requireFacility(authUser)
  if (facilityId instanceof Response) return facilityId

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const { text, noteType = 'SOAP', patientContext, recordId } = body

    // Validate required fields
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text input is required' },
        { status: 400 }
      )
    }

    if (text.length > 10000) {
      return NextResponse.json(
        { error: 'Text input must be less than 10,000 characters' },
        { status: 400 }
      )
    }

    // Validate note type
    const validNoteTypes = ['SOAP', 'SBAR', 'NARRATIVE', 'FLOW']
    const normalizedNoteType = noteType.toUpperCase()
    if (!validNoteTypes.includes(normalizedNoteType)) {
      return NextResponse.json(
        { error: `Invalid note type. Must be one of: ${validNoteTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Build the user message with context
    let userMessage = `Nurse's input: "${text.trim()}"`

    if (patientContext) {
      userMessage += `\n\nPatient Context: ${typeof patientContext === 'string' ? patientContext : JSON.stringify(patientContext)}`
    }

    // Get the system prompt for this note type
    const systemPrompt = SYSTEM_PROMPTS[normalizedNoteType] || SYSTEM_PROMPTS.SOAP

    // Call the LLM via z-ai-web-dev-sdk
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    })

    // Extract the AI response
    const aiContent = completion.choices?.[0]?.message?.content || ''

    // Try to parse the AI response as JSON
    let structuredNote: Record<string, unknown>
    let wasParsedFromRaw = false
    try {
      // Try to extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, aiContent]
      const jsonStr = jsonMatch[1] || aiContent
      structuredNote = JSON.parse(jsonStr.trim())
    } catch {
      // If parsing fails, restructure the raw content into a proper format
      // based on the note type, so the frontend always receives valid structured data
      wasParsedFromRaw = true
      const rawText = aiContent.trim()

      switch (normalizedNoteType) {
        case 'SOAP':
          structuredNote = {
            subjective: rawText,
            objective: '',
            assessment: '',
            plan: '',
          }
          break
        case 'SBAR':
          structuredNote = {
            situation: rawText,
            background: '',
            assessment: '',
            recommendation: '',
          }
          break
        case 'NARRATIVE':
          structuredNote = {
            narrative: rawText,
            keyFindings: [],
            actionItems: [],
          }
          break
        case 'FLOW':
          structuredNote = {
            vitals: {},
            intakeOutput: {},
            assessments: [rawText],
            interventions: [],
          }
          break
        default:
          structuredNote = {
            content: rawText,
          }
      }
    }

    // Calculate confidence score — lower for fallback-structured responses
    const confidenceScore = typeof structuredNote.confidenceScore === 'number'
      ? Math.min(1, Math.max(0, structuredNote.confidenceScore))
      : wasParsedFromRaw ? 0.5 : 0.7

    // Save the AI interaction to the database if recordId is provided
    if (authUser.nurseProfileId && recordId) {
      try {
        // 🔒 FACILITY ISOLATION: Verify the medical record belongs to the nurse's facility
        const medicalRecord = await db.medicalRecord.findUnique({
          where: { id: recordId },
          select: { facilityId: true },
        })
        if (!medicalRecord) {
          return NextResponse.json(
            { error: 'Medical record not found' },
            { status: 404 }
          )
        }
        if (medicalRecord.facilityId !== facilityId) {
          return crossFacilityDeniedResponse()
        }

        await db.aIInteraction.create({
          data: {
            recordId,
            nurseId: authUser.nurseProfileId,
            interactionType: `SMART_CHART_${normalizedNoteType}`,
            userInput: text.trim(),
            aiOutput: JSON.stringify(structuredNote),
            aiModel: 'z-ai-llm',
            confidenceScore,
            responseTimeMs: null,
          },
        })
      } catch (dbError) {
        // Don't fail the request if DB logging fails
        console.error('Failed to log AI interaction:', dbError)
      }
    }

    return NextResponse.json({
      noteType: normalizedNoteType,
      structuredNote,
      confidenceScore,
      metadata: {
        inputLength: text.length,
        generatedAt: new Date().toISOString(),
        aiModel: 'z-ai-llm',
      },
    })
  } catch (error) {
    console.error('Smart Chart AI error:', error)

    // Check if it's an AI SDK error
    if (error instanceof Error && error.message.includes('z-ai')) {
      return NextResponse.json(
        { error: 'AI service is currently unavailable. Please try again later.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate smart chart note' },
      { status: 500 }
    )
  }
}
