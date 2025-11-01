'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ClassroomsList } from '@/components/courses/classrooms-list';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { NewClassroomDialog } from '@/components/courses/new-classroom-dialog';

export default function CoursesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Minhas Turmas</h1>
        <div className="flex items-center gap-2">
            <NewClassroomDialog />
            <Button asChild>
                <Link href="/disciplinas/nova">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nova Disciplina
                </Link>
            </Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <ClassroomsList />
        </CardContent>
      </Card>
    </div>
  );
}
