import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Protect all dashboard routes — redirect to login if no refresh token cookie
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isDashboardRoute =
    pathname.startsWith('/dashboard') || pathname.startsWith('/ideas')
  const refreshToken = request.cookies.get('refresh_token')

  if (isDashboardRoute && !refreshToken) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return NextResponse.next()
}

export const config = { matcher: ['/dashboard/:path*', '/ideas/:path*'] }
