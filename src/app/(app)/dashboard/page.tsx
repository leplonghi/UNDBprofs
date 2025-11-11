'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import type { Course, AcademicEvent, Classroom } from '@/types';
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

  const [classroomsCount, setClassroomsCount] = useState<number | null>(null);
  const [studentsCount, setStudentsCount] = useState<number | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [classroomsByCourse, setClassroomsByCourse] = useState<Record<string, Classroom[]>>({});

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
    

  useEffect(() => {
    async function getBackendStats() {
      if (!user || !firestore) return;
      if (isLoadingCourses) return;
      if (!courses) {
        setIsLoadingStats(false);
        setClassroomsCount(0);
        setStudentsCount(0);
        return;
      };

      setIsLoadingStats(true);
      
      const classroomPromises = courses.map(course => 
        getDocs(collection(firestore, `professors/${user.uid}/courses/${course.id}/classrooms`))
      );
      
      const classroomSnapshots = await Promise.all(classroomPromises);

      let totalClassrooms = 0;
      let totalStudents = 0;
      const classroomsByCourseData: Record<string, Classroom[]> = {};
      
      const studentCountPromises = [];

      for (let i = 0; i < courses.length; i++) {
        const course = courses[i];
        const classroomSnapshot = classroomSnapshots[i];
        const courseClassrooms = classroomSnapshot.docs.map(doc => doc.data() as Classroom);

        classroomsByCourseData[course.id] = courseClassrooms;
        totalClassrooms += courseClassrooms.length;

        for (const classroom of courseClassrooms) {
            const studentsRef = collection(firestore, `professors/${user.uid}/courses/${course.id}/classrooms/${classroom.id}/classroomStudents`);
            studentCountPromises.push(getDocs(studentsRef));
        }
      }

      const studentSnapshots = await Promise.all(studentCountPromises);
      totalStudents = studentSnapshots.reduce((acc, snap) => acc + snap.size, 0);

      setClassroomsByCourse(classroomsByCourseData);
      setClassroomsCount(totalClassrooms);
      setStudentsCount(totalStudents);
      setIsLoadingStats(false);
    }

    getBackendStats();
  }, [user, firestore, courses, isLoadingCourses]);

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
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div className="flex-grow">
                                <CardTitle className="text-xl text-primary">{welcomeMessage}</CardTitle>
                                <CardDescription>
                                    Veja um resumo de suas atividades ou siga o guia rápido.
                                </CardDescription>
                            </div>
                            <AccordionTrigger className="text-sm font-semibold p-2 -mr-2 -mt-1">
                                Mostrar/Ocultar Tutorial
                            </AccordionTrigger>
                        </div>
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
                Conversar com o UNDBBot
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
