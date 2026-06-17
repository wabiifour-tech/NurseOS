/**
 * POST /api/course-materials/presign
 *
 * Returns a presigned S3/R2 URL that the client uses to upload a file directly to object storage.
 * This bypasses Vercel's 4.5 MB serverless body limit — files up to 5 GB are supported.
 *
 * Required env vars (set in Vercel → Settings → Environment Variables):
 *   S3_ENDPOINT          — e.g. https://xxx.r2.cloudflarestorage.com (R2) or https://s3.us-east-1.amazonaws.com (AWS)
 *   S3_REGION            — e.g. auto (R2) or us-east-1 (AWS)
 *   S3_BUCKET            — bucket name
 *   S3_ACCESS_KEY_ID     — access key
 *   S3_SECRET_ACCESS_KEY — secret key
 *
 * Body:
 *   {
 *     fileName: string,
 *     fileType: string,    // MIME type
 *     fileSize: number,    // bytes (max 5 GB = 5 * 1024 * 1024 * 1024)
 *   }
 *
 * Returns:
 *   {
 *     uploadUrl: string,   // presigned PUT URL — client uploads file here via HTTP PUT
 *     fileUrl: string,     // public URL where the file will be accessible after upload
 *     key: string,         // S3 object key (also stored in DB)
 *   }
 */

import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { randomUUID } from 'crypto'

const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024 // 5 GB (S3 single-PUT limit)

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request)
    if (!authUser) return unauthorizedResponse()

    // Only LECTURER or institution ADMIN can request presigned URLs
    if (authUser.academicRole !== 'LECTURER' && authUser.role !== 'ADMIN' && authUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only lecturers or institution admins can upload materials' },
        { status: 403 }
      )
    }

    // Check that S3 env vars are configured
    const endpoint = process.env.S3_ENDPOINT
    const region = process.env.S3_REGION || 'auto'
    const bucket = process.env.S3_BUCKET
    const accessKeyId = process.env.S3_ACCESS_KEY_ID
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY

    if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
      return NextResponse.json(
        {
          error: 'Object storage is not configured. The administrator must set S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY environment variables.',
          errorType: 'STORAGE_NOT_CONFIGURED',
        },
        { status: 503 }
      )
    }

    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { fileName, fileType, fileSize } = body
    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: 'fileName and fileType are required' },
        { status: 400 }
      )
    }
    if (fileSize && fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is 5 GB.` },
        { status: 400 }
      )
    }

    // Generate a unique S3 key — materials/<facilityId>/<uuid>/<filename>
    const safeFileName = String(fileName).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100)
    const key = `materials/${authUser.facilityId || 'unknown'}/${randomUUID()}/${safeFileName}`

    // Create S3 client (works for both AWS S3 and Cloudflare R2)
    const s3Client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      // For R2, force path-style addressing
      forcePathStyle: endpoint.includes('r2.cloudflarestorage.com'),
    })

    // Generate presigned URL (valid for 10 minutes)
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: fileType,
      ContentLength: fileSize || undefined,
    })
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 })

    // The public URL where the file will be accessible after upload.
    // For R2 public buckets: https://<bucket>.<account-id>.r2.dev/<key>
    // For AWS S3 public buckets: https://<bucket>.s3.<region>.amazonaws.com/<key>
    // We construct it from the endpoint + bucket + key.
    let fileUrl: string
    if (endpoint.includes('r2.cloudflarestorage.com')) {
      // R2 — use the public dev URL pattern (user must configure a custom domain or r2.dev subdomain)
      // For now, construct from endpoint with path-style
      fileUrl = `${endpoint}/${bucket}/${key}`
    } else {
      // AWS S3
      fileUrl = `${endpoint.replace('https://s3.', 'https://')}/${bucket}/${key}`
    }

    return NextResponse.json({
      uploadUrl,
      fileUrl,
      key,
    })
  } catch (error: any) {
    console.error('Presign URL error:', error)
    return NextResponse.json(
      { error: 'Failed to generate upload URL', details: error.message },
      { status: 500 }
    )
  }
}
