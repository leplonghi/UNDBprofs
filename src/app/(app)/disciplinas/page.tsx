'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ClassroomsList } from '@/components/courses/classrooms-list';
import { NewClassroomDialog } from '@/components/courses/new-classroom-dialog';

export default function CoursesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Minhas Turmas</h1>
        <NewClassroomDialog />
      </div>
      <Card>
        <CardContent className="p-0">
          <ClassroomsList />
        </CardContent>
      </Card>
    </div>
  );
}
