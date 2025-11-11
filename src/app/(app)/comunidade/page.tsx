'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BrainCircuit, CalendarClock, PartyPopper, Coffee, Library, Handshake, Users2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIdeas } from '@/hooks/use-ideas';
import { IdeaCard } from '@/components/community/idea-card';
import { AddIdeaDialog } from '@/components/community/add-idea-dialog';
import { IdeaDetailsSheet } from '@/components/community/idea-details-sheet';
import { Skeleton } from '@/components/ui/skeleton';
import type { Idea } from '@/types';

const IdeasClubTab = () => {
    const [isAddIdeaOpen, setIsAddIdeaOpen] = React.useState(false);
    const [selectedIdea, setSelectedIdea] = React.useState<Idea | null>(null);
    const { ideas, isLoading } = useIdeas();

    return (
        <>
            <AddIdeaDialog isOpen={isAddIdeaOpen} onOpenChange={setIsAddIdeaOpen} />
            <IdeaDetailsSheet idea={selectedIdea} onOpenChange={() => setSelectedIdea(null)} />
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Clube das Ideias</CardTitle>
                        <CardDescription>Proponha, apoie e discuta ideias para melhorar nossa comunidade acadêmica.</CardDescription>
                    </div>
                    <Button onClick={() => setIsAddIdeaOpen(true)}>Nova Ideia</Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Skeleton className="h-48 w-full" />
                            <Skeleton className="h-48 w-full" />
                            <Skeleton className="h-48 w-full" />
                        </div>
                    ) : ideas && ideas.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {ideas.map((idea) => (
                                <IdeaCard key={idea.id} idea={idea} onSelect={() => setSelectedIdea(idea)} />
                            ))}
                        </div>
                    ) : (
                        <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                            <p>Nenhuma ideia proposta ainda. Seja o primeiro a compartilhar!</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    );
};

const MaterialsTab = () => (
  <Card>
    <CardHeader>
      <CardTitle>Boas Práticas & Materiais</CardTitle>
      <CardDescription>Uma biblioteca colaborativa de materiais para enriquecer suas aulas.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
        <Button>Compartilhar Material</Button>
        <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
            <p>Em breve: Biblioteca de materiais, sugestões e busca avançada.</p>
        </div>
    </CardContent>
  </Card>
);

const CoffeeChatTab = () => (
  <Card>
    <CardHeader>
      <CardTitle>Café Pedagógico</CardTitle>
      <CardDescription>Grupos de conversa para integração entre disciplinas, estúdios e turmas.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
        <Button>Criar Grupo de Conversa</Button>
        <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
            <p>Em breve: Grupos de conversa, chat integrado e mini agenda.</p>
        </div>
    </CardContent>
  </Card>
);

const FacultyAgendaTab = () => (
  <Card>
    <CardHeader>
      <CardTitle>Agenda Docente</CardTitle>
      <CardDescription>Sua visão clara dos próximos compromissos e prazos.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
        <Button>Adicionar Compromisso</Button>
        <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
            <p>Em breve: Agenda com visões de "Hoje", "Semana" e "Próximos dias".</p>
        </div>
    </CardContent>
  </Card>
);

const CelebrationsTab = () => (
  <Card>
    <CardHeader>
      <CardTitle>Parabéns & Conquistas</CardTitle>
      <CardDescription>Um espaço para celebrar os aniversariantes e as conquistas dos colegas.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
        <Button>Registrar Conquista</Button>
        <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
            <p>Em breve: Lista de aniversariantes e mural de conquistas da comunidade.</p>
        </div>
    </CardContent>
  </Card>
);


export default function CommunityPage() {

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-primary flex items-center gap-3">
            <Users2 className="h-8 w-8" />
            Comunidade Docente
        </h1>
        <p className="text-muted-foreground">
          Um espaço de colaboração, organização e troca entre professores.
        </p>
      </div>

      <Tabs defaultValue="ideas" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 h-auto">
          <TabsTrigger value="materials" className="flex flex-col sm:flex-row gap-2 py-2">
            <Library className="h-5 w-5" />
            <span>Boas Práticas</span>
          </TabsTrigger>
          <TabsTrigger value="coffee" className="flex flex-col sm:flex-row gap-2 py-2">
            <Coffee className="h-5 w-5" />
            <span>Café Pedagógico</span>
          </TabsTrigger>
           <TabsTrigger value="ideas" className="flex flex-col sm:flex-row gap-2 py-2">
            <BrainCircuit className="h-5 w-5" />
            <span>Clube das Ideias</span>
          </TabsTrigger>
          <TabsTrigger value="agenda" className="flex flex-col sm:flex-row gap-2 py-2">
            <CalendarClock className="h-5 w-5" />
            <span>Agenda Docente</span>
          </TabsTrigger>
          <TabsTrigger value="celebrations" className="flex flex-col sm:flex-row gap-2 py-2">
             <PartyPopper className="h-5 w-5" />
             <span>Conquistas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="mt-6">
          <MaterialsTab />
        </TabsContent>
         <TabsContent value="coffee" className="mt-6">
          <CoffeeChatTab />
        </TabsContent>
        <TabsContent value="ideas" className="mt-6">
          <IdeasClubTab />
        </TabsContent>
        <TabsContent value="agenda" className="mt-6">
          <FacultyAgendaTab />
        </TabsContent>
        <TabsContent value="celebrations" className="mt-6">
          <CelebrationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
