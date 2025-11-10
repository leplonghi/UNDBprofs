'use client';

import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '../ui/button';
import { LifeBuoy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export function TutorialCard() {
  return (
    <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="tutorial" className="border-b-0">
            <AccordionTrigger className="text-base font-semibold hover:no-underline pt-0">
                Não sabe por onde começar? Veja o Guia Rápido
            </AccordionTrigger>
            <AccordionContent className="pt-2">
                <ul className="list-disc pl-5 space-y-3 text-sm text-muted-foreground">
                    <li>
                        <strong>Importe Disciplinas com IA:</strong> Envie um Plano de Ensino em PDF para criar uma disciplina completa, com cronograma de aulas e estrutura de notas, em segundos.
                    </li>
                    <li>
                        <strong>Adicione Alunos em Massa:</strong> Use a importação de arquivos (.csv) ou a extração por IA para adicionar toda a sua turma de uma só vez, sem digitação manual.
                    </li>
                    <li>
                        <strong>Lance Notas de Forma Inteligente:</strong> Crie grupos para trabalhos em equipe, lance uma única nota para o grupo e veja as médias N1/N2 serem calculadas automaticamente.
                    </li>
                </ul>
                    <Button asChild variant="secondary" size="sm" className="mt-4 w-full">
                    <Link href="/ajuda">
                        <LifeBuoy className="mr-2 h-4 w-4" />
                        Ver Tutorial Completo
                    </Link>
                </Button>
            </AccordionContent>
        </AccordionItem>
    </Accordion>
  );
}
