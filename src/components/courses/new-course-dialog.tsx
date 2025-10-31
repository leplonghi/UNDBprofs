'use client';
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
import Link from 'next/link';

export function NewCourseDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Disciplina
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Disciplina</DialogTitle>
          <DialogDescription>
            Escolha como você quer criar a nova disciplina. Você pode preencher as informações
            manualmente ou importar de um arquivo PDF.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button variant="outline" asChild>
            <Link href="/disciplinas/nova">
              <PlusCircle className="mr-2" />
              Criar Manualmente
            </Link>
          </Button>
          <Button asChild>
            <Link href="/disciplinas/importar">
              <FilePlus className="mr-2" />
              Importar de PDF
            </Link>
          </Button>
        </div>
        <DialogFooter>
          <p className="text-sm text-muted-foreground">
            Ao importar de um PDF, a IA irá extrair o nome, código, ementa, objetivos, semestre e carga horária.
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
