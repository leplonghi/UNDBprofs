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

export function TutorialCard() {
  return (
    <div>
        <ul className="list-decimal pl-5 space-y-3 text-sm text-muted-foreground">
            <li>
                <strong>Importe um Plano de Ensino (PE):</strong> Vá para a página de{' '}
                <Link href="/disciplinas" className="font-bold text-primary hover:underline">
                    Disciplinas
                </Link>
                , clique em <strong>Adicionar/Importar</strong> e envie o PDF. O sistema cria a disciplina, a turma e o cronograma para você.
            </li>
            <li>
                <strong>Adicione Alunos em Massa:</strong> Na página da disciplina, em <strong>Gerenciamento da Turma</strong> {'>'} <strong>Alunos</strong>, importe um arquivo CSV ou extraia de um documento com IA para adicionar toda a turma de uma vez.
            </li>
            <li>
                <strong>Lance as Notas:</strong> Em <strong>Lançamento de Notas</strong>, crie grupos para trabalhos, lance as notas e veja as médias serem calculadas automaticamente.
            </li>
                <li>
                <strong>Participe da Comunidade:</strong> Visite a nova página{' '}
                <Link href="/comunidade" className="font-bold text-primary hover:underline">
                    Comunidade
                </Link>
                , proponha uma ideia no "Clube das Ideias" e colabore com outros professores.
            </li>
        </ul>
        <Button asChild variant="secondary" size="sm" className="mt-4 w-full">
            <Link href="/ajuda">
                <LifeBuoy className="mr-2 h-4 w-4" />
                Ver Tutorial Completo na Página de Ajuda
            </Link>
        </Button>
    </div>
  );
}
