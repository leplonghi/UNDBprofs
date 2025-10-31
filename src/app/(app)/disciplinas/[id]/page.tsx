// This is a new file.
// We will add content here later when the user asks for it.
'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-primary">Detalhes da Disciplina {params.id}</h1>
       <Card>
        <CardHeader>
          <CardTitle>Turmas</CardTitle>
        </CardHeader>
        <CardContent>
          <p>A lista de turmas para esta disciplina aparecerá aqui.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Alunos</CardTitle>
        </CardHeader>
        <CardContent>
          <p>A lista de alunos para esta disciplina aparecerá aqui.</p>
        </CardContent>
      </Card>
    </div>
  );
}
