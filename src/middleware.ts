import { NextRequest, NextResponse } from 'next/server';

// IMPORTANT: This export forces the middleware to run on the Node.js runtime.
// This is required for the Firebase Admin SDK to work.
export const runtime = 'nodejs';

const PROTECTED_ROUTES = ['/dashboard', '/disciplinas', '/documentos', '/calendario', '/perfil'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Let static files, API routes, and the login page pass through.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/' // This is the login page
  ) {
    return NextResponse.next();
  }

  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Check for the session cookie existence.
  // The actual verification will happen on the server when data is requested
  // or via an API call, but not in the middleware to keep it fast.
  const sessionCookie = req.cookies.get('session');

  if (!sessionCookie) {
    const loginUrl = new URL('/', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Allow the request to proceed. The server-side components/API routes
  // will be responsible for validating the cookie if they need to fetch protected data.
  return NextResponse.next();
}

export const config = {
  // Match all request paths except for those starting with known static assets.
  matcher: ['/((?!_next/static|favicon.ico).*)'],
};
