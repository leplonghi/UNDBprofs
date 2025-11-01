'use client';

import React, { useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CoursesTable } from '@/components/courses/courses-table';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { importCourseFromLessonPlan } from '@/ai/flows/import-course-from-lesson-plan';

export default function CoursesPage() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Você precisa estar logado para importar um arquivo.'});
        return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    startTransition(() => {
        reader.onload = async () => {
            try {
                const lessonPlanDataUri = reader.result as string;
                
                toast({
                    title: 'Processando Arquivo...',
                    description: 'Aguarde enquanto a IA extrai as informações do plano de ensino.',
                });

                const result = await importCourseFromLessonPlan({ lessonPlanDataUri });
                
                sessionStorage.setItem('importedData', JSON.stringify(result));
                
                toast({
                    title: 'Extração Concluída!',
                    description: 'Revise os dados extraídos do plano de ensino.',
                });

                router.push('/disciplinas/importar');

            } catch (error) {
                console.error(error);
                toast({
                    variant: 'destructive',
                    title: 'Erro na Extração',
                    description: 'Não foi possível processar o arquivo. Tente novamente.',
                });
            }
        };
        reader.onerror = () => {
             toast({
                variant: 'destructive',
                title: 'Erro de Leitura',
                description: 'Não foi possível ler o arquivo selecionado.',
            });
        }
    });
  };

  const handleImportClick = () => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Você precisa estar logado.'});
        return;
    }
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Minhas Disciplinas</h1>
        
        <Button onClick={handleImportClick} disabled={isPending}>
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <PlusCircle className="mr-2 h-4 w-4" />
          )}
          Adicionar Turma
        </Button>

        <Input 
            type="file" 
            ref={fileInputRef}
            className="sr-only" 
            onChange={handleFileChange} 
            accept=".pdf" 
            disabled={isPending}
        />
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Lista de Disciplinas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <CoursesTable />
        </CardContent>
      </Card>
    </div>
  );
}
