'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CoursesTable } from '@/components/courses/courses-table';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function CoursesPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Minhas Disciplinas</h1>
        <div className="flex items-center gap-2">
          <Button onClick={() => router.push('/disciplinas/nova')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar/Importar Disciplina
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Disciplinas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <CoursesTable />
        </CardContent>
      </Card>
    </div>
  );
}
