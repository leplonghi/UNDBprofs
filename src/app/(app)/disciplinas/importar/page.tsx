'use client';
import { ImportForm } from '@/components/import/import-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function ImportCoursePage() {
    const router = useRouter();

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-primary">Revisar Dados da Disciplina Importada</h1>
                    <p className="text-muted-foreground">
                        Revise os dados e confirme para salvar a nova disciplina e turma.
                    </p>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Revisão das Informações</CardTitle>
                    <CardDescription>
                        Os dados do plano de ensino foram extraídos. Verifique as informações abaixo e, se necessário, faça os ajustes antes de salvar.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ImportForm />
                </CardContent>
            </Card>
        </div>
    );
}
