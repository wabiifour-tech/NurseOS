import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

// GET /api/nurseacademy/modules/[moduleId]/content - Get module content for learning
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  try {
    const { moduleId } = await params

    const module = await db.courseModule.findUnique({
      where: { id: moduleId },
      include: {
        course: {
          include: {
            enrollments: {
              where: { nurseId: authUser.nurseProfileId || undefined },
              take: 1,
            },
          },
        },
      },
    })

    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    // Check enrollment
    const enrollment = module.course.enrollments[0]
    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 })
    }

    const contentType = module.contentType.toUpperCase()

    // Build content based on type
    let content: Record<string, unknown> = {
      moduleId: module.id,
      title: module.title,
      description: module.description,
      contentType: module.contentType,
      durationMinutes: module.durationMinutes,
      order: module.order,
    }

    if (contentType === 'VIDEO') {
      content.videoUrl = module.videoUrl || null
      content.contentBody = module.contentBody || null
    } else if (contentType === 'QUIZ') {
      // Generate quiz questions from contentBody or default questions based on the module/course topic
      let questions: Array<{
        id: string
        question: string
        options: string[]
        correctIndex: number
        explanation: string
      }> = []

      if (module.contentBody) {
        try {
          const parsed = JSON.parse(module.contentBody)
          if (Array.isArray(parsed)) {
            questions = parsed
          } else if (parsed.questions && Array.isArray(parsed.questions)) {
            questions = parsed.questions
          }
        } catch {
          // contentBody is plain text, generate questions from it
        }
      }

      // If no questions in contentBody, generate default questions based on module title
      if (questions.length === 0) {
        questions = generateDefaultQuizQuestions(module.title, module.course.title, module.course.category)
      }

      content.questions = questions
      content.passingScore = 70
    } else if (contentType === 'TEXT' || contentType === 'READING') {
      content.readingContent = module.contentBody || `# ${module.title}\n\n${module.description}\n\nThis module covers key concepts related to ${module.course.category}. Please review the material carefully and take notes on the important points.\n\n## Key Learning Objectives\n\n- Understand the fundamental principles of ${module.title.toLowerCase()}\n- Apply knowledge to clinical scenarios\n- Evaluate best practices in ${module.course.category.toLowerCase()}\n\n## Overview\n\nThis module provides a comprehensive overview of ${module.title.toLowerCase()} within the context of ${module.course.title}. As you study this material, focus on understanding both the theoretical foundations and their practical applications in nursing care.\n\n## Core Concepts\n\nThe material in this section covers essential knowledge that every nurse should understand. Key areas include patient assessment, evidence-based interventions, and documentation standards.\n\n## Clinical Application\n\nConsider how the concepts in this module apply to your daily practice. Think about patient scenarios you have encountered and how this knowledge could improve outcomes.\n\n## Summary\n\nReview the key points covered in this module and ensure you can articulate the main concepts before proceeding to the next section.`
    }

    return NextResponse.json({ content })
  } catch (error) {
    console.error('Error fetching module content:', error)
    return NextResponse.json({ error: 'Failed to fetch module content' }, { status: 500 })
  }
}

function generateDefaultQuizQuestions(
  moduleTitle: string,
  courseTitle: string,
  category: string
): Array<{
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}> {
  return [
    {
      id: 'q1',
      question: `What is the primary focus of the module "${moduleTitle}" within ${courseTitle}?`,
      options: [
        'Understanding the core principles and clinical applications',
        'Memorizing drug dosages and interactions',
        'Administrative procedures and documentation',
        'Surgical technique and instrumentation'
      ],
      correctIndex: 0,
      explanation: `This module focuses on understanding the core principles of ${moduleTitle.toLowerCase()} and how they apply clinically within ${courseTitle}.`
    },
    {
      id: 'q2',
      question: `In the context of ${category}, which approach is most evidence-based?`,
      options: [
        'Following traditional practices without question',
        'Using the latest research findings to guide clinical decisions',
        'Relying solely on personal experience',
        'Deferring all decisions to senior staff'
      ],
      correctIndex: 1,
      explanation: 'Evidence-based practice involves integrating the best available research with clinical expertise and patient values.'
    },
    {
      id: 'q3',
      question: `When applying concepts from "${moduleTitle}", what should a nurse prioritize?`,
      options: [
        'Speed of task completion',
        'Patient safety and quality of care',
        'Documentation over direct care',
        'Following orders without assessment'
      ],
      correctIndex: 1,
      explanation: 'Patient safety and quality of care should always be the top priority when applying any nursing knowledge.'
    },
    {
      id: 'q4',
      question: `How does continuous professional development in ${category} benefit nursing practice?`,
      options: [
        'It is only required for career advancement',
        'It has no impact on patient outcomes',
        'It ensures nurses stay current with best practices and improves patient outcomes',
        'It is only necessary for specialized nurses'
      ],
      correctIndex: 2,
      explanation: 'Continuous professional development ensures nurses maintain competency and stay updated with evolving best practices, directly improving patient outcomes.'
    },
    {
      id: 'q5',
      question: `Which of the following best demonstrates understanding of ${moduleTitle.toLowerCase()}?`,
      options: [
        'Reciting definitions from memory',
        'Applying concepts to real patient scenarios effectively',
        'Passing written examinations',
        'Attending all training sessions'
      ],
      correctIndex: 1,
      explanation: 'True understanding is demonstrated by the ability to apply concepts effectively in real clinical scenarios.'
    }
  ]
}
