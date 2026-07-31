import { NextResponse } from 'next/server'

/**
 * Serves the Google Search Console HTML verification file content.
 * 
 * The actual static file lives in public/google0ce4def6136e5762.html,
 * but Vercel's edge may not serve .html files from public/ reliably.
 * This route + a rewrite in next.config.ts ensures the exact URL
 * Google expects always returns the correct content with HTTP 200.
 */
export async function GET() {
  return new NextResponse(
    'google-site-verification: google0ce4def6136e5762.html',
    {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    }
  )
}