/**
 * POST /api/course-materials/upload
 *
 * Vercel Blob client upload handler.
 *
 * This route is called by the @vercel/blob/client `upload()` function on the client side.
 * It authenticates the user and generates a token that allows the client to upload
 * directly to Vercel Blob storage (bypassing Vercel's 4.5 MB serverless body limit).
 *
 * Required env var: BLOB_READ_WRITE_TOKEN (from Vercel → Storage → Blob → Create)
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleUpload } from '@vercel/blob/client'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

// Force dynamic — this route must never be cached or statically rendered
export const dynamic = 'force-dynamic'

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

    // ─── Check that Vercel Blob token is configured ───
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN
    if (!blobToken) {
      return NextResponse.json(
        {
          error: 'Vercel Blob storage is not configured. Steps: 1) Go to Vercel → Storage → Create Blob Store. 2) Connect it to your project. 3) Make sure BLOB_READ_WRITE_TOKEN is in your env vars. 4) Redeploy.',
          errorType: 'STORAGE_NOT_CONFIGURED',
          envCheck: {
            BLOB_READ_WRITE_TOKEN: 'missing',
            NODE_ENV: process.env.NODE_ENV || 'unknown',
          },
        },
        { status: 503 }
      )
    }

    // Log token presence (not the token itself) for debugging
    console.log('[Blob Upload] Token present, length:', blobToken.length, 'starts with:', blobToken.substring(0, 10) + '...')

    const body = await request.json()

    let jsonResponse
    try {
      jsonResponse = await handleUpload({
        body,
        request,
        onBeforeGenerateToken: async (pathname: string, clientPayload: any) => {
          return {
            allowedPayloadTypes: ['default'],
            tokenPayload: JSON.stringify({
              userId: authUser.id,
              facilityId: authUser.facilityId,
            }),
          }
        },
        onUploadCompleted: async ({ blob, tokenPayload }) => {
          console.log('[Blob Upload] Completed:', blob.url)
        },
      })
    } catch (uploadError: any) {
      console.error('[Blob Upload] handleUpload error:', uploadError)
      return NextResponse.json(
        {
          error: 'Vercel Blob handleUpload failed',
          details: uploadError.message || 'Unknown error',
          errorType: 'BLOB_HANDLE_UPLOAD_ERROR',
          tokenPresent: true,
          tokenLength: blobToken.length,
          suggestion: 'The BLOB_READ_WRITE_TOKEN exists but may be invalid or the Blob store is not connected to this project. Go to Vercel → your project → Storage tab → make sure the Blob store is connected.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(jsonResponse)
  } catch (error: any) {
    console.error('[Blob Upload] Route error:', error)
    return NextResponse.json(
      { error: 'Failed to handle upload', details: error.message },
      { status: 500 }
    )
  }
}

// Also support GET for debugging — shows if the token is configured
export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request)
  if (!authUser) return unauthorizedResponse()

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN
  return NextResponse.json({
    configured: !!blobToken,
    tokenLength: blobToken?.length || 0,
    tokenPrefix: blobToken ? blobToken.substring(0, 15) + '...' : null,
    env: process.env.NODE_ENV,
    message: blobToken
      ? 'BLOB_READ_WRITE_TOKEN is configured. Large file uploads should work.'
      : 'BLOB_READ_WRITE_TOKEN is NOT set. Go to Vercel → Storage → Create Blob Store → connect to project → redeploy.',
  })
}
