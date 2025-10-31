import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function StudentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-primary">Gerenciamento de Alunos</h1>
       <Card>
        <CardHeader>
          <CardTitle>Em Breve</CardTitle>
        </CardHeader>
        <CardContent>
          <p>A funcionalidade de importação e gerenciamento de alunos via CSV estará disponível aqui.</p>
        </CardContent>
      </Card>
    </div>
  );
}
