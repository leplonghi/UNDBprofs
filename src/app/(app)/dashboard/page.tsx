'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Course, Classroom, ClassroomStudent, AcademicEvent } from '@/types';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { RecentCourses } from '@/components/dashboard/recent-courses';
import { OverviewChart } from '@/components/dashboard/overview-chart';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();

  const coursesQuery = useMemoFirebase(
    () => (user ? collection(firestore, `professors/${user.uid}/courses`) : null),
    [user, firestore]
  );
  const { data: courses, isLoading: isLoadingCourses } = useCollection<Course>(coursesQuery);

  const academicEventsQuery = useMemoFirebase(
    () => (user ? collection(firestore, `professors/${user.uid}/academicEvents`) : null),
    [user, firestore]
  );
  const { data: academicEvents, isLoading: isLoadingEvents } = useCollection<AcademicEvent>(academicEventsQuery);

  // Note: Calculating total students and classrooms across all courses can be intensive.
  // For this dashboard, we are simplifying to keep it performant.
  // A more scalable solution might involve using Firebase Functions to aggregate this data.
  const totalDisciplinas = courses?.length ?? 0;
  const totalAtividades = academicEvents?.length ?? 0;
  
  const isLoading = isLoadingCourses || isLoadingEvents;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button onClick={() => router.push('/disciplinas/nova')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar/Importar Disciplina
          </Button>
        </div>
      </div>
      
      <StatsCards
        totalDisciplinas={totalDisciplinas}
        totalTurmas={totalDisciplinas} // Simplified: 1 classroom per course assumed for now
        totalAlunos={0} // Simplified: requires intensive queries
        totalAtividades={totalAtividades}
        isLoading={isLoading}
      />
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
            <RecentCourses courses={courses || []} isLoading={isLoadingCourses} />
        </div>
        <div className="lg:col-span-2">
           <OverviewChart />
        </div>
      </div>
    </div>
  );
}
