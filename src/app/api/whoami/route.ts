import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getApps, initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from '@/firebase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function GET() {
  initAdmin();

  try {
    const session = cookies().get('session')?.value;
    if (!session) return NextResponse.json({ ok: false, why: 'no-cookie' }, { status: 401 });

    const decoded = await getAuth().verifySessionCookie(session, true);
    return NextResponse.json({ ok: true, uid: decoded.uid, email: decoded.email });
  } catch (e) {
    return NextResponse.json({ ok: false, why: 'invalid-cookie' }, { status: 401 });
  }
}
