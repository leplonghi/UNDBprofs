import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { placeholderStats } from '@/lib/placeholder-data';
import { BookCopy, Users, GraduationCap, CalendarClock, Loader2 } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

const iconMap = {
  "Total de Disciplinas": BookCopy,
  "Total de Turmas": Users,
  "Total de Alunos": GraduationCap,
  "Atividades Agendadas": CalendarClock,
};

interface StatsCardsProps {
    totalDisciplinas: number;
    totalTurmas: number;
    isLoading: boolean;
}

export function StatsCards({ totalDisciplinas, totalTurmas, isLoading }: StatsCardsProps) {

  const stats = [
    { title: "Total de Disciplinas", value: totalDisciplinas, change: "" },
    { title: "Total de Turmas", value: totalTurmas, change: "" },
    { title: "Total de Alunos", value: "0", change: "" },
    { title: "Atividades Agendadas", value: "0", change: "" },
  ];

  if (isLoading) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-7 w-1/3" />
                        <Skeleton className="h-3 w-1/2 mt-2" />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = iconMap[stat.title as keyof typeof iconMap] || BookCopy;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.change && <p className="text-xs text-muted-foreground">{stat.change}</p>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
