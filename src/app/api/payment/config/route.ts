import { NextResponse } from 'next/server'

// GET /api/payment/config — Check if Paystack is configured
export async function GET() {
  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY

  return NextResponse.json({
    configured: !!paystackSecretKey,
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || null,
  })
}
