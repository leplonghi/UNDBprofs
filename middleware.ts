
import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_ROUTES = ['/dashboard', '/disciplinas', '/documentos', '/calendario', '/perfil', '/feedback', '/ajuda'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Let static files, API routes, and the login page pass through.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/login' // Allow access to the new login page
  ) {
    return NextResponse.next();
  }

  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Check for the presence of the session cookie. The token within will be
  // validated by Firestore security rules on the client side.
  const sessionCookie = req.cookies.get('session');

  if (!sessionCookie) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Match all request paths except for those starting with known static assets.
  matcher: ['/((?!_next/static|favicon.ico).*)'],
};
