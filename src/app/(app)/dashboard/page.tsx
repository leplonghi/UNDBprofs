'use client';

import React, { useEffect, useState } from 'react';
import { OverviewChart } from '@/components/dashboard/overview-chart';
import { RecentCourses } from '@/components/dashboard/recent-courses';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, getDocs, type Firestore } from 'firebase/firestore';
import type { Course } from '@/types';

async function getTotalTurmas(firestore: Firestore, userId: string, courses: Course[]): Promise<number> {
    let total = 0;
    for (const course of courses) {
        const classroomsRef = collection(firestore, `professors/${userId}/courses/${course.id}/classrooms`);
        const snapshot = await getDocs(classroomsRef);
        total += snapshot.size;
    }
    return total;
}

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [totalTurmas, setTotalTurmas] = useState(0);
  const [isLoadingTurmas, setIsLoadingTurmas] = useState(true);

  const coursesRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `professors/${user.uid}/courses`);
  }, [user, firestore]);

  const { data: courses, isLoading: coursesLoading } = useCollection<Course>(coursesRef);

  useEffect(() => {
    if (user && firestore && courses) {
        setIsLoadingTurmas(true);
        getTotalTurmas(firestore, user.uid, courses)
            .then(count => {
                setTotalTurmas(count);
                setIsLoadingTurmas(false);
            })
            .catch(error => {
                console.error("Error fetching total turmas:", error);
                setIsLoadingTurmas(false);
            });
    } else if (!coursesLoading) {
      // If there are no courses, there are no turmas.
      setIsLoadingTurmas(false);
      setTotalTurmas(0);
    }
  }, [user, firestore, courses, coursesLoading]);


  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-primary">Painel do Professor</h1>
      <StatsCards 
        totalDisciplinas={courses?.length ?? 0}
        totalTurmas={totalTurmas}
        isLoading={coursesLoading || isLoadingTurmas}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <OverviewChart />
        <RecentCourses />
      </div>
    </div>
  );
}
