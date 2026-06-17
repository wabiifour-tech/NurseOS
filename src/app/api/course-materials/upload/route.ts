/**
 * POST /api/course-materials/upload
 *
 * Vercel Blob client upload handler.
 *
 * This route is called by the @vercel/blob/client `upload()` function on the client side.
 * It authenticates the user and generates a token that allows the client to upload
 * directly to Vercel Blob storage (bypassing Vercel's 4.5 MB serverless body limit).
 *
 * The actual file bytes NEVER go through this route — they go directly from the
 * browser to Vercel Blob's servers. This route only handles auth + token generation.
 *
 * Required env var: BLOB_READ_WRITE_TOKEN (from Vercel → Storage → Blob → Create)
 *
 * After the client-side upload completes, the client sends the resulting blob URL
 * to /api/course-materials (POST) to create the material record with fileUrl.
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleUpload } from '@vercel/blob/client'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request)
    if (!authUser) return unauthorizedResponse()

    // Only LECTURER or institution ADMIN can upload
    if (authUser.academicRole !== 'LECTURER' && authUser.role !== 'ADMIN' && authUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only lecturers or institution admins can upload materials' },
        { status: 403 }
      )
    }

    // Check that Vercel Blob token is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        {
          error: 'Vercel Blob storage is not configured. The administrator must enable Vercel Blob and set BLOB_READ_WRITE_TOKEN.',
          errorType: 'STORAGE_NOT_CONFIGURED',
        },
        { status: 503 }
      )
    }

    const body = await request.json()

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname: string, clientPayload: any) => {
        // Auth is already verified above — just return allowed payload types
        return {
          allowedPayloadTypes: ['default'],
          // Store metadata for the onUploadCompleted callback
          tokenPayload: JSON.stringify({
            userId: authUser.id,
            facilityId: authUser.facilityId,
          }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This callback runs after the upload is complete (may run on a different serverless instance)
        // We don't need to do anything here — the client will send the blob URL to /api/course-materials
        console.log('[Blob Upload] Completed:', blob.url)
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error: any) {
    console.error('Blob upload handler error:', error)
    return NextResponse.json(
      { error: 'Failed to handle upload', details: error.message },
      { status: 500 }
    )
  }
}
