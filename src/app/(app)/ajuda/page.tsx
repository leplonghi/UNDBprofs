'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

export default function AjudaPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-primary">Página de Ajuda e Tutorial</h1>
        <p className="text-muted-foreground">
          Tire suas dúvidas sobre os recursos e o funcionamento do UNDBProf.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perguntas Frequentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>O que é o UNDBProf e qual seu objetivo?</AccordionTrigger>
              <AccordionContent>
                O UNDBProf é uma ferramenta de auxílio pessoal, criada por um professor para professores, com o objetivo de otimizar e automatizar tarefas acadêmicas. É importante ressaltar que este aplicativo não possui nenhum vínculo oficial com a instituição UNDB e não substitui os sistemas oficiais da faculdade. O objetivo é ser um assistente para reduzir o tempo gasto com trabalhos manuais e repetitivos, permitindo que você dedique mais energia ao planejamento de aulas e à interação com os alunos.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>Como funciona a importação de disciplinas com IA?</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                    <p>Este é um dos recursos mais poderosos do UNDBProf. O processo é simples:</p>
                    <ol className="list-decimal pl-6 space-y-1">
                        <li>Vá para a página <strong>Disciplinas</strong> e clique em <strong>Adicionar/Importar Disciplina</strong>.</li>
                        <li>Na aba <strong>Importar com IA</strong>, arraste ou selecione o arquivo PDF do seu Plano de Ensino.</li>
                        <li>Clique em <strong>Iniciar Extração com IA</strong>. O sistema irá ler o documento e extrair automaticamente todas as informações relevantes: nome da disciplina, código, ementa, objetivos, bibliografia e, o mais importante, o cronograma completo de aulas.</li>
                        <li>Após a extração, você será levado a uma tela de revisão. Confira se os dados estão corretos, faça os ajustes necessários e clique em <strong>Confirmar e Salvar</strong>.</li>
                        <li>Pronto! A disciplina e a primeira turma, já com o cronograma de aulas, estarão criadas no sistema.</li>
                    </ol>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger>Como adiciono alunos a uma turma?</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                    <p>Dentro da página de uma disciplina, acesse a aba <strong>Gerenciamento da Turma</strong> e depois a sub-aba <strong>Alunos</strong>. Clique no botão <strong>Adicionar Alunos</strong>. Você terá duas opções:</p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                        <li><strong>Importar CSV:</strong> Baixe a lista de alunos do sistema da faculdade (AlunOnline, por exemplo) em formato CSV. Envie o arquivo e o sistema irá cadastrar todos os alunos na turma de uma só vez. As colunas necessárias são `Nome` e `E-mail`.</li>
                        <li><strong>Extrair com IA:</strong> Envie um documento (PDF ou imagem) que contenha a lista de alunos. A IA tentará extrair nome, e-mail e matrícula. Você poderá revisar os dados antes de confirmar a importação.</li>
                    </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>Como funciona o lançamento de notas?</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                    <p>Acesse a disciplina, vá em <strong>Gerenciamento da Turma</strong> e selecione a aba <strong>Lançamento de Notas</strong>. Lá você verá a planilha de notas. O sistema já vem com os presets de avaliação para disciplinas Modulares e Integradoras.</p>
                     <ul className="list-disc pl-6 mt-2 space-y-1">
                        <li><strong>Notas Individuais:</strong> Simplesmente digite a nota de cada aluno em sua respectiva célula. As notas são salvas automaticamente.</li>
                        <li><strong>Notas em Grupo:</strong> Selecione os alunos que fazem parte de um grupo usando as caixas de seleção e clique em <strong>Agrupar</strong>. O sistema criará um grupo e você poderá lançar uma única nota que será replicada para todos os membros. Ideal para projetos e trabalhos em equipe.</li>
                        <li><strong>Cálculo de Média:</strong> As médias N1, N2 e a Nota Final são calculadas automaticamente à medida que você lança as notas.</li>
                    </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

             <AccordionItem value="item-5">
              <AccordionTrigger>O que é a página de Documentos?</AccordionTrigger>
              <AccordionContent>
                É o seu repositório de arquivos centralizado. Nela, você pode:
                 <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li><strong>Adicionar Seus Documentos:</strong> Faça upload de slides de aula, artigos, trabalhos e outros materiais, ou adicione links para arquivos no Google Drive, Dropbox, etc. Você pode associar cada documento a uma disciplina específica para manter tudo organizado.</li>
                    <li><strong>Baixar Modelos Institucionais:</strong> A UNDB oferece modelos (templates) para Planos de Ensino e outros documentos oficiais. Nesta seção, você pode baixá-los diretamente, sem precisar procurar em outros lugares.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-6">
              <AccordionTrigger>Posso sugerir melhorias ou relatar um problema?</AccordionTrigger>
              <AccordionContent>
                Sim! Sua participação é fundamental. Use a página de <strong>Feedback</strong> (acessível pelo menu do usuário) para enviar sugestões de novos recursos, relatar erros ou propor melhorias. Estamos construindo esta ferramenta em conjunto com você.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
