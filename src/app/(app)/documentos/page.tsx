import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DocumentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-primary">Armazenamento de Documentos</h1>
       <Card>
        <CardHeader>
          <CardTitle>Em Breve</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Uma área para armazenar relatórios, planilhas e outros arquivos importantes estará disponível aqui.</p>
        </CardContent>
      </Card>
    </div>
  );
}
