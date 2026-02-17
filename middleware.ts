import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only redirect the root path to splash
  if (pathname === '/') {
    const hasVisited = request.cookies.get('mtj-visited')
    if (!hasVisited) {
      const response = NextResponse.redirect(new URL('/splash', request.url))
      // Set cookie so we only show splash once per session
      response.cookies.set('mtj-visited', '1', { maxAge: 3600 }) // 1 hour
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/'],
}
