// src/app/login/page.tsx
import { Suspense } from 'react';
import LoginClient from './LoginClient';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default function LoginPage({ searchParams }: PageProps) {
  const fromParam = searchParams?.from;
  const from =
    typeof fromParam === 'string' && fromParam.length > 0
      ? fromParam
      : '/dashboard';

  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <p>Carregando…</p>
        </main>
      }
    >
      <LoginClient initialFrom={from} />
    </Suspense>
  );
}
