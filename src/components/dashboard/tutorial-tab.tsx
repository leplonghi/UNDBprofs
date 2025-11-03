import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '../ui/button';
import { LifeBuoy } from 'lucide-react';

export function TutorialTab() {
  return (
    <Card>
        <CardHeader>
            <div className="flex items-start justify-between">
                <div>
                    <CardTitle>Guia Rápido do UNDBProf</CardTitle>
                    <CardDescription>
                    Um resumo das principais funcionalidades para você começar.
                    </CardDescription>
                </div>
                 <Button asChild variant="outline">
                    <Link href="/ajuda">
                        <LifeBuoy className="mr-2 h-4 w-4" />
                        Ver Tutorial Completo
                    </Link>
                </Button>
            </div>
        </CardHeader>
        <CardContent>
             <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                    <AccordionTrigger>O que é o UNDBProf?</AccordionTrigger>
                    <AccordionContent>
                    O UNDBProf é uma ferramenta de auxílio pessoal, criada por um professor para professores, com o objetivo de otimizar e automatizar tarefas acadêmicas. Importante: este aplicativo não possui nenhum vínculo oficial com a instituição UNDB e não substitui os sistemas oficiais da faculdade.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                    <AccordionTrigger>Dashboard</AccordionTrigger>
                    <AccordionContent>
                    Esta é sua central de comando. Aqui você tem uma visão geral de suas disciplinas, turmas, alunos e atividades. Use o botão "Adicionar/Importar Disciplina" para começar a cadastrar seu conteúdo.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                    <AccordionTrigger>Disciplinas</AccordionTrigger>
                    <AccordionContent>
                    A seção de Disciplinas é onde a mágica acontece. Você pode:
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                        <li><strong>Importar com IA:</strong> Envie um Plano de Ensino em PDF e a IA extrairá todas as informações, criando a disciplina, a turma e o cronograma de aulas para você.</li>
                        <li><strong>Adicionar Alunos:</strong> Importe listas de alunos a partir de um CSV ou use a IA para extrair de um documento.</li>
                        <li><strong>Lançar Notas:</strong> Gerencie as notas dos alunos individualmente ou em grupo. O sistema calcula as médias automaticamente.</li>
                    </ul>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                    <AccordionTrigger>Documentos</AccordionTrigger>
                    <AccordionContent>
                    Um repositório central para seus materiais. Você pode fazer upload de arquivos (aulas, artigos) ou adicionar links externos e associá-los a uma disciplina. Além disso, você encontra modelos institucionais (templates) prontos para baixar.
                    </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-5">
                    <AccordionTrigger>Calendário</AccordionTrigger>
                    <AccordionContent>
                    O calendário acadêmico do semestre letivo, integrado com os eventos das suas disciplinas. Ele mostra todas as datas importantes, como avaliações (N1, N2), feriados e recessos, ajudando você a se planejar.
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </CardContent>
    </Card>
  );
}
