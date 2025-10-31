import { Card, CardContent } from '@/components/ui/card';
import { CoursesTable } from '@/components/courses/courses-table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

export default function CoursesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Minhas Disciplinas</h1>
        <Button asChild>
            <Link href="/disciplinas/nova">
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova Disciplina
            </Link>
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <CoursesTable />
        </CardContent>
      </Card>
    </div>
  );
}
