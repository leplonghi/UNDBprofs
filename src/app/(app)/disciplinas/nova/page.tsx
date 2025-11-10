'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NewCourseForm from '@/components/courses/new-course-form';
import { ImportUploadForm } from '@/components/import/import-upload-form';
import type { ImportCourseFromLessonPlanOutput } from '@/ai/flows/import-course-from-lesson-plan';
import { ArrowLeft } from 'lucide-react';

export default function NewCoursePage() {
  const router = useRouter();
  const { user } = useUser();
  const [isPending, startTransition] = useTransition();

  const handleExtractionComplete = (data: ImportCourseFromLessonPlanOutput) => {
    sessionStorage.setItem('importedData', JSON.stringify(data));
    router.push('/disciplinas/importar');
  };

  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold text-primary">Adicionar Nova Disciplina</h1>
        </div>

        <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
            <CardTitle>Escolha o Método</CardTitle>
            <CardDescription>
            Use a IA para importar de um plano de ensino (PDF) ou preencha o
            formulário manualmente.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="importar" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="importar">Importar com IA</TabsTrigger>
                <TabsTrigger value="manual">Cadastro Manual</TabsTrigger>
            </TabsList>
            <TabsContent value="importar">
                <ImportUploadForm
                    user={user}
                    onExtractionComplete={handleExtractionComplete}
                />
            </TabsContent>
            <TabsContent value="manual">
                <Card>
                    <CardHeader>
                        <CardTitle>Cadastro Manual de Disciplina</CardTitle>
                        <CardDescription>Preencha os campos abaixo. Uma turma padrão ('Modular') será criada automaticamente.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <NewCourseForm />
                    </CardContent>
                </Card>
            </TabsContent>
            </Tabs>
        </CardContent>
        </Card>
    </div>
  );
}
