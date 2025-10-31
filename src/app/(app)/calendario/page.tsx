import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CalendarPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-primary">Calendário Acadêmico</h1>
       <Card>
        <CardHeader>
          <CardTitle>Em Breve</CardTitle>
        </CardHeader>
        <CardContent>
          <p>A visualização do calendário com eventos importantes, aulas e prazos estará disponível aqui.</p>
        </CardContent>
      </Card>
    </div>
  );
}
