'use client';
import React from 'react';
import {
  useUser,
  useFirestore,
  useMemoFirebase,
  useCollection,
} from '@/firebase';
import type { Classroom, ClassroomStudent, Activity } from '@/types';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import { StudentUploadDialog } from '@/components/courses/student-upload-dialog';
import { ClassroomStudentsTable } from '@/components/courses/classroom-students-table';
import { StudentGroups } from '@/components/courses/student-groups';
import { Badge } from '@/components/ui/badge';
import { ClassAnalytics } from './class-analytics';

export function ClassroomTabs({
  courseId,
  courseCode,
}: {
  courseId: string;
  courseCode: string;
}) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isStudentUploadOpen, setIsStudentUploadOpen] = React.useState(false);

  const classroomQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(
        firestore,
        `professors/${user.uid}/courses/${courseId}/classrooms`
      )
    );
  }, [user, firestore, courseId]);

  const { data: classrooms, isLoading: isLoadingClassrooms } =
    useCollection<Classroom>(classroomQuery);

  const classroom = classrooms?.[0];
  const classroomId = classroom?.id;

  const studentsQuery = useMemoFirebase(() => {
    if (!user || !firestore || !classroomId) return null;
    return collection(
      firestore,
      `professors/${user.uid}/courses/${courseId}/classrooms/${classroomId}/classroomStudents`
    );
  }, [user, firestore, courseId, classroomId]);

  const { data: classroomStudents, isLoading: isLoadingStudents } =
    useCollection<ClassroomStudent>(studentsQuery);

  if (isLoadingClassrooms) {
    return <Skeleton className="h-60 w-full" />;
  }

  if (!classroom) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        Nenhuma turma encontrada para esta disciplina.
      </div>
    );
  }

  const activities: Activity[] = classroom.activities || [];

  return (
    <>
      <StudentUploadDialog
        isOpen={isStudentUploadOpen}
        onOpenChange={setIsStudentUploadOpen}
        classroomId={classroom.id}
        courseId={courseId}
      />
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Turma: {classroom.name}</h2>
            <div className="text-muted-foreground">
              Semestre: {classroom.semester} | Carga Horária:{' '}
              {classroom.workload} | Tipo:{' '}
              <Badge variant="outline">{classroom.classType}</Badge>
            </div>
          </div>
        </div>

        <Tabs defaultValue="students" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="students">Alunos</TabsTrigger>
            <TabsTrigger value="grades">Lançamento de Notas</TabsTrigger>
            <TabsTrigger value="analytics">Análise da Turma</TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="mt-6">
            <div className="flex justify-end mb-4">
              <Button onClick={() => setIsStudentUploadOpen(true)}>
                <Users className="mr-2 h-4 w-4" />
                Adicionar Alunos
              </Button>
            </div>
            <ClassroomStudentsTable
              courseId={courseId}
              classroomId={classroom.id}
              classroomStudents={classroomStudents ?? []}
              isLoading={isLoadingStudents}
            />
          </TabsContent>

          <TabsContent value="grades" className="mt-6">
            <StudentGroups
              courseId={courseId}
              classroomId={classroom.id}
              classroomStudents={classroomStudents ?? []}
              isLoading={isLoadingStudents}
              activities={activities}
            />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
             <ClassAnalytics
              classroomStudents={classroomStudents ?? []}
              isLoading={isLoadingStudents}
              activities={activities}
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
