'use client';

import React, { useEffect, useState } from 'react';
import { OverviewChart } from '@/components/dashboard/overview-chart';
import { RecentCourses } from '@/components/dashboard/recent-courses';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, getDocs, type Firestore, query } from 'firebase/firestore';
import type { Course } from '@/types';

async function getBackendStats(firestore: Firestore, userId: string): Promise<{ totalTurmas: number; totalAlunos: number; totalAtividades: number }> {
    const coursesQuery = query(collection(firestore, `professors/${userId}/courses`));
    const coursesSnapshot = await getDocs(coursesQuery);

    if (coursesSnapshot.empty) {
        return { totalTurmas: 0, totalAlunos: 0, totalAtividades: 0 };
    }

    const courseIds = coursesSnapshot.docs.map(doc => doc.id);
    
    const classroomPromises = courseIds.map(courseId => 
        getDocs(collection(firestore, `professors/${userId}/courses/${courseId}/classrooms`))
    );

    const eventPromises = courseIds.map(courseId => 
        getDocs(collection(firestore, `professors/${userId}/courses/${courseId}/academicEvents`))
    );

    const classroomSnapshots = await Promise.all(classroomPromises);
    const eventSnapshots = await Promise.all(eventPromises);

    const totalTurmas = classroomSnapshots.reduce((sum, snap) => sum + snap.size, 0);
    const totalAtividades = eventSnapshots.reduce((sum, snap) => sum + snap.size, 0);

    const studentPromises: Promise<any>[] = [];
    classroomSnapshots.forEach((classroomSnapshot, index) => {
        const courseId = courseIds[index];
        classroomSnapshot.docs.forEach(classroomDoc => {
            const studentsRef = collection(firestore, `professors/${userId}/courses/${courseId}/classrooms/${classroomDoc.id}/classroomStudents`);
            studentPromises.push(getDocs(studentsRef));
        });
    });
    
    const studentSnapshots = await Promise.all(studentPromises);
    const totalAlunos = studentSnapshots.reduce((sum, snap) => sum + snap.size, 0);

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
