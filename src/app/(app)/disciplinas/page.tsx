'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
          <Tabs defaultValue="active">
            <div className="p-4 border-b">
              <TabsList>
                <TabsTrigger value="active">Ativas</TabsTrigger>
                <TabsTrigger value="past">Anteriores</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="active">
                <ClassroomsList filter="active" />
            </TabsContent>
            <TabsContent value="past">
                <ClassroomsList filter="past" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
