'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DownloadCloud, PlusCircle, ArrowLeft } from 'lucide-react';
import { DocumentsTable } from '@/components/documents/documents-table';
import { AddDocumentDialog } from '@/components/documents/add-document-dialog';
import { useRouter } from 'next/navigation';

const driveFolders = [
    { name: 'Apresentações', url: '#' },
    { name: 'Atas', url: '#' },
    { name: 'Avaliações', url: '#' },
    { name: 'Calendários', url: '#' },
    { name: 'Editais', url: '#' },
    { name: 'Estudo Dirigido', url: '#' },
    { name: 'Eventos', url: '#' },
    { name: 'Grupos de Pesquisa', url: '#' },
    { name: 'Líderes', url: '#' },
    { name: 'Manual do Calouro', url: '#' },
    { name: 'Metodologias Ativas', url: '#' },
    { name: 'Microsoft Teams', url: '#' },
    { name: 'Monitoria', url: '#' },
    { name: 'Neurodivergências', url: '#' },
    { name: 'Pesquisa', url: '#' },
    { name: 'Planejamento Unidades Curriculares', url: '#' },
    { name: 'Plano de Ensino e Proposta Av Qualis', url: '#' },
    { name: 'Programa das Disciplinas', url: '#' },
    { name: 'Projeto Pedagógico', url: '#' },
    { name: 'Regimento Interno', url: '#' },
    { name: 'UNDBClassroom', url: '#' },
    { name: 'Visitas Técnicas', url: '#' },
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
              Acesse pastas e arquivos importantes do Google Drive da coordenação.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {driveFolders.map((folder) => (
              <a
                key={folder.name}
                href={folder.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent hover:shadow-md transition-all"
              >
                <p className="font-semibold">{folder.name}</p>
                <DownloadCloud className="h-5 w-5 text-muted-foreground ml-4 flex-shrink-0" />
              </a>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
