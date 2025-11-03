'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DownloadCloud, PlusCircle } from 'lucide-react';
import { DocumentsTable } from '@/components/documents/documents-table';
import { AddDocumentDialog } from '@/components/documents/add-document-dialog';

// Mock data for institutional templates
const institutionalTemplates = [
  {
    name: 'Modelo de Plano de Ensino - Disciplina Modular',
    description: 'Template oficial para criação de planos de ensino para disciplinas modulares.',
    url: '#', // Replace with actual URL
  },
  {
    name: 'Modelo de Plano de Ensino - Disciplina Integradora',
    description: 'Template oficial para criação de planos de ensino para disciplinas integradoras (Estúdios).',
    url: '#', // Replace with actual URL
  },
  {
    name: 'Modelo de Avaliação N1/N2',
    description: 'Estrutura padrão para avaliações N1 e N2.',
    url: '#', // Replace with actual URL
  },
];

export default function DocumentsPage() {
  const [isAddOpen, setIsAddOpen] = React.useState(false);

  return (
    <>
      <AddDocumentDialog isOpen={isAddOpen} onOpenChange={setIsAddOpen} />
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
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
            <CardTitle>Modelos Institucionais (Templates)</CardTitle>
            <CardDescription>
              Modelos de documentos oficiais da UNDB prontos para download.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {institutionalTemplates.map((template) => (
              <div
                key={template.name}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex-1">
                  <p className="font-semibold">{template.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {template.description}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  asChild
                  className="ml-4 flex-shrink-0"
                >
                  <a href={template.url} download>
                    <DownloadCloud className="h-5 w-5" />
                  </a>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
