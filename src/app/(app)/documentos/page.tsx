'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Folder, PlusCircle, ArrowLeft, ExternalLink } from 'lucide-react';
import { DocumentsTable } from '@/components/documents/documents-table';
import { AddDocumentDialog } from '@/components/documents/add-document-dialog';
import { useRouter } from 'next/navigation';

const driveFolders = [
    { name: 'Apresentações', description: 'Modelos de slides para aulas e eventos.', url: 'https://drive.google.com/drive/folders/1_FOLDER_ID_APRESENTACOES' },
    { name: 'Atas de Reunião', description: 'Templates para registrar reuniões de colegiado.', url: 'https://drive.google.com/drive/folders/1_FOLDER_ID_ATAS' },
    { name: 'Avaliações N1/N2', description: 'Estruturas e modelos para as avaliações.', url: 'https://drive.google.com/drive/folders/1_FOLDER_ID_AVALIACOES' },
    { name: 'Calendários', description: 'Cronogramas acadêmicos e de avaliações.', url: 'https://drive.google.com/drive/folders/1_FOLDER_ID_CALENDARIOS' },
    { name: 'Editais', description: 'Modelos para editais de monitoria e pesquisa.', url: 'https://drive.google.com/drive/folders/1_FOLDER_ID_EDITAIS' },
    { name: 'Estudo Dirigido', description: 'Templates para atividades de estudo dirigido.', url: 'https://drive.google.com/drive/folders/1_FOLDER_ID_ESTUDO' },
    { name: 'Eventos Acadêmicos', description: 'Documentação para organização de eventos.', url: 'https://drive.google.com/drive/folders/1_FOLDER_ID_EVENTOS' },
    { name: 'Grupos de Pesquisa', description: 'Documentos para gestão de grupos de pesquisa.', url: 'https://drive.google.com/drive/folders/1_FOLDER_ID_PESQUISA' },
    { name: 'Líderes de Turma', description: 'Informações e guias para líderes de turma.', url: 'https://drive.google.com/drive/folders/1_FOLDER_ID_LIDERES' },
    { name: 'Manual do Calouro', description: 'Guia de boas-vindas para novos alunos.', url: 'https://drive.google.com/drive/folders/1_FOLDER_ID_CALOURO' },
    { name: 'Metodologias Ativas', description: 'Materiais de apoio sobre metodologias.', url: 'https://drive.google.com/drive/folders/1_FOLDER_ID_METODOLOGIAS' },
    { name: 'Planos de Ensino', description: 'Modelos de planos para disciplinas modulares e integradoras.', url: 'https://drive.google.com/drive/folders/1_FOLDER_ID_PLANOS' },
    { name: 'Projeto Pedagógico', description: 'Documento do Projeto Pedagógico do Curso (PPC).', url: 'https://drive.google.com/drive/folders/1_FOLDER_ID_PPC' },
    { name: 'Regimento Interno', description: 'Normas e regimento interno da instituição.', url: 'https://drive.google.com/drive/folders/1_FOLDER_ID_REGIMENTO' },
    { name: 'Visitas Técnicas', description: 'Formulários e guias para visitas técnicas.', url: 'https://drive.google.com/drive/folders/1_FOLDER_ID_VISITAS' },
];

export default function DocumentsPage() {
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const router = useRouter();

  return (
    <>
      <AddDocumentDialog isOpen={isAddOpen} onOpenChange={setIsAddOpen} />
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold text-primary">
                Armazenamento de Documentos
            </h1>
        </div>

        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Meus Documentos</CardTitle>
              <CardDescription>
                Faça upload de aulas, artigos e outros materiais ou adicione links externos.
              </CardDescription>
            </div>
            <Button className="mt-4 md:mt-0" onClick={() => setIsAddOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Documento
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <DocumentsTable />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Drive da Coordenação</CardTitle>
            <CardDescription>
              Acesse pastas e arquivos importantes do Google Drive da coordenação. Os links abrirão em uma nova aba.
            </CardDescription>
          </CardHeader>
           <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {driveFolders.map((folder) => (
              <a
                key={folder.name}
                href={folder.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-lg border p-4 transition-all hover:bg-accent hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                    <div className='flex items-center gap-4'>
                        <Folder className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                        <div>
                            <p className="font-semibold">{folder.name}</p>
                            <p className="text-sm text-muted-foreground">{folder.description}</p>
                        </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </a>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
