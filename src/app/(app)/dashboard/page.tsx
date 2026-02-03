'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Course, AcademicEvent } from '@/types';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { RecentCourses } from '@/components/dashboard/recent-courses';
import { UpcomingEvents } from '@/components/dashboard/upcoming-events';
import { TutorialCard } from '@/components/dashboard/tutorial-tab';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { assistantEventEmitter } from '@/components/assistant/chat-assistant';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


export default function DashboardPage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();

  const coursesQuery = useMemoFirebase(
    () => (user ? query(collection(firestore, `professors/${user.uid}/courses`)) : null),
    [user, firestore]
  );
  const { data: courses, isLoading: isLoadingCourses } =
    useCollection<Course>(coursesQuery);

  const academicEventsQuery = useMemoFirebase(
    () =>
      user
        ? query(collection(firestore, `professors/${user.uid}/academicEvents`))
        : null,
    [user, firestore]
  );
  const { data: academicEvents, isLoading: isLoadingEvents } =
    useCollection<AcademicEvent>(academicEventsQuery);

  const { classroomsCount, studentsCount, classroomsByCourse, isLoadingStats } = useDashboardStats(user, courses);

  const totalDisciplinas = courses?.length ?? 0;
  const totalAtividades = academicEvents?.length ?? 0;

  const isLoading = isLoadingCourses || isLoadingEvents;

  const welcomeMessage = useMemo(() => {
    if (!user) return 'Olá!';
    const firstName = user.displayName?.split(' ')[0] || 'Professor(a)';
    return `Olá, ${firstName}!`;
  }, [user]);

  const openAssistant = () => {
    assistantEventEmitter.emit('open');
  };

  return (
    <div className="flex flex-col gap-6">

      <Card>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="tutorial" className="border-b-0">
            <CardHeader className="flex-row items-start justify-between">
              <div>
                <CardTitle className="text-xl text-primary">{welcomeMessage}</CardTitle>
                <CardDescription>
                  Veja um resumo de suas atividades ou siga o guia rápido.
                </CardDescription>
              </div>
              <AccordionTrigger className="text-sm font-semibold p-2 -mr-2 -mt-1 ml-4 whitespace-nowrap">
                Mostrar/Ocultar Tutorial
              </AccordionTrigger>
            </CardHeader>
            <AccordionContent className="px-6 pb-4">
              <TutorialCard />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>


      <div className="space-y-6">
        <StatsCards
          totalDisciplinas={totalDisciplinas}
          totalTurmas={classroomsCount}
          totalAlunos={studentsCount}
          totalAtividades={totalAtividades}
          isLoading={isLoading || isLoadingStats}
        />

        <Card className="animated-gradient-background">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Assistente Docente</CardTitle>
              <CardDescription>Precisa de ajuda? Tire suas dúvidas sobre o app, suas disciplinas e prazos.</CardDescription>
            </div>
            <Button onClick={openAssistant}>
              <Bot className="mr-2 h-4 w-4" />
              Conversar com o UNDBot
            </Button>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentCourses courses={courses || []} classroomsByCourse={classroomsByCourse} isLoading={isLoadingCourses || isLoadingStats} />
          <UpcomingEvents events={academicEvents} courses={courses} isLoading={isLoadingEvents || isLoadingCourses} />
        </div>
      </div>
    </div>
  );
}
