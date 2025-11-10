'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Folder, PlusCircle, ArrowLeft, ExternalLink } from 'lucide-react';
import { DocumentsTable } from '@/components/documents/documents-table';
import { AddDocumentDialog } from '@/components/documents/add-document-dialog';
import { useRouter } from 'next/navigation';

const driveFolders = [
  {
    name: 'Apresentações',
    description: 'Modelos de slides para aulas e eventos.',
    url: 'https://drive.google.com/drive/folders/1s3wX3VVxiJP-LpMZ3OsEH6aEgIq_vrnA?usp=drive_link',
  },
  {
    name: 'Atas de Reunião',
    description: 'Templates para registrar reuniões de colegiado.',
    url: 'https://drive.google.com/drive/folders/1LqGBuC19i__zpq32Cd-jhvBLtGzNFNOX?usp=drive_link',
  },
  {
    name: 'Avaliações N1/N2',
    description: 'Estruturas e modelos para as avaliações.',
    url: 'https://drive.google.com/drive/folders/1lmIzifBMWQrGylqxBhmW2kRaXQbHrzbj?usp=drive_link',
  },
  {
    name: 'Calendários',
    description: 'Cronogramas acadêmicos e de avaliações.',
    url: 'https://drive.google.com/drive/folders/1cbSSM4o-vKQ09NfZ8BpXxM4dr3AghnnF?usp=drive_link',
  },
  {
    name: 'Editais',
    description: 'Modelos para editais de monitoria e pesquisa.',
    url: 'https://drive.google.com/drive/folders/1tIzz536qs1oCb8fvIMAivdCF5xgc_HdQ?usp=drive_link',
  },
  {
    name: 'Estudo Dirigido',
    description: 'Templates para atividades de estudo dirigido.',
    url: 'https://drive.google.com/drive/folders/1fX88c0DZf68TSCmu_jel-GpBPHsELfli?usp=drive_link',
  },
  {
    name: 'Eventos Acadêmicos',
    description: 'Documentação para organização de eventos.',
    url: 'https://drive.google.com/drive/folders/1xA5JQQP3fAXYpHxmmcaeEL7VmJtDt7_O?usp=drive_link',
  },
  {
    name: 'Grupos de Pesquisa',
    description: 'Documentos para gestão de grupos de pesquisa.',
    url: 'https://drive.google.com/drive/folders/1-4qRwU5qJ61qdga8U83smFSYJqNmOlxr?usp=drive_link',
  },
  {
    name: 'Líderes de Turma',
    description: 'Guias e informações para líderes de turma.',
    url: 'https://drive.google.com/drive/folders/1By7a7QwaZADs_NhPUrnqth4EGDAcoMku?usp=drive_link',
  },
  {
    name: 'Manual do Calouro',
    description: 'Guia de boas-vindas para novos alunos.',
    url: 'https://drive.google.com/drive/folders/165y9fYZbtmqe7dtbK5RoTGCX2fi9oY4g?usp=drive_link',
  },
  {
    name: 'Metodologias Ativas',
    description: 'Materiais de apoio sobre metodologias.',
    url: 'https://drive.google.com/drive/folders/1pqC-rOkLw_Voj-sE_Bmv5FTgS6WvorU2?usp=drive_link',
  },
  {
    name: 'Microsoft Teams',
    description: 'Materiais e orientações de uso institucional.',
    url: 'https://drive.google.com/drive/folders/1DqlyGSBIj-XlMgTe8KmVLOc4CZ_TIey8?usp=drive_link',
  },
  {
    name: 'Monitoria',
    description: 'Documentos e editais de monitoria.',
    url: 'https://drive.google.com/drive/folders/1u1cXD3MPV7TIp_w2NYIKAfxkjCdBKgP2?usp=drive_link',
  },
  {
    name: 'Neurodivergências',
    description: 'Materiais de apoio e inclusão pedagógica.',
    url: 'https://drive.google.com/drive/folders/1qEsh7w3ZqUIjgIDebJA4Y6NuLwl7UBUk?usp=drive_link',
  },
  {
    name: 'Pesquisa',
    description: 'Modelos e orientações para pesquisas.',
    url: 'https://drive.google.com/drive/folders/1Jr--rBbpTZ4c0iI2IwR2TyvURJuP1zOk?usp=drive_link',
  },
  {
    name: 'Planejamento de Unidades Curriculares',
    description: 'Modelos de planejamento acadêmico.',
    url: 'https://drive.google.com/drive/folders/1LuYZkx-zm78Q2JsPa9-J2d6234T38iqb?usp=drive_link',
  },
  {
    name: 'Plano de Ensino e Proposta Qualis',
    description: 'Planos e modelos de proposta Qualis.',
    url: 'https://drive.google.com/drive/folders/1yVxXqaFYCp5KxXzX4zpisXKJUgeO9QRH?usp=drive_link',
  },
  {
    name: 'Programa das Disciplinas',
    description: 'Programas e ementas institucionais.',
    url: 'https://drive.google.com/drive/folders/1uEeztfSjAQa-jKgw9OsmqCnBnfgQrRpO?usp=drive_link',
  },
  {
    name: 'Projeto Pedagógico',
    description: 'Documento do Projeto Pedagógico do Curso (PPC).',
    url: 'https://drive.google.com/drive/folders/1uiMVKVT6OlE-jFj1EuNDjOoghMh_f4UP?usp=drive_link',
  },
  {
    name: 'Regimento Interno',
    description: 'Normas e regimentos da instituição.',
    url: 'https://drive.google.com/drive/folders/1IF5JiIpzu7ZHx_FZBuLK7srAwUWWtcd2?usp=drive_link',
  },
  {
    name: 'UNDB Classroom',
    description: 'Modelos e materiais para o ambiente virtual.',
    url: 'https://drive.google.com/drive/folders/1XJVU06gupzWrU7vcGPkmXnfYCfkaURZl?usp=drive_link',
  },
  {
    name: 'Visitas Técnicas',
    description: 'Formulários e guias de visitas técnicas.',
    url: 'https://drive.google.com/drive/folders/1a4iluNo7VXg4KBKXDMsH99x7nebXmJwq?usp=drive_link',
  },
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
