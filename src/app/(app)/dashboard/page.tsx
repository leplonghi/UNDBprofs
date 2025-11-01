'use client';

import React, { useEffect, useState } from 'react';
import { OverviewChart } from '@/components/dashboard/overview-chart';
import { RecentCourses } from '@/components/dashboard/recent-courses';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, getDocs, type Firestore, query } from 'firebase/firestore';
import type { Course } from '@/types';

async function getBackendStats(firestore: Firestore, userId: string): Promise<{ totalTurmas: number; totalAlunos: number; totalAtividades: number }> {
    const coursesRef = collection(firestore, `professors/${userId}/courses`);
    const coursesSnapshot = await getDocs(coursesRef);
    if (coursesSnapshot.empty) {
        return { totalTurmas: 0, totalAlunos: 0, totalAtividades: 0 };
    }

    let totalTurmas = 0;
    let totalAlunos = 0;
    let totalAtividades = 0;

    const promises = coursesSnapshot.docs.map(async (courseDoc) => {
        // Count classrooms
        const classroomsRef = collection(firestore, `professors/${userId}/courses/${courseDoc.id}/classrooms`);
        const classroomsSnapshot = await getDocs(classroomsRef);
        totalTurmas += classroomsSnapshot.size;

        // Count students in each classroom
        const studentPromises = classroomsSnapshot.docs.map(async (classroomDoc) => {
            const studentsRef = collection(firestore, `professors/${userId}/courses/${courseDoc.id}/classrooms/${classroomDoc.id}/classroomStudents`);
            const studentsSnapshot = await getDocs(studentsRef);
            totalAlunos += studentsSnapshot.size;
        });
        await Promise.all(studentPromises);

        // Count academic events
        const eventsRef = collection(firestore, `professors/${userId}/courses/${courseDoc.id}/academicEvents`);
        const eventsSnapshot = await getDocs(eventsRef);
        totalAtividades += eventsSnapshot.size;
    });

    await Promise.all(promises);

    return { totalTurmas, totalAlunos, totalAtividades };
}

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [stats, setStats] = useState({ totalTurmas: 0, totalAlunos: 0, totalAtividades: 0 });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const coursesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `professors/${user.uid}/courses`));
  }, [user, firestore]);

  const { data: courses, isLoading: coursesLoading } = useCollection<Course>(coursesQuery);

  useEffect(() => {
    if (user && firestore) {
        setIsLoadingStats(true);
        getBackendStats(firestore, user.uid)
            .then(newStats => {
                setStats(newStats);
            })
            .catch(error => {
                console.error("Error fetching backend stats:", error);
            })
            .finally(() => {
                setIsLoadingStats(false);
            });
    } else if (!user && !coursesLoading) {
      // If there's no user and we are not loading courses, all stats are 0.
      setIsLoadingStats(false);
      setStats({ totalTurmas: 0, totalAlunos: 0, totalAtividades: 0 });
    }
  }, [user, firestore, coursesLoading]);


  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-primary">Painel do Professor</h1>
      <StatsCards 
        totalDisciplinas={courses?.length ?? 0}
        totalTurmas={stats.totalTurmas}
        totalAlunos={stats.totalAlunos}
        totalAtividades={stats.totalAtividades}
        isLoading={coursesLoading || isLoadingStats}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <OverviewChart />
        <RecentCourses courses={courses ?? []} isLoading={coursesLoading} />
      </div>
    </div>
  );
}
