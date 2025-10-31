'use client';

import { OverviewChart } from '@/components/dashboard/overview-chart';
import { RecentCourses } from '@/components/dashboard/recent-courses';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, collectionGroup } from 'firebase/firestore';

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const coursesRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `professors/${user.uid}/courses`);
  }, [user, firestore]);

  const { data: courses, isLoading: coursesLoading } = useCollection(coursesRef);

  const classroomsRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collectionGroup(firestore, 'classrooms'));
  }, [user, firestore]);

  const { data: classrooms, isLoading: classroomsLoading } = useCollection(classroomsRef);
  
  const professorClassrooms = classrooms?.filter(c => c.professorId === user?.uid);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-primary">Painel do Professor</h1>
      <StatsCards 
        totalDisciplinas={courses?.length ?? 0}
        totalTurmas={professorClassrooms?.length ?? 0}
        isLoading={coursesLoading || classroomsLoading}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <OverviewChart />
        <RecentCourses />
      </div>
    </div>
  );
}
