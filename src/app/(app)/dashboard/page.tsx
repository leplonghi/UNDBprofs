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
      if (!user || !firestore || !courses) {
        setIsLoadingStats(!isLoadingCourses);
        return;
      }
      setIsLoadingStats(true);
      
      let totalClassrooms = 0;
      let totalStudents = 0;
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
      }
      
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
      if (!user) return 'Boas-vindas!';
      const firstName = user.displayName?.split(' ')[0] || 'Professor(a)';
      return `Boas-vindas, ${firstName}!`;
  }, [user]);

  return (
    <div className="flex flex-col gap-6">
      
        <Card>
            <CardHeader>
                <CardTitle className="text-xl text-primary">{welcomeMessage}</CardTitle>
                <CardDescription>
                    Veja um resumo de suas atividades ou siga o guia rápido abaixo.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <TutorialCard />
            </CardContent>
        </Card>


       <div className="space-y-6">
          <StatsCards
            totalDisciplinas={totalDisciplinas}
            totalTurmas={classroomsCount}
            totalAlunos={studentsCount}
            totalAtividades={totalAtividades}
            isLoading={isLoading || isLoadingStats}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <RecentCourses courses={courses || []} classroomsByCourse={classroomsByCourse} isLoading={isLoadingCourses || isLoadingStats} />
             <UpcomingEvents events={academicEvents} courses={courses} isLoading={isLoadingEvents || isLoadingCourses} />
          </div>
        </div>
    </div>
  );
}
