'use client';
import { useState } from 'react';
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
import { FilePlus, PlusCircle } from 'lucide-react';

export function NewClassroomDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleNavigate = (path: string) => {
    router.push(path);
    setIsOpen(false);
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
          <Button variant="outline" onClick={() => handleNavigate('/disciplinas/turmas/nova')}>
            <PlusCircle className="mr-2" />
            Criar Manualmente
          </Button>
          <Button onClick={() => handleNavigate('/disciplinas/importar')}>
            <FilePlus className="mr-2" />
            Importar de PDF
          </Button>
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
