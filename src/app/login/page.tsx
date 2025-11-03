
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup, AuthError } from 'firebase/auth';
import { auth } from '@/firebase/client';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

const provider = new GoogleAuthProvider();

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [busy, setBusy] = useState(false);

  const doLogin = async () => {
    setBusy(true);
    try {
      const cred = await signInWithPopup(auth, provider);
      const idToken = await cred.user.getIdToken(true);

      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
          const errorBody = await res.json();
          throw new Error(errorBody.error || 'session failed');
      }

      const from = params.get('from') || '/dashboard';
      router.replace(from);
    } catch (e) {
      // Handle popup closed by user gracefully
      if ((e as AuthError).code !== 'auth/popup-closed-by-user') {
        console.error(e);
      }
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-8 text-center">
        <Image
          src="https://firebasestorage.googleapis.com/v0/b/studio-3759592126-ec313.appspot.com/o/Branding%2Fpublic%2Flogoundbprofs.png?alt=media&v=1"
          alt="UNDBprof Logo"
          width={320}
          height={96}
          className="h-auto w-full max-w-[280px]"
          unoptimized
          priority
        />
        <div>
          <h1 className="text-2xl font-bold text-primary">Bem-vindo ao ProfAssist</h1>
          <p className="mt-2 text-muted-foreground">Seu assistente digital para o dia a dia acadêmico.</p>
        </div>
        <Button onClick={doLogin} disabled={busy} size="lg" className="w-full">
          {busy ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : null}
          {busy ? 'Entrando…' : 'Entrar com Google'}
        </Button>
      </div>
    </main>
  );
}
