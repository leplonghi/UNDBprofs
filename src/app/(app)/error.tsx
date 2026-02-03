'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('App Error:', error);
    }, [error]);

    return (
        <div className="flex h-full min-h-[calc(100vh-4rem)] items-center justify-center p-4">
            <Card className="max-w-md w-full border-destructive/20 shadow-lg animate-in fade-in zoom-in duration-300">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                        <AlertTriangle className="h-6 w-6 text-destructive" />
                    </div>
                    <CardTitle className="text-xl">Algo deu errado</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground">
                    <p>
                        Encontramos um erro inesperado ao processar sua solicitação.
                        Nossa equipe foi notificada.
                    </p>
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mt-4 p-2 bg-muted rounded text-xs text-left overflow-auto max-h-32 font-mono">
                            {error.message}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="justify-center pt-2">
                    <Button onClick={() => reset()} className="gap-2">
                        <RefreshCcw className="h-4 w-4" />
                        Tentar Novamente
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
