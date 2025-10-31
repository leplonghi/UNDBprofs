'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CourseClassesPage({ params }: { params: { id: string } }) {
  const { id } = params;
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-primary">Turmas da Disciplina {id}</h1>
       <Card>
        <CardHeader>
          <CardTitle>Lista de Turmas</CardTitle>
        </CardHeader>
        <CardContent>
          <p>A lista de turmas para esta disciplina aparecerá aqui.</p>
        </CardContent>
      </Card>
    </div>
  );
}
