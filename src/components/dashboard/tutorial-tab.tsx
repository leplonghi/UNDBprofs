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
    <Card>
        <CardHeader>
            <CardTitle className='text-lg'>Não sabe por onde começar?</CardTitle>
        </CardHeader>
        <CardContent>
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="tutorial" className="border-b-0">
                    <AccordionTrigger className="text-base font-semibold hover:no-underline pt-0">
                        Veja o Guia Rápido
                    </AccordionTrigger>
                    <AccordionContent className="pt-2">
                        <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                            <li>
                                <strong>Importe Disciplinas com IA:</strong> Envie um Plano de Ensino em PDF e a IA extrai tudo para você.
                            </li>
                            <li>
                                <strong>Adicione Alunos:</strong> Importe listas de alunos via CSV ou extraia de documentos.
                            </li>
                            <li>
                                <strong>Lance Notas:</strong> Gerencie notas individualmente ou em grupo, com médias calculadas automaticamente.
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
        </CardContent>
    </Card>
  );
}
