'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/firebase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/firebase';

const provider = new GoogleAuthProvider();

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { user, isUserLoading } = useUser();

  // Redirect if user is already logged in
  useEffect(() => {
    if (!isUserLoading && user) {
      const from = params.get('from') || '/dashboard';
      router.replace(from);
    }
  }, [user, isUserLoading, router, params]);

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const credential = await signInWithPopup(auth, provider);
      const idToken = await credential.user.getIdToken(true);

      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error('Falha ao criar a sessão.');
      }
      
      const from = params.get('from') || '/dashboard';
      router.replace(from);

    } catch (error) {
      console.error("Authentication error:", error);
      toast({
        variant: 'destructive',
        title: 'Erro na Autenticação',
        description: 'Não foi possível fazer o login. Tente novamente.',
      });
      setIsLoggingIn(false);
    }
  };
  
  if (isUserLoading || user) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <Image
                src="https://firebasestorage.googleapis.com/v0/b/studio-3759592126-ec313.appspot.com/o/Branding%2Fpublic%2Flogoundbprofs.png?alt=media"
                alt="UNDB Profs Logo"
                width={160}
                height={48}
                className="h-8 w-auto"
                unoptimized
                priority
              />
            </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-primary">
            Bem-vindo!
          </CardTitle>
          <CardDescription>Simplifique sua rotina acadêmica.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <Button onClick={handleSignIn} className="w-full" size="lg" disabled={isLoggingIn}>
              {isLoggingIn ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg
                  className="mr-2 h-4 w-4"
                  aria-hidden="true"
                  focusable="false"
                  data-prefix="fab"
                  data-icon="google"
                  role="img"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 488 512"
                >
                  <path
                    fill="currentColor"
                    d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-69.7 69.7C322.4 105.5 288.2 92 248 92c-88.8 0-160.1 72.3-160.1 161.5s71.3 161.5 160.1 161.5c97.1 0 134.1-65.4 140.1-99.9H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"
                  ></path>
                </svg>
              )}
              {isLoggingIn ? 'Entrando...' : 'Entrar com Google'}
            </Button>
            <p className="px-8 text-center text-sm text-muted-foreground">
              Ao continuar, você concorda com nossos{' '}
              <Link href="#" className="underline underline-offset-4 hover:text-primary">
                Termos de Serviço
              </Link>{' '}
              e{' '}
              <Link href="#" className="underline underline-offset-4 hover:text-primary">
                Política de Privacidade
              </Link>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
