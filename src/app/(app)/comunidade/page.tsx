'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BrainCircuit, CalendarClock, PartyPopper, Coffee, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIdeas } from '@/hooks/use-ideas';
import { IdeaCard } from '@/components/community/idea-card';
import { AddIdeaDialog } from '@/components_community/add-idea-dialog';
import { Skeleton } from '@/components/ui/skeleton';

const IdeasClubTab = () => {
    const [isAddIdeaOpen, setIsAddIdeaOpen] = React.useState(false);
    const { ideas, isLoading } = useIdeas();

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Clube das Ideias</CardTitle>
                    <CardDescription>Proponha, apoie e discuta ideias para melhorar nossa comunidade acadêmica.</CardDescription>
                </div>
                <Button onClick={() => setIsAddIdeaOpen(true)}>Nova Ideia</Button>
            </CardHeader>
            <CardContent className="space-y-4">
                <AddIdeaDialog isOpen={isAddIdeaOpen} onOpenChange={setIsAddIdeaOpen} />
                {isLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                ) : ideas && ideas.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {ideas.map((idea) => (
                            <IdeaCard key={idea.id} idea={idea} />
                        ))}
                    </div>
                ) : (
                    <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                        <p>Nenhuma ideia proposta ainda. Seja o primeiro a compartilhar!</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

const TimelineEventsTab = () => (
  <Card>
    <CardHeader>
      <CardTitle>Linha do Tempo & Eventos</CardTitle>
      <CardDescription>Acompanhe os eventos acadêmicos como bancas, seminários e visitas técnicas.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
        <Button>Novo Evento</Button>
        <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
            <p>Em breve: Linha do tempo de eventos e filtros.</p>
        </div>
    </CardContent>
  </Card>
);

const CelebrationsTab = () => (
  <Card>
    <CardHeader>
      <CardTitle>Parabéns & Conquistas</CardTitle>
      <CardDescription>Celebre os aniversários e as conquistas dos nossos colegas.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
        <Button>Registrar Conquista</Button>
        <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
            <p>Em breve: Lista de aniversariantes e conquistas.</p>
        </div>
    </CardContent>
  </Card>
);

const CoffeeChatTab = () => (
  <Card>
    <CardHeader>
      <CardTitle>Café das Ideias</CardTitle>
      <CardDescription>Um espaço para conversas e trocas de experiências informais.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
        <Button>Novo Tópico</Button>
        <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
            <p>Em breve: Fórum com tópicos e respostas.</p>
        </div>
    </CardContent>
  </Card>
);


export default function CommunityPage() {

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-primary">Comunidade Docente</h1>
        <p className="text-muted-foreground">
          Um espaço para fortalecer a colaboração, o reconhecimento e a troca de ideias.
        </p>
      </div>

      <Tabs defaultValue="ideas" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
          <TabsTrigger value="ideas" className="flex flex-col sm:flex-row gap-2 py-2">
            <BrainCircuit className="h-5 w-5" />
            <span>Clube das Ideias</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex flex-col sm:flex-row gap-2 py-2">
            <CalendarClock className="h-5 w-5" />
            <span>Linha do Tempo</span>
          </TabsTrigger>
          <TabsTrigger value="celebrations" className="flex flex-col sm:flex-row gap-2 py-2">
             <PartyPopper className="h-5 w-5" />
             <span>Conquistas</span>
          </TabsTrigger>
          <TabsTrigger value="forum" className="flex flex-col sm:flex-row gap-2 py-2">
            <Coffee className="h-5 w-5" />
            <span>Café das Ideias</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="ideas" className="mt-6">
          <IdeasClubTab />
        </TabsContent>
        <TabsContent value="timeline" className="mt-6">
          <TimelineEventsTab />
        </TabsContent>
        <TabsContent value="celebrations" className="mt-6">
          <CelebrationsTab />
        </TabsContent>
        <TabsContent value="forum" className="mt-6">
          <CoffeeChatTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
