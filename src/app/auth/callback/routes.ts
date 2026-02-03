// src/app/auth/callback/route.ts
// Callback route untuk handle OAuth redirects (Google, etc)

import { createClient } from '@/src/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    
    // Exchange code for session
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redirect to dashboard after successful OAuth
  return NextResponse.redirect(`${origin}/dashboard`)
}