import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSession } from "@auth0/nextjs-auth0/edge"

export async function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname
  
  // Define paths that require authentication
  const protectedPaths = ['/exercise', '/vocabulary']
  
  // Check if the path is protected
  const isProtectedPath = protectedPaths.some(protectedPath => 
    path === protectedPath || path.startsWith(`${protectedPath}/`)
  )
  
  if (isProtectedPath) {
    // Get the session
    const session = await getSession(request, NextResponse.next())
    
    // If there's no session, redirect to the login page
    if (!session) {
      const loginUrl = new URL('/api/auth/login', request.url)
      loginUrl.searchParams.set('returnTo', path)
      return NextResponse.redirect(loginUrl)
    }
  }
  
  // Continue with the request
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
}

