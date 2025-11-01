'use client';
import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FilePlus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { importCourseFromLessonPlan } from '@/ai/flows/import-course-from-lesson-plan';
import { Input } from '../ui/input';
import { useUser } from '@/firebase';

export function NewClassroomDialog() {
  const [isOpen, setIsOpen] = useState(false);
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

    setIsOpen(false);
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FilePlus className="mr-2 h-4 w-4" />
          Importar de PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Importar de PDF</DialogTitle>
          <DialogDescription>
            Selecione o arquivo do plano de ensino para importar a disciplina e a primeira turma automaticamente.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button onClick={handleImportClick} disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FilePlus className="mr-2" />
              )}
              {isPending ? 'Processando...' : 'Selecionar Arquivo PDF'}
          </Button>
          <Input 
            id="file-upload" 
            type="file" 
            ref={fileInputRef}
            className="sr-only" 
            onChange={handleFileChange} 
            accept=".pdf" 
            disabled={isPending}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
