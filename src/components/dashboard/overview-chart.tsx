'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function OverviewChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Visão Geral</CardTitle>
        <CardDescription>
            Gráfico de novos alunos e atividades.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full flex items-center justify-center">
            <p className="text-muted-foreground">Em breve: um gráfico com a evolução dos seus dados.</p>
        </div>
      </CardContent>
    </Card>
  );
}
