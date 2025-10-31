import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { placeholderStats } from '@/lib/placeholder-data';
import { BookCopy, Users, GraduationCap, CalendarClock } from 'lucide-react';

const iconMap = {
  "Total de Disciplinas": BookCopy,
  "Total de Turmas": Users,
  "Total de Alunos": GraduationCap,
  "Atividades Agendadas": CalendarClock,
};

export function StatsCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {placeholderStats.map((stat) => {
        const Icon = iconMap[stat.title as keyof typeof iconMap] || BookCopy;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
