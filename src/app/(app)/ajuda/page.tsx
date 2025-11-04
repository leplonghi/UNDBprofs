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
          <CardTitle>Perguntas Frequentes e Guias</CardTitle>
          <CardDescription>Clique em uma pergunta para ver a resposta detalhada.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>O que é o UNDBProf e qual seu objetivo?</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-base">
                  <p>O UNDBProf é uma ferramenta de auxílio pessoal, criada por um professor para professores, com o objetivo de otimizar e automatizar tarefas acadêmicas. O foco é ser um <span className="font-semibold text-primary">assistente inteligente</span> para o seu dia a dia.</p>
                  <p><span className="font-bold">Importante:</span> Este aplicativo não possui nenhum vínculo oficial com a instituição UNDB e não substitui os sistemas oficiais da faculdade (como AlunOnline ou o Portal do Professor). Ele funciona como uma camada de produtividade sobre os processos existentes.</p>
                  <p>O objetivo principal é reduzir drasticamente o tempo gasto com trabalhos manuais e repetitivos (como digitalizar cronogramas, criar planilhas de notas, etc.), permitindo que você dedique mais energia ao que realmente importa: o planejamento de aulas criativas e a interação com os alunos.</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>Como funciona a importação de disciplinas com IA?</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 text-base">
                    <p className="font-semibold text-primary">Este é o recurso mais poderoso do UNDBProf. Chega de digitar o plano de ensino manualmente!</p>
                    <p>O processo foi desenhado para ser o mais simples possível:</p>
                    <ol className="list-decimal pl-6 space-y-2">
                        <li>
                            <strong>Acesse a Página:</strong> No menu, vá para a página <strong>Disciplinas</strong> e clique no botão <strong>Adicionar/Importar Disciplina</strong>.
                        </li>
                        <li>
                            <strong>Envie o PDF:</strong> Na aba <strong>Importar com IA</strong>, arraste e solte o arquivo PDF do seu Plano de Ensino (o modelo oficial da UNDB) na área indicada, ou clique para selecioná-lo em seu computador.
                        </li>
                        <li>
                            <strong>Inicie a Extração:</strong> Clique em <strong>Iniciar Extração com IA</strong>. Nesse momento, o sistema envia o documento para um modelo de inteligência artificial treinado para ler e entender a estrutura dos planos de ensino da UNDB. A IA identifica e extrai automaticamente:
                            <ul className="list-disc pl-6 mt-2">
                                <li>Nome da disciplina e código</li>
                                <li>Ementa e Competências</li>
                                <li>Matriz de Competências (com Habilidades e Descritores)</li>
                                <li>Carga horária e semestre</li>
                                <li>Bibliografia (básica, complementar e recomendada)</li>
                                <li>E o mais importante: o <span className="font-bold">cronograma completo de aulas</span>, data por data, com tópicos, atividades e locais.</li>
                            </ul>
                        </li>
                        <li>
                            <strong>Revise e Ajuste:</strong> Após a extração (que leva alguns segundos), você será levado a uma tela de revisão. Aqui, todos os dados extraídos são apresentados em um formulário. <span className="font-semibold">É crucial que você revise as informações</span> para garantir que a IA extraiu tudo corretamente. Faça os ajustes necessários diretamente nos campos.
                        </li>
                        <li>
                            <strong>Confirme e Salve:</strong> Quando tudo estiver correto, clique em <strong>Confirmar e Salvar</strong>. O sistema irá criar a disciplina, a primeira turma, o cronograma de aulas e a estrutura de avaliação (preset de notas) automaticamente para você.
                        </li>
                    </ol>
                    <div className="p-3 bg-accent rounded-md">
                        <p className="text-sm text-accent-foreground"><span className="font-bold">Dica:</span> A qualidade da extração depende da qualidade do PDF. Use o arquivo original, não uma foto escaneada, para obter os melhores resultados.</p>
                    </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger>Como adiciono alunos a uma turma?</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 text-base">
                    <p>Depois de criar uma disciplina, o próximo passo é popular a turma com seus alunos. Para isso, entre na página da disciplina desejada, vá para a aba <strong>Gerenciamento da Turma</strong> e depois para a sub-aba <strong>Alunos</strong>. Clique no botão <strong>Adicionar Alunos</strong>. Você terá duas opções eficientes:</p>
                    
                    <div className="space-y-2">
                        <h4 className="font-semibold">Opção 1: Importar via Arquivo CSV (Recomendado)</h4>
                        <ol className="list-decimal pl-6 space-y-1">
                            <li>Baixe a lista de alunos do sistema oficial da faculdade (AlunOnline, por exemplo) em formato <span className="font-mono bg-muted px-1 rounded">.csv</span>.</li>
                            <li>Abra o arquivo em um editor de planilhas (Excel, Google Sheets) e garanta que ele contenha, no mínimo, as colunas <span className="font-mono bg-muted px-1 rounded">Nome</span> e <span className="font-mono bg-muted px-1 rounded">E-mail</span>. Uma coluna <span className="font-mono bg-muted px-1 rounded">Matrícula</span> também é recomendada.</li>
                            <li>Na janela "Adicionar Alunos", na aba <strong>Importar CSV</strong>, selecione este arquivo.</li>
                            <li>Clique em <strong>Enviar Lista</strong>. O sistema irá ler o arquivo e cadastrar todos os alunos na turma de uma só vez.</li>
                        </ol>
                    </div>

                    <div className="space-y-2">
                        <h4 className="font-semibold">Opção 2: Extrair de um Documento com IA</h4>
                         <p>Se você tiver a lista de alunos em um PDF ou até mesmo em uma imagem (como um print de tela), a IA pode ajudar.</p>
                        <ul className="list-disc pl-6 mt-2 space-y-1">
                            <li>Na aba <strong>Extrair com IA</strong>, envie o arquivo (PDF, JPG, PNG).</li>
                            <li>Clique em <strong>Extrair Alunos</strong>. A IA tentará identificar nomes, e-mails e matrículas no documento.</li>
                            <li>Uma tabela de revisão será exibida. Como a extração de documentos variados pode não ser 100% precisa, <span className="font-bold">verifique e corrija</span> os dados extraídos antes de confirmar.</li>
                            <li>Clique em <strong>Salvar Alunos</strong> para adicioná-los à turma.</li>
                        </ul>
                    </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>Como funciona o lançamento de notas?</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 text-base">
                    <p>O sistema de notas foi criado para ser flexível e rápido. Acesse a disciplina, vá em <strong>Gerenciamento da Turma</strong> e selecione a aba <strong>Lançamento de Notas</strong>. Lá você encontrará a planilha de notas da sua turma.</p>
                     <p>O sistema já cria automaticamente as atividades avaliativas com base no tipo da sua turma (Modular ou Integradora), mas você pode personalizá-las em <strong>Gerenciamento da Turma {'>'} Configurações</strong>.</p>
                     <div className="space-y-2">
                        <h4 className="font-semibold">Lançando Notas:</h4>
                        <ul className="list-disc pl-6 mt-2 space-y-2">
                            <li>
                                <strong>Notas Individuais:</strong> Simplesmente digite a nota de cada aluno na sua respectiva célula na planilha. As notas <span className="font-bold">não são salvas automaticamente</span>. Após fazer suas alterações, clique no botão <strong>Salvar Notas</strong> no topo da página.
                            </li>
                            <li>
                                <strong>Notas em Grupo:</strong> Este recurso é ideal para projetos e trabalhos em equipe.
                                <ol className="list-decimal pl-6 mt-1">
                                    <li>Marque a caixa de seleção ao lado do nome dos alunos que fazem parte de um grupo.</li>
                                    <li>Clique no botão <strong>Agrupar</strong>. O sistema criará um grupo com os alunos selecionados.</li>
                                    <li>Agora você pode lançar uma única nota para o grupo, e ela será replicada para todos os membros. Você ainda pode ajustar a nota de um membro individualmente, se necessário.</li>
                                </ol>
                            </li>
                            <li>
                                <strong>Cálculo de Média:</strong> As médias N1, N2 (para Integradoras) e a Nota Final são calculadas <span className="font-bold text-primary">automaticamente</span> à medida que você lança as notas, dando a você e ao aluno uma visão clara do desempenho em tempo real.
                            </li>
                             <li>
                                <strong>Exportação:</strong> Você pode exportar a planilha de notas completa para CSV ou PDF a qualquer momento usando o botão <strong>Exportar</strong>.
                            </li>
                        </ul>
                     </div>
                </div>
              </AccordionContent>
            </AccordionItem>

             <AccordionItem value="item-5">
              <AccordionTrigger>O que é a página de Documentos?</AccordionTrigger>
              <AccordionContent>
                 <div className="space-y-4 text-base">
                    <p>É o seu repositório de arquivos centralizado, projetado para manter seus materiais de aula organizados e acessíveis. Ele se divide em duas seções:</p>
                    <div className="space-y-2">
                        <h4 className="font-semibold">1. Meus Documentos</h4>
                        <p>Esta é a sua biblioteca pessoal. Nela, você pode:</p>
                        <ul className="list-disc pl-6 mt-2 space-y-1">
                            <li><strong>Adicionar Seus Documentos:</strong> Faça upload de arquivos diretamente do seu computador (slides de aula, artigos, trabalhos, etc.).</li>
                            <li><strong>Adicionar Links Externos:</strong> Em vez de fazer upload, você pode simplesmente adicionar um link para um arquivo no Google Drive, Dropbox, YouTube, ou qualquer outro site.</li>
                            <li><strong>Associar a uma Disciplina:</strong> Ao adicionar um documento, você pode associá-lo a uma ou mais disciplinas. Isso ajuda a manter tudo organizado e facilita a localização de materiais específicos para cada turma.</li>
                        </ul>
                    </div>
                     <div className="space-y-2">
                        <h4 className="font-semibold">2. Modelos Institucionais</h4>
                        <p>Para facilitar sua vida, reunimos aqui os modelos (templates) de documentos oficiais mais importantes da UNDB. Nesta seção, você pode baixar diretamente, com um clique:</p>
                        <ul className="list-disc pl-6 mt-2 space-y-1">
                            <li>Modelo de Plano de Ensino para Disciplina Modular</li>
                            <li>Modelo de Plano de Ensino para Disciplina Integradora (Estúdios)</li>
                            <li>Modelo de Avaliação N1/N2</li>
                        </ul>
                        <p>Chega de procurar esses arquivos em e-mails ou pastas antigas!</p>
                    </div>
                 </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-6">
              <AccordionTrigger>Posso sugerir melhorias ou relatar um problema?</AccordionTrigger>
              <AccordionContent className="text-base">
                <p>Sim! Sua participação é fundamental para a evolução do UNDBProf. Esta ferramenta está em constante desenvolvimento, e o seu feedback é o principal guia para as próximas atualizações.</p>
                <p className="mt-2">No menu do seu perfil (clicando no seu avatar no canto superior direito), você encontrará a opção <strong>Feedback</strong>. Use-a para:</p>
                 <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Sugerir novos recursos que facilitariam seu trabalho.</li>
                    <li>Relatar erros ou comportamentos inesperados (bugs).</li>
                    <li>Propor melhorias em funcionalidades existentes.</li>
                </ul>
                 <p className="mt-2">Estamos construindo esta ferramenta em conjunto com você. Não hesite em compartilhar suas ideias!</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
