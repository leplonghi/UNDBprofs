'use client';

import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function LoginPage() {
  const logo = PlaceHolderImages.find((img) => img.id === 'undb-logo');

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          {logo && (
            <div className="mb-4 flex justify-center">
              <Image
                src={logo.imageUrl}
                alt={logo.description}
                width={150}
                height={40}
                className="object-contain"
              />
            </div>
          )}
          <CardTitle className="text-2xl font-bold tracking-tight text-primary">
            Bem-vindo!
          </CardTitle>
          <CardDescription>Simplifique sua rotina acadêmica.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <Button asChild className="w-full" size="lg">
              <Link href="/dashboard">
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
                Entrar com Google
              </Link>
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
