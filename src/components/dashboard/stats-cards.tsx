import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookCopy, Users, GraduationCap, CalendarClock } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';

const iconMap = {
  "Total de Disciplinas": { icon: BookCopy, color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300" },
  "Total de Turmas": { icon: Users, color: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300" },
  "Total de Alunos": { icon: GraduationCap, color: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300" },
  "Atividades Agendadas": { icon: CalendarClock, color: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300" },
};

interface StatsCardsProps {
    totalDisciplinas: number;
    totalTurmas: number | null;
    totalAlunos: number | null;
    totalAtividades: number;
    isLoading: boolean;
}

export function StatsCards({ totalDisciplinas, totalTurmas, totalAlunos, totalAtividades, isLoading }: StatsCardsProps) {
  
  const stats = [
    { title: "Total de Disciplinas", value: totalDisciplinas },
    { title: "Total de Turmas", value: totalTurmas },
    { title: "Total de Alunos", value: totalAlunos },
    { title: "Atividades Agendadas", value: totalAtividades },
  ];

  if (isLoading) {
    return (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index}>
                    <CardHeader>
                        <Skeleton className="h-4 w-2/3" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-7 w-1/3" />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = iconMap[stat.title as keyof typeof iconMap].icon;
        const colorClass = iconMap[stat.title as keyof typeof iconMap].color;
        return (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-2">
               <div className={cn("p-3 rounded-full w-fit", colorClass)}>
                 <Icon className="h-6 w-6" />
               </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold">
                    {stat.value === null ? (
                        <span className="text-muted-foreground animate-pulse">...</span>
                    ) : (
                        stat.value
                    )}
                </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
