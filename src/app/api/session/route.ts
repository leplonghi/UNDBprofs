import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from '@/firebase/admin';

// This ensures the route is not statically rendered
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  initAdmin(); // Initialize lazily

  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ error: 'No ID token provided.' }, { status: 400 });
    }

    const auth = getAuth();
    // Set session expiration to 5 days.
    const expiresIn = 60 * 60 * 24 * 5 * 1000;

    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
    const options = {
      name: 'session',
      value: sessionCookie,
      maxAge: expiresIn / 1000, // maxAge is in seconds
      httpOnly: true,
      secure: true, // Use secure cookies in production
      sameSite: 'lax' as const,
      path: '/',
    };

    cookies().set(options);

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Session login error:', error);
    return NextResponse.json({ error: 'Failed to create session.' }, { status: 401 });
  }
}

export async function DELETE() {
  try {
    // Clear the session cookie.
    cookies().set('session', '', { path: '/', maxAge: 0 });
    return NextResponse.json({ status: 'signed-out' });
  } catch (error) {
    console.error('Session logout error:', error);
    return NextResponse.json({ error: 'Failed to sign out.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  initAdmin(); // Initialize lazily

  const session = cookies().get('session')?.value;
  if (!session) {
    return NextResponse.json({ isAuthenticated: false }, { status: 200 });
  }

  try {
      const auth = getAuth();
      const decodedClaims = await auth.verifySessionCookie(session, true);
      return NextResponse.json({ isAuthenticated: true, user: decodedClaims }, { status: 200 });
  } catch (error) {
      // Session cookie is invalid or expired.
      return NextResponse.json({ isAuthenticated: false }, { status: 200 });
  }
}
