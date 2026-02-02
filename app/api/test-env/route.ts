import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Expose only non-secret config for debugging (no passwords)
  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_HOST: process.env.DATABASE_HOST ?? '(not set)',
    DATABASE_PORT: process.env.DATABASE_PORT ?? '(not set)',
    DATABASE_NAME: process.env.DATABASE_NAME ?? '(not set)',
    hasDatabasePassword: !!process.env.DATABASE_PASSWORD,
    hasGroqApiKey: !!process.env.GROQ_API_KEY,
  });
}
