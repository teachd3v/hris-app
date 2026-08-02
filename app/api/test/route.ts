import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    googleId: typeof process.env.GOOGLE_CLIENT_ID,
    googleSecret: typeof process.env.GOOGLE_CLIENT_SECRET,
    authSecret: typeof process.env.AUTH_SECRET,
    authTrustHost: typeof process.env.AUTH_TRUST_HOST,
    envKeys: Object.keys(process.env).filter(k => k.includes('GOOGLE') || k.includes('AUTH'))
  });
}
