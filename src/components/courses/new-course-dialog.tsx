'use client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileUp, PlusCircle } from 'lucide-react';
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
          <DialogTitle>Criar nova disciplina</DialogTitle>
          <DialogDescription>
            Escolha como você quer adicionar uma nova disciplina ao sistema.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button variant="outline" size="lg">
            Criação Manual
          </Button>
          <Button asChild size="lg">
            <Link href="/importar">
              <FileUp className="mr-2 h-4 w-4" />
              Importar Plano de Ensino (IA)
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
