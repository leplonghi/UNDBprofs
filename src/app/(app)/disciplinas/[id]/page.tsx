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
import type { Course, Classroom } from '@/types';
import { doc, collection, query, limit } from 'firebase/firestore';
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

function ClassroomDetails({ courseId }: { courseId: string }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isStudentUploadOpen, setIsStudentUploadOpen] = React.useState(false);

  // Query to get the first classroom for the course
  const classroomQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(
        firestore,
        `professors/${user.uid}/courses/${courseId}/classrooms`
      ),
      limit(1)
    );
  }, [user, firestore, courseId]);

  const { data: classrooms, isLoading } = useCollection<Classroom>(classroomQuery);
  const classroom = classrooms?.[0];
  
  if (isLoading) {
    return <Skeleton className="h-60 w-full" />;
  }
  
  if (!classroom) {
      return (
          <div className="py-10 text-center text-muted-foreground">
              Nenhuma turma encontrada para esta disciplina.
          </div>
      );
  }

  return (
    <>
      <StudentUploadDialog
        isOpen={isStudentUploadOpen}
        onOpenChange={setIsStudentUploadOpen}
        classroomId={classroom.id}
        courseId={courseId}
      />
       <Tabs defaultValue="students" className="w-full">
            <Card>
                <CardHeader>
                    <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
                        <div>
                            <CardTitle>Turma: {classroom.name}</CardTitle>
                            <CardDescription>Semestre: {classroom.semester} | Carga Horária: {classroom.workload}</CardDescription>
                        </div>
                        <div className="flex w-full sm:w-auto items-center gap-2">
                             <Button onClick={() => setIsStudentUploadOpen(true)} className="w-full sm:w-auto">
                                <Users className="mr-2 h-4 w-4" />
                                Adicionar Alunos
                            </Button>
                             <TabsList className="grid grid-cols-2 w-full sm:w-auto">
                                <TabsTrigger value="students">Alunos</TabsTrigger>
                                <TabsTrigger value="schedule">Cronograma</TabsTrigger>
                            </TabsList>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <TabsContent value="students" className="mt-6">
                <ClassroomStudentsTable courseId={courseId} classroomId={classroom.id} />
            </TabsContent>
            <TabsContent value="schedule" className="mt-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Cronograma de Aulas</CardTitle>
                    </CardHeader>
                    <CardContent>
                    {classroom.classSchedule && classroom.classSchedule.length > 0 ? (
                        <div className="max-h-96 overflow-y-auto rounded-md border">
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
                                    <TableCell className="font-medium">{scheduleItem.date}</TableCell>
                                    <TableCell>{scheduleItem.content}</TableCell>
                                    <TableCell>{scheduleItem.activity}</TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="py-10 text-center text-muted-foreground">
                            Nenhum cronograma de aulas encontrado para esta turma.
                        </div>
                    )}
                    </CardContent>
                </Card>
            </TabsContent>
       </Tabs>
    </>
  );
}

export default function CourseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { id } = React.use(params);

  const courseDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, `professors/${user.uid}/courses/${id}`);
  }, [user, firestore, id]);

  const { data: course, isLoading } = useDoc<Course>(courseDocRef);

  if (isLoading) {
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
          <TabsTrigger value="info">Informações Gerais</TabsTrigger>
          <TabsTrigger value="classroom">Turma e Alunos</TabsTrigger>
        </TabsList>
        <TabsContent value="info" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Detalhes da Disciplina</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    <p className="text-muted-foreground">
                      {course.competencies}
                    </p>
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
              </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="classroom" className="mt-6">
            <ClassroomDetails courseId={course.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
