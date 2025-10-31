'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FilePlus, PlusCircle, Loader2 } from 'lucide-react';
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

  const handleNavigate = (path: string) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Você precisa estar logado.'});
        return;
    }
    router.push(path);
    setIsOpen(false);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Você precisa estar logado para importar um arquivo.'});
        return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    startTransition(() => {
        reader.onload = async () => {
            try {
                const lessonPlanDataUri = reader.result as string;
                const result = await importCourseFromLessonPlan({ lessonPlanDataUri });
                
                // Store result in session storage to pass to the next page
                sessionStorage.setItem('importedData', JSON.stringify(result));
                
                toast({
                    title: 'Extração Concluída!',
                    description: 'Revise os dados extraídos do plano de ensino.',
                });

                router.push('/disciplinas/importar');
                setIsOpen(false);

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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Turma
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Turma</DialogTitle>
          <DialogDescription>
            Escolha como você quer criar a nova turma. Você pode preencher as informações
            manualmente ou importar de um arquivo PDF.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button variant="outline" onClick={() => handleNavigate('/disciplinas/turmas/nova')} disabled={isPending}>
            <PlusCircle className="mr-2" />
            Criar Manualmente
          </Button>

          <Button asChild disabled={isPending}>
            <label htmlFor="file-upload" className="cursor-pointer">
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FilePlus className="mr-2" />
              )}
              {isPending ? 'Processando...' : 'Importar de PDF'}
            </label>
          </Button>
          <Input id="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf" disabled={isPending}/>

        </div>
        <DialogFooter>
          <p className="text-sm text-muted-foreground">
            Ao importar de um PDF, a disciplina e a turma serão criadas automaticamente.
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
