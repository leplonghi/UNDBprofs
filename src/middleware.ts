import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from '@/firebase/admin';

// Initialize the Firebase Admin SDK.
initAdmin();

// Define the private routes that require authentication.
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
  
  // Check if the requested path is one of the protected routes.
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Check for the session cookie.
  const session = req.cookies.get('session')?.value;
  if (!session) {
    const loginUrl = new URL('/', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify the session cookie with Firebase Admin SDK.
  try {
    const auth = getAuth();
    await auth.verifySessionCookie(session, true);
    // Session is valid, allow the request to proceed.
    return NextResponse.next();
  } catch (error) {
    // Session cookie is invalid. Redirect to login page.
    console.warn('Session cookie verification failed:', error);
    const loginUrl = new URL('/', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  // Match all request paths except for those starting with known static assets.
  matcher: ['/((?!_next/static|favicon.ico).*)'],
};
