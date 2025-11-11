'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  GoogleAuthProvider,
  signInWithPopup,
  AuthError,
} from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { AppLogo } from '@/components/layout/AppLogo';
import { useAuth } from '@/firebase';

const provider = new GoogleAuthProvider();

type LoginClientProps = {
  initialFrom: string;
};

export default function LoginClient({ initialFrom }: LoginClientProps) {
  const router = useRouter();
  const auth = useAuth();
  const [busy, setBusy] = useState(false);

  const doLogin = async () => {
    if (!auth) {
        console.error("Firebase Auth not initialized yet.");
        setBusy(false);
        return;
    }
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
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.error || 'session failed');
      }

      const from = initialFrom || '/dashboard';
      router.replace(from);
    } catch (e) {
      if ((e as AuthError).code !== 'auth/popup-closed-by-user') {
        console.error(e);
      }
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 animated-gradient-background">
      <div className="w-full max-w-md rounded-xl border bg-background/80 p-8 shadow-2xl backdrop-blur-lg">
        <div className="flex w-full flex-col items-center gap-8 text-center">
            <AppLogo />

            <div>
            <h1 className="text-2xl font-bold text-primary">
                Bem-vindo ao UNDBProf!
            </h1>
            <p className="mt-2 text-muted-foreground">
                Seu assistente para organizar a rotina docente e colaborar com colegas.
                O acesso é exclusivo para contas @undb.edu.br.
            </p>
            </div>

            <Button
            onClick={doLogin}
            disabled={busy || !auth}
            size="lg"
            className="w-full"
            >
            {busy ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : null}
            {busy ? 'Entrando…' : 'Entrar com Google'}
            </Button>
        </div>
      </div>
    </main>
  );
}
