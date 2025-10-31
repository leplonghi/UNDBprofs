'use client';
import { ImportForm } from '@/components/import/import-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function ClassDetailPage({ params }: { params: { id: string, turmaId: string } }) {
    // TODO: fetch class details from backend
    const className = "Turma A";

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-bold text-primary">Gerenciar Turma: {className}</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Plano de Ensino</CardTitle>
                    <CardDescription>
                        Importe o plano de ensino em PDF para que a IA extraia as informações da disciplina, ou preencha manualmente.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ImportForm />
                </CardContent>
            </Card>
        </div>
    );
}
