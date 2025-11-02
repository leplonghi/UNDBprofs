'use client';

import { useUser } from '@/firebase';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const PROTECTED_ROUTES = ['/dashboard', '/disciplinas', '/documentos', '/calendario', '/perfil'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

  useEffect(() => {
    // Se não estamos carregando e não há usuário, redirecione para o login
    if (!isUserLoading && !user && isProtectedRoute) {
        const from = pathname + (params.toString() ? `?${params.toString()}` : '');
        router.replace(`/?from=${encodeURIComponent(from)}`);
    }
  }, [isUserLoading, user, router, pathname, params, isProtectedRoute]);

  // Enquanto carrega, mostre um loader de tela cheia
  if (isUserLoading && isProtectedRoute) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se não for uma rota protegida ou se o usuário estiver logado, renderize o conteúdo
  if (!isProtectedRoute || user) {
     return <>{children}</>;
  }

  // Se chegou aqui, significa que está tentando acessar uma rota protegida sem estar logado
  // e o useEffect ainda não redirecionou, então não renderizamos nada para evitar flash de conteúdo.
  return null;
}
