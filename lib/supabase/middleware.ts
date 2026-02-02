import { NextResponse, type NextRequest } from 'next/server'

// DEMO MODE: No authentication required - always allow access
export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request })

  // Redirect login page to dashboard (no login needed in demo mode)
  const isAuthPage = request.nextUrl.pathname.startsWith('/login')
  if (isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Redirect root to dashboard
  if (request.nextUrl.pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

