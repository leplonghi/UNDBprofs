'use client';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { placeholderChartData } from '@/lib/placeholder-data';

export function OverviewChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Visão Geral</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={placeholderChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip
                        contentStyle={{
                            background: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)",
                        }}
                    />
                    <Legend />
                    <Bar dataKey="Novos Alunos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Alunos Ativos" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
