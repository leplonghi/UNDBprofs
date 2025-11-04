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
import { OverviewChart } from '@/components/dashboard/overview-chart';
import { Button } from '@/components/ui/button';
import { PlusCircle, LayoutGrid, BookOpenCheck } from 'lucide-react';
import { TutorialTab } from '@/components/dashboard/tutorial-tab';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();

  const [classroomsCount, setClassroomsCount] = useState<number | null>(null);
  const [studentsCount, setStudentsCount] = useState<number | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [studentsPerCourse, setStudentsPerCourse] = useState<{ name: string; students: number }[]>([]);
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
      if (!user || !firestore || !courses) {
        setIsLoadingStats(!isLoadingCourses);
        return;
      }
      setIsLoadingStats(true);
      
      let totalClassrooms = 0;
      let totalStudents = 0;
      const studentsPerCourseData: { name: string; students: number }[] = [];
      const classroomsByCourseData: Record<string, Classroom[]> = {};

      for (const course of courses) {
        const classroomsRef = collection(
          firestore,
          `professors/${user.uid}/courses/${course.id}/classrooms`
        );
        const classroomSnapshot = await getDocs(classroomsRef);
        const courseClassrooms = classroomSnapshot.docs.map(doc => doc.data() as Classroom);
        classroomsByCourseData[course.id] = courseClassrooms;
        totalClassrooms += courseClassrooms.length;

        let courseStudentCount = 0;
        for (const classroomDoc of courseClassrooms) {
          const studentsRef = collection(
            firestore,
            `professors/${user.uid}/courses/${course.id}/classrooms/${classroomDoc.id}/classroomStudents`
          );
          const studentsSnapshot = await getDocs(studentsRef);
          courseStudentCount += studentsSnapshot.size;
        }
        totalStudents += courseStudentCount;
        studentsPerCourseData.push({ name: course.code, students: courseStudentCount });
      }
      
      setClassroomsByCourse(classroomsByCourseData);
      setClassroomsCount(totalClassrooms);
      setStudentsCount(totalStudents);
      setStudentsPerCourse(studentsPerCourseData);
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
      
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:bg-accent/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <LayoutGrid className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Visão Geral</h2>
                <p className="text-sm text-muted-foreground">Métricas e resumos das suas atividades.</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Link href="/ajuda">
          <Card className="hover:bg-accent/50 transition-colors h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400">
                  <BookOpenCheck className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Tutorial Rápido</h2>
                  <p className="text-sm text-muted-foreground">Aprenda a usar os principais recursos.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

       <div className="space-y-6">
          <StatsCards
            totalDisciplinas={totalDisciplinas}
            totalTurmas={classroomsCount}
            totalAlunos={studentsCount}
            totalAtividades={totalAtividades}
            isLoading={isLoading || isLoadingStats}
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <RecentCourses courses={courses || []} classroomsByCourse={classroomsByCourse} isLoading={isLoadingCourses || isLoadingStats} />
            </div>
            <div className="lg:col-span-2">
              <OverviewChart data={studentsPerCourse} isLoading={isLoadingStats} />
            </div>
          </div>
        </div>
    </div>
  );
}
