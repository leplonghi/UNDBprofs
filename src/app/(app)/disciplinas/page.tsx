import { Card, CardContent } from '@/components/ui/card';
import { CoursesTable } from '@/components/courses/courses-table';
import { NewCourseDialog } from '@/components/courses/new-course-dialog';

export default function CoursesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Minhas Disciplinas</h1>
        <NewCourseDialog />
      </div>
      <Card>
        <CardContent className="p-0">
          <CoursesTable />
        </CardContent>
      </Card>
    </div>
  );
}
