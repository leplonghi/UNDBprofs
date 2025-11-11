
import { Card, CardContent } from '@/components/ui/card';
import { BookCopy, Users, GraduationCap, CalendarClock } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const iconMap = {
  "Total de Disciplinas": { icon: BookCopy, color: "text-blue-600 dark:text-blue-400", href: "/disciplinas" },
  "Total de Turmas": { icon: Users, color: "text-orange-600 dark:text-orange-400", href: "/disciplinas" },
  "Total de Alunos": { icon: GraduationCap, color: "text-green-600 dark:text-green-400", href: "/disciplinas" },
  "Atividades Agendadas": { icon: CalendarClock, color: "text-purple-600 dark:text-purple-400", href: "/calendario" },
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
                <Card key={index} className="p-4">
                    <Skeleton className="h-6 w-full" />
                </Card>
            ))}
        </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => {
        const cardInfo = iconMap[stat.title as keyof typeof iconMap];
        const Icon = cardInfo.icon;
        const colorClass = cardInfo.color;
        return (
          <Link key={stat.title} href={cardInfo.href} className="hover:no-underline">
            <Card className="hover:bg-accent transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Icon className={cn("h-6 w-6", colorClass)} />
                        <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    </div>
                    <div className="text-2xl font-bold">
                        {stat.value === null ? (
                            <span className="text-muted-foreground animate-pulse">...</span>
                        ) : (
                            stat.value
                        )}
                    </div>
                </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
