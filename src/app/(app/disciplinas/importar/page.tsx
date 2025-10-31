'use client';
import { ImportForm } from '@/components/import/import-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function ImportCoursePage() {

    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Importar Disciplina e Turma via PDF</CardTitle>
                    <CardDescription>
                        Faça o upload do plano de ensino em formato PDF. Nossa inteligência artificial irá ler o documento e preencher automaticamente os campos abaixo com as informações da disciplina e da primeira turma.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        Após a extração, você poderá revisar e editar os dados antes de salvar. Isso criará tanto a disciplina quanto a primeira turma associada a ela no sistema.
                    </p>
                    <ImportForm />
                </CardContent>
            </Card>
        </div>
    );
}
