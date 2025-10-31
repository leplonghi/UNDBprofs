'use client';
import { ImportForm } from '@/components/import/import-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function ImportCoursePage() {

    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Importar Disciplina e Turma</CardTitle>
                    <CardDescription>
                        Importe o plano de ensino em PDF para que a IA extraia as informações da disciplina e da primeira turma.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ImportForm />
                </CardContent>
            </Card>
        </div>
    );
}
