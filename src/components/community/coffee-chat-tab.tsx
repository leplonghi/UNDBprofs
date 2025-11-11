'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export const CoffeeChatTab = () => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Café Pedagógico</CardTitle>
            <CardDescription>Crie ou participe de grupos de conversa para integrar disciplinas, estúdios e turmas.</CardDescription>
        </div>
         <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Criar Grupo
        </Button>
    </CardHeader>
    <CardContent className="space-y-4">
        <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
            <p>Em breve: Lista de grupos de conversa.</p>
        </div>
    </CardContent>
  </Card>
);

    