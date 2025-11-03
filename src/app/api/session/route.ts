
import { cookies, headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// This ensures the route is not statically rendered and uses the Node.js runtime.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Creates a session by storing the user's ID token directly in a cookie.
 * This approach avoids server-side Firebase Admin SDK for session cookie creation,
 * which can be complex in some environments. The ID token itself is used by the
 * client-side Firebase SDK to authenticate with Firestore.
 */
export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ error: 'No ID token provided.' }, { status: 400 });
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days in milliseconds

    const hdrs = headers();
    const host = hdrs.get('x-forwarded-host') || hdrs.get('host') || '';
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');

    const options = {
      name: 'session',
      value: idToken, // Store the ID token directly
      maxAge: expiresIn / 1000, // maxAge is in seconds
      httpOnly: true,
      secure: !isLocal,
      sameSite: 'lax' as const,
      path: '/',
    };

    cookies().set(options);

    const res = NextResponse.json({ status: 'ok' });
    res.headers.set('Cache-Control', 'no-store, max-age=0');
    return res;

  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json({ error: 'Failed to create session.' }, { status: 500 });
  }
}

/**
 * Deletes the session cookie.
 */
export async function DELETE() {
  try {
    // Get the cookies object and then call .set() on it.
    const cookieStore = cookies();
    cookieStore.set('session', '', { path: '/', maxAge: 0 });
    return NextResponse.json({ status: 'signed-out' });
  } catch (error) {
    console.error('Session logout error:', error);
    return NextResponse.json({ error: 'Failed to sign out.' }, { status: 500 });
  }
}
