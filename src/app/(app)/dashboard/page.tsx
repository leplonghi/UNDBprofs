import { OverviewChart } from '@/components/dashboard/overview-chart';
import { RecentCourses } from '@/components/dashboard/recent-courses';
import { StatsCards } from '@/components/dashboard/stats-cards';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-primary">Painel do Professor</h1>
      <StatsCards />
      <div className="grid gap-6 lg:grid-cols-2">
        <OverviewChart />
        <RecentCourses />
      </div>
    </div>
  );
}
