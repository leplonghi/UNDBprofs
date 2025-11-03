'use client';

import React from 'react';
import { OverviewChart } from '@/components/dashboard/overview-chart';
import { RecentCourses } from '@/components/dashboard/recent-courses';
import { StatsCards } from '@/components/dashboard/stats-cards';
import {
  useCollection,
  useFirestore,
  useUser,
  useMemoFirebase,
} from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Course } from '@/types';

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const coursesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `professors/${user.uid}/courses`));
  }, [user, firestore]);

  const { data: courses, isLoading: coursesLoading } =
    useCollection<Course>(coursesQuery);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-primary">Painel do Professor</h1>
      <StatsCards
        totalDisciplinas={courses?.length ?? 0}
        totalTurmas={0}
        totalAlunos={0}
        totalAtividades={0}
        isLoading={coursesLoading}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <OverviewChart />
        <RecentCourses courses={courses ?? []} isLoading={coursesLoading} />
      </div>
    </div>
  );
}
