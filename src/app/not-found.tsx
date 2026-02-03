import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-background p-4 text-center">
            <div className="rounded-full bg-muted p-6 animate-in fade-in zoom-in duration-500">
                <FileQuestion className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="space-y-2 max-w-md">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl text-foreground">
                    Página não encontrada
                </h1>
                <p className="text-muted-foreground text-lg">
                    Desculpe, a página que você está procurando não existe ou foi movida.
                </p>
            </div>
            <Button asChild className="animate-in fade-in slide-in-from-bottom-4 delay-200">
                <Link href="/dashboard">
                    Voltar ao Início
                </Link>
            </Button>
        </div>
    );
}
