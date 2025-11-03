'use client';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartTooltipContent, ChartTooltip, ChartContainer } from '@/components/ui/chart';
import { Skeleton } from '../ui/skeleton';


interface OverviewChartProps {
  data: { name: string; students: number }[];
  isLoading: boolean;
}

export function OverviewChart({ data, isLoading }: OverviewChartProps) {
  const chartConfig = {
    students: {
      label: 'Alunos',
      color: 'hsl(var(--primary))',
    },
  };

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-[350px] w-full" />
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alunos por Disciplina</CardTitle>
        <CardDescription>
            Visão geral da quantidade de alunos em cada disciplina.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <ResponsiveContainer>
                <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="name"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value.slice(0, 10)}
                />
                <YAxis />
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="students" fill="var(--color-students)" radius={4} />
                </BarChart>
            </ResponsiveContainer>
            </ChartContainer>
        ) : (
            <div className="h-[350px] w-full flex items-center justify-center">
                <p className="text-muted-foreground text-center">
                    Nenhum dado de aluno para exibir.<br/>Adicione disciplinas e alunos para ver o gráfico.
                </p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
