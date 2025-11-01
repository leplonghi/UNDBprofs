'use client';
import { ImportForm } from '@/components/import/import-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function ImportCoursePage() {

    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Revisar Dados da Disciplina Importada</CardTitle>
                    <CardDescription>
                        Os dados do plano de ensino foram extraídos. Revise as informações abaixo e confirme para salvar a nova disciplina e a primeira turma.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ImportForm />
                </CardContent>
            </Card>
        </div>
    );
}
