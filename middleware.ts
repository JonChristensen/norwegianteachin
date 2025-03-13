import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Make sure Auth0 routes are not blocked
  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Define public paths that don't require authentication
  const publicPaths = ["/api/auth/login", "/api/auth/callback", "/api/auth/logout", "/"]
  const isPublicPath = publicPaths.some((path) => 
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path)
  )

  // Check for auth cookie instead of using getSession
  const authCookie = request.cookies.get("appSession")
  const isAuthenticated = !!authCookie

  // Redirect logic
  if (!isAuthenticated && !isPublicPath && !request.nextUrl.pathname.startsWith("/api/")) {
    // Redirect unauthenticated users to Auth0 login
    return NextResponse.redirect(new URL("/api/auth/login", request.url))
  }

  return NextResponse.next()
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/auth routes (Auth0 routes)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}

