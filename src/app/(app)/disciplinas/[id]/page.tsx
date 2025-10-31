'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';

// TODO: Fetch course details from backend
const course = {
  name: 'Cálculo I',
  code: 'MAT101',
  semester: '2024.1',
  workload: '96h',
  syllabus: 'Funções de uma variável, limites, derivadas e integrais.',
  objectives: 'Desenvolver a capacidade de modelagem e resolução de problemas.',
};

// TODO: Fetch classes from backend
const classes = [
    { id: '1', name: 'Turma A', students: 35 },
    { id: '2', name: 'Turma B', students: 28 },
]

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Detalhes da Disciplina</h1>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>{course.name} ({course.code})</CardTitle>
            <CardDescription>{course.semester} - {course.workload}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
                <h3 className="font-semibold">Ementa</h3>
                <p className="text-muted-foreground">{course.syllabus}</p>
            </div>
            <div>
                <h3 className="font-semibold">Objetivos</h3>
                <p className="text-muted-foreground">{course.objectives}</p>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Turmas</CardTitle>
            <Button variant="outline" size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova Turma
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {classes.length > 0 ? (
            <ul className="space-y-2">
                {classes.map(c => (
                    <li key={c.id} className="flex items-center justify-between rounded-md border p-3">
                        <div>
                            <p className="font-medium">{c.name}</p>
                            <p className="text-sm text-muted-foreground">{c.students} alunos</p>
                        </div>
                        <Button variant="ghost" size="sm">Gerenciar</Button>
                    </li>
                ))}
            </ul>
          ) : (
            <p>Nenhuma turma cadastrada para esta disciplina.</p>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
