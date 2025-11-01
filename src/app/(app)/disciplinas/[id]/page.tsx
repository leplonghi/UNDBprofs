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
import { doc, collection } from 'firebase/firestore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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

function ClassroomsList({ courseId }: { courseId: string }) {
  const { user } = useUser();
  const firestore = useFirestore();

  const classroomsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(
      firestore,
      `professors/${user.uid}/courses/${courseId}/classrooms`
    );
  }, [user, firestore, courseId]);

  const { data: classrooms, isLoading } =
    useCollection<Classroom>(classroomsQuery);

  if (isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (!classrooms || classrooms.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Turmas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            Nenhuma turma encontrada para esta disciplina.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
       <h2 className="text-xl font-bold text-primary">Turmas</h2>
      {classrooms.map((classroom) => (
        <Card key={classroom.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{classroom.name}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{classroom.semester}</Badge>
                <Badge variant="outline">{classroom.workload}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="schedule">
                <AccordionTrigger>Ver Cronograma de Aulas</AccordionTrigger>
                <AccordionContent>
                  {classroom.classSchedule && classroom.classSchedule.length > 0 ? (
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
                            <TableCell>{scheduleItem.date}</TableCell>
                            <TableCell>{scheduleItem.content}</TableCell>
                            <TableCell>{scheduleItem.activity}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="py-4 text-center text-muted-foreground">
                      Nenhum cronograma de aulas para esta turma.
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      ))}
    </div>
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

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Gerais</CardTitle>
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
                        <p className="text-sm text-muted-foreground">{item.description}</p>
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
        
        <ClassroomsList courseId={course.id} />
        
      </div>
    </div>
  );
}
