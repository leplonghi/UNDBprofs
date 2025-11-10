'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export default function FeedbackPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    toast({
      title: 'Feedback Enviado!',
      description: 'Obrigado por sua contribuição. Estamos sempre trabalhando para melhorar!',
    });
    router.push('/dashboard');
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-primary">Enviar Feedback</h1>
          <p className="text-muted-foreground">
            Sua opinião é fundamental para a evolução do UNDBProf.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Sugestões, Críticas ou Bugs</CardTitle>
          <CardDescription>
            Encontrou um problema, tem uma ideia para um novo recurso ou quer
            apenas deixar um comentário? Use o espaço abaixo.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid w-full gap-1.5">
              <Label htmlFor="message">Sua mensagem</Label>
              <Textarea
                placeholder="Descreva sua sugestão ou o problema encontrado..."
                id="message"
                rows={8}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              <Send className="mr-2 h-4 w-4" />
              Enviar Feedback
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
