'use client';
import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useDoc,
  useUser,
  useFirestore,
  useMemoFirebase,
  useCollection,
} from '@/firebase';
import type { Course, Classroom, ClassroomStudent } from '@/types';
import { doc, collection, query } from 'firebase/firestore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import { StudentUploadDialog } from '@/components/courses/student-upload-dialog';
import { ClassroomStudentsTable } from '@/components/courses/classroom-students-table';
import { StudentGroups } from '@/components/courses/student-groups';
import { ActivitySettings } from '@/components/courses/activity-settings';

function CourseDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-1/2" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-6 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-20 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}

function CourseInformation({
  course,
  classroom,
}: {
  course: Course;
  classroom: Classroom | undefined;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Plano de Ensino e Cronograma</CardTitle>
        <CardDescription>
          Detalhes, estrutura e cronograma da disciplina.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-semibold">Ementa</h3>
          <p className="text-muted-foreground">{course.syllabus}</p>
        </div>
        <div>
          <h3 className="font-semibold">Objetivos</h3>
          <p className="text-muted-foreground">{course.objectives}</p>
        </div>
        {course.competencies && (
          <div>
            <h3 className="font-semibold">Competências</h3>
            <p className="text-muted-foreground">{course.competencies}</p>
          </div>
        )}
        {course.thematicTree && course.thematicTree.length > 0 && (
          <div>
            <h3 className="font-semibold">Árvore Temática</h3>
            <div className="mt-2 space-y-2">
              {course.thematicTree.map((item, index) => (
                <div key={index} className="p-3 border rounded-md">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        {course.bibliography && (
          <div>
            <h3 className="font-semibold">Bibliografia</h3>
            <p className="whitespace-pre-wrap text-muted-foreground">
              {course.bibliography}
            </p>
          </div>
        )}
        <div>
          <h3 className="font-semibold">Cronograma de Aulas</h3>
          {classroom &&
          classroom.classSchedule &&
          classroom.classSchedule.length > 0 ? (
            <div className="mt-2 max-h-[600px] overflow-y-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Conteúdo</TableHead>
                    <TableHead>Atividade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classroom.classSchedule.map((scheduleItem, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {scheduleItem.date}
                      </TableCell>
                      <TableCell>{scheduleItem.content}</TableCell>
                      <TableCell>{scheduleItem.activity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="mt-2 py-10 text-center text-muted-foreground border-2 border-dashed rounded-lg">
              Nenhum cronograma de aulas encontrado para esta turma.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ClassroomManager({
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

  // This logic is now safe because all hooks have been called.
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

  const activities = classroom.activities || [];

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
            <TabsTrigger value="activities">Atividades</TabsTrigger>
            <TabsTrigger value="grades">Lançamento de Notas</TabsTrigger>
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

          <TabsContent value="activities" className="mt-6">
            <ActivitySettings
              courseId={courseId}
              classroomId={classroom.id}
              activities={activities}
              classType={classroom.classType}
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
        </Tabs>
      </div>
    </>
  );
}

export function CourseDetailClient({ courseId }: { courseId: string }) {
  const { user } = useUser();
  const firestore = useFirestore();

  const courseDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, `professors/${user.uid}/courses/${courseId}`);
  }, [user, firestore, courseId]);

  const { data: course, isLoading: isCourseLoading } =
    useDoc<Course>(courseDocRef);

  const classroomQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, `professors/${user.uid}/courses/${courseId}/classrooms`)
    );
  }, [user, firestore, courseId]);

  const { data: classrooms, isLoading: areClassroomsLoading } =
    useCollection<Classroom>(classroomQuery);

  const classroom = classrooms?.[0];

  if (isCourseLoading || areClassroomsLoading) {
    return <CourseDetailsSkeleton />;
  }

  if (!course) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-destructive">
          Disciplina não encontrada
        </h1>
        <p className="text-muted-foreground">
          A disciplina que você está procurando não existe ou você não tem
          permissão para vê-la.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">{course.name}</h1>
        <Badge variant="outline">{course.code}</Badge>
      </div>

      <Tabs defaultValue="classroom" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="info">Plano de Ensino</TabsTrigger>
          <TabsTrigger value="classroom">Gerenciamento da Turma</TabsTrigger>
        </TabsList>
        <TabsContent value="info" className="mt-6">
          <CourseInformation course={course} classroom={classroom} />
        </TabsContent>
        <TabsContent value="classroom" className="mt-6">
          <ClassroomManager courseId={course.id} courseCode={course.code} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
