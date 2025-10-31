import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ClassroomsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-primary">Gerenciamento de Turmas</h1>
      <Card>
        <CardHeader>
          <CardTitle>Em Breve</CardTitle>
        </CardHeader>
        <CardContent>
          <p>A funcionalidade de gerenciamento de turmas está em desenvolvimento e estará disponível em breve.</p>
        </CardContent>
      </Card>
    </div>
  );
}
