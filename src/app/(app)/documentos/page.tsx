'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DownloadCloud, PlusCircle, ArrowLeft } from 'lucide-react';
import { DocumentsTable } from '@/components/documents/documents-table';
import { AddDocumentDialog } from '@/components/documents/add-document-dialog';
import { useRouter } from 'next/navigation';

const driveFolders = [
    { name: 'Apresentações', url: 'https://firebasestorage.googleapis.com/v0/b/studio-3759592126-ec313.appspot.com/o/modelos%2FAPRESENTAC%CC%A7A%CC%83O%20-%20MODELO.pptx?alt=media' },
    { name: 'Atas', url: 'https://firebasestorage.googleapis.com/v0/b/studio-3759592126-ec313.appspot.com/o/modelos%2FATA%20DE%20REUNIA%CC%83O.docx?alt=media' },
    { name: 'Avaliações', url: 'https://firebasestorage.googleapis.com/v0/b/studio-3759592126-ec313.appspot.com/o/modelos%2FAVALIAC%CC%A7A%CC%83O%20N1%20N2%20-%20MODELO.docx?alt=media' },
    { name: 'Calendários', url: 'https://firebasestorage.googleapis.com/v0/b/studio-3759592126-ec313.appspot.com/o/modelos%2FCALENDA%CC%81RIO%20DE%20AVALIAC%CC%A7O%CC%83ES%202025.1.docx?alt=media' },
    { name: 'Editais', url: 'https://firebasestorage.googleapis.com/v0/b/studio-3759592126-ec313.appspot.com/o/modelos%2FEDITAL%20DE%20SELECAO%20DE%20MONitores.docx?alt=media' },
    { name: 'Estudo Dirigido', url: 'https://firebasestorage.googleapis.com/v0/b/studio-3759592126-ec313.appspot.com/o/modelos%2FESTUDO%20DIRIGIDO.docx?alt=media' },
    { name: 'Eventos', url: 'https://firebasestorage.googleapis.com/v0/b/studio-3759592126-ec313.appspot.com/o/modelos%2FEVENTO%20ACADE%CC%82MICO.docx?alt=media' },
    { name: 'Grupos de Pesquisa', url: 'https://firebasestorage.googleapis.com/v0/b/studio-3759592126-ec313.appspot.com/o/modelos%2FGRUPO%20DE%20PESQUISA.docx?alt=media' },
    { name: 'Líderes', url: 'https://firebasestorage.googleapis.com/v0/b/studio-3759592126-ec313.appspot.com/o/modelos%2FLIDERES%20DE%20TURMA.docx?alt=media' },
    { name: 'Manual do Calouro', url: 'https://firebasestorage.googleapis.com/v0/b/studio-3759592126-ec313.appspot.com/o/modelos%2FMANUAL%20DO%20CALOURO.docx?alt=media' },
    { name: 'Metodologias Ativas', url: 'https://firebasestorage.googleapis.com/v0/b/studio-3759592126-ec313.appspot.com/o/modelos%2FMETODOLOGIAS%20ATIVAS.docx?alt=media' },
    { name: 'Microsoft Teams', url: 'https://firebasestorage.googleapis.com/v0/b/studio-3759592126-ec313.appspot.com/o/modelos%2FMICROSOFT%20TEAMS.docx?alt=media' },
    { name: 'Monitoria', url: 'https://firebasestorage.googleapis.com/v0/b/studio-3759592126-ec313.appspot.com/o/modelos%2FMONITORIA%20-%20EDITAL.docx?alt=media' },
    { name: 'Neurodivergências', url: 'https://firebasestorage.googleapis.com/v0/b/studio-3759592126-ec313.appspot.com/o/modelos%2FNEURODIVERGE%CC%82NCIAS.docx?alt=media' },
    { name: 'Pesquisa', url: 'https://firebasestorage.googleapis.com/v0/b/studio-3759592126-ec313.appspot.com/o/modelos%2FPESQUISA.docx?alt=media' },
    { name: 'Planejamento Unidades Curriculares', url: 'https://firebasestorage.googleapis.com/v0/b/studio-3759592126-ec313.appspot.com/o/modelos%2FPLANEJAMENTO%20UNIDADES%20CURRICULARES.docx?alt=media' },
    { name: 'Plano de Ensino (Integradora)', url: 'https://firebasestorage.googleapis.com/v0/b/studio-3759592126-ec313.appspot.com/o/modelos%2FPLANO%20DE%20ENSINO%20-%20INTEGRADORA.pdf?alt=media' },
    { name: 'Plano de Ensino (Modular)', url: 'https://firebasestorage.googleapis.com/v0/b/studio-3759592126-ec313.appspot.com/o/modelos%2FPLANO%20DE%20ENSINO%20-%20MODULAR.pdf?alt=media' },
    { name: 'Plano de Ensino e Proposta Av Qualis', url: 'https://firebasestorage.googleapis.com/v0/b/studio-3759592126-ec313.appspot.com/o/modelos%2FPLANO%20DE%20ENSINO%20E%20PROPOSTA%20AV%20QUALIS.docx?alt=media' },
    { name: 'Programa das Disciplinas', url: 'https://firebasestorage.googleapis.com/v0/b/studio-3759592126-ec313.appspot.com/o/modelos%2FPROGRAMA%20DAS%20DISCIPLINAS.docx?alt=media' },
    { name: 'Projeto Pedagógico', url: 'https://firebasestorage.googleapis.com/v0/b/studio-3759592126-ec313.appspot.com/o/modelos%2FPROJETO%20PEDAGO%CC%81GICO.docx?alt=media' },
    { name: 'Regimento Interno', url: 'https://firebasestorage.googleapis.com/v0/b/studio-3759592126-ec313.appspot.com/o/modelos%2FREGIMENTO%20INTERNO.docx?alt=media' },
    { name: 'UNDBClassroom', url: 'https://firebasestorage.googleapis.com/v0/b/studio-3759592126-ec313.appspot.com/o/modelos%2FUNDBCLASSROOM.docx?alt=media' },
    { name: 'Visitas Técnicas', url: 'https://firebasestorage.googleapis.com/v0/b/studio-3759592126-ec313.appspot.com/o/modelos%2FVISITAS%20TE%CC%81CNICAS.docx?alt=media' },
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
