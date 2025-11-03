'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import type { Course, AcademicEvent } from '@/types';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { RecentCourses } from '@/components/dashboard/recent-courses';
import { OverviewChart } from '@/components/dashboard/overview-chart';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();

  const [classroomsCount, setClassroomsCount] = useState<number | null>(null);
  const [studentsCount, setStudentsCount] = useState<number | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

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
      if (!user || !firestore || !courses) {
        setIsLoadingStats(!isLoadingCourses);
        return;
      }
      setIsLoadingStats(true);
      
      let totalClassrooms = 0;
      let totalStudents = 0;

      for (const course of courses) {
        const classroomsRef = collection(
          firestore,
          `professors/${user.uid}/courses/${course.id}/classrooms`
        );
        const classroomSnapshot = await getDocs(classroomsRef);
        totalClassrooms += classroomSnapshot.size;

        for (const classroomDoc of classroomSnapshot.docs) {
          const studentsRef = collection(
            firestore,
            `professors/${user.uid}/courses/${course.id}/classrooms/${classroomDoc.id}/classroomStudents`
          );
          const studentsSnapshot = await getDocs(studentsRef);
          totalStudents += studentsSnapshot.size;
        }
      }

      setClassroomsCount(totalClassrooms);
      setStudentsCount(totalStudents);
      setIsLoadingStats(false);
    }

    getBackendStats();
  }, [user, firestore, courses, isLoadingCourses]);

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
        totalTurmas={classroomsCount}
        totalAlunos={studentsCount}
        totalAtividades={totalAtividades}
        isLoading={isLoading || isLoadingStats}
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
