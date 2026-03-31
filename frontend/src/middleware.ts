/**
 * IAAA · Bloc 6A · Next.js Middleware
 *
 * UX route protection only.
 * Checks presence of access_token cookie — does NOT validate JWT.
 * Backend is the source of truth for authentication and authorization.
 *
 * Protected routes (Bloc 6A):
 *   /dashboard
 *   /settings
 *
 * NOT protected here (Bloc 6A):
 *   /sc/[slug]/map   — public/private card logic belongs to Bloc 6B+
 *
 * Redirect rules:
 *   unauthenticated → /dashboard   → /login?from=/dashboard
 *   authenticated   → /login       → /dashboard (already logged in)
 *   authenticated   → /register    → /dashboard
 */

import { NextRequest, NextResponse } from 'next/server'

const ACCESS_COOKIE = 'access_token'

const PROTECTED_PATHS = ['/dashboard', '/settings', '/admin']
const AUTH_PATHS      = ['/login', '/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasToken     = request.cookies.has(ACCESS_COOKIE)

  // Protected route — no token → redirect to login
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p))
  if (isProtected && !hasToken) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  // Auth page — already logged in → redirect to dashboard
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p))
  if (isAuthPage && hasToken) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/settings/:path*',
    '/admin/:path*',
    '/login',
    '/register',
  ],
}
