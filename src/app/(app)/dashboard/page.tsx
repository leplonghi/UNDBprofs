'use client';

import { OverviewChart } from '@/components/dashboard/overview-chart';
import { RecentCourses } from '@/components/dashboard/recent-courses';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const coursesRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `professors/${user.uid}/courses`);
  }, [user, firestore]);

  const { data: courses, isLoading: coursesLoading } = useCollection(coursesRef);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-primary">Painel do Professor</h1>
      <StatsCards 
        totalDisciplinas={courses?.length ?? 0}
        totalTurmas={0} // Temporariamente desativado para corrigir erro de permissão
        isLoading={coursesLoading}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <OverviewChart />
        <RecentCourses />
      </div>
    </div>
  );
}
