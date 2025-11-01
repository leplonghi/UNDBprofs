'use client';

import React, { useEffect, useState } from 'react';
import { OverviewChart } from '@/components/dashboard/overview-chart';
import { RecentCourses } from '@/components/dashboard/recent-courses';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, getDocs, type Firestore, query } from 'firebase/firestore';
import type { Course } from '@/types';

async function getTotalTurmas(firestore: Firestore, userId: string): Promise<number> {
    const coursesRef = collection(firestore, `professors/${userId}/courses`);
    const coursesSnapshot = await getDocs(coursesRef);
    if (coursesSnapshot.empty) {
        return 0;
    }

    let total = 0;
    const classroomPromises = coursesSnapshot.docs.map(courseDoc => {
        const classroomsRef = collection(firestore, `professors/${userId}/courses/${courseDoc.id}/classrooms`);
        return getDocs(classroomsRef);
    });

    const classroomSnapshots = await Promise.all(classroomPromises);
    classroomSnapshots.forEach(snapshot => {
        total += snapshot.size;
    });

    return total;
}

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [totalTurmas, setTotalTurmas] = useState(0);
  const [isLoadingTurmas, setIsLoadingTurmas] = useState(true);

  const coursesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `professors/${user.uid}/courses`));
  }, [user, firestore]);

  const { data: courses, isLoading: coursesLoading } = useCollection<Course>(coursesQuery);

  useEffect(() => {
    if (user && firestore) {
        setIsLoadingTurmas(true);
        getTotalTurmas(firestore, user.uid)
            .then(count => {
                setTotalTurmas(count);
            })
            .catch(error => {
                console.error("Error fetching total turmas:", error);
            })
            .finally(() => {
                setIsLoadingTurmas(false);
            });
    } else if (!user && !coursesLoading) {
      setIsLoadingTurmas(false);
      setTotalTurmas(0);
    }
  }, [user, firestore, coursesLoading]);


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
