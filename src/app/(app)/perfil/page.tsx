import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-primary">Perfil do Usuário</h1>
       <Card>
        <CardHeader>
          <CardTitle>Em Breve</CardTitle>
        </CardHeader>
        <CardContent>
          <p>As informações do seu perfil e configurações de conta estarão disponíveis aqui.</p>
        </CardContent>
      </Card>
    </div>
  );
}
