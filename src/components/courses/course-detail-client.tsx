'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
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
import type { Course, Classroom, ClassScheduleItem, Activity } from '@/types';
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
import { Edit, ArrowLeft } from 'lucide-react';
import { ClassroomTabs } from '@/components/courses/classroom-tabs';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

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
  const router = useRouter();
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Plano de Ensino e Cronograma</CardTitle>
            <CardDescription>
              Detalhes, estrutura e cronograma da disciplina.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push(`/disciplinas/${course.id}/editar`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-semibold">Ementa</h3>
          <p className="text-muted-foreground">{course.syllabus}</p>
        </div>

        {course.learningUnits && course.learningUnits.length > 0 && (
           <div>
            <h3 className="font-semibold mb-2">Unidades de Aprendizagem</h3>
            <Accordion type="multiple" className="w-full">
                {course.learningUnits.map((unit, index) => (
                    <AccordionItem value={`unit-${index}`} key={index}>
                        <AccordionTrigger>{unit.name}</AccordionTrigger>
                        <AccordionContent>
                            <p className="text-muted-foreground whitespace-pre-wrap">{unit.content}</p>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
           </div>
        )}

        {course.competencyMatrix && course.competencyMatrix.length > 0 && (
             <div>
                <h3 className="font-semibold mb-2">Matriz de Competências</h3>
                <Accordion type="multiple" className="w-full border rounded-md px-4">
                    {course.competencyMatrix.map((comp, compIndex) => (
                        <AccordionItem value={`comp-${compIndex}`} key={compIndex} className="border-b-0 last:border-b-0">
                            <AccordionTrigger className="text-base font-semibold">{comp.competency}</AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-4 pl-4">
                                    {comp.skills.map((skill, skillIndex) => (
                                        <div key={skillIndex}>
                                            <h4 className="font-medium">{skill.skill}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                <strong>Descritores:</strong> {skill.descriptors}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
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
            <h3 className="font-semibold mb-2">Bibliografia</h3>
            <div className="rounded-md border">
              <Table>
                <TableBody>
                  {course.bibliography.basic && (
                    <TableRow>
                      <TableCell className="w-[150px] font-medium text-muted-foreground bg-muted/50 align-top">
                        Básica
                      </TableCell>
                      <TableCell>
                        <pre className="whitespace-pre-wrap font-sans text-sm">
                          {course.bibliography.basic}
                        </pre>
                      </TableCell>
                    </TableRow>
                  )}
                  {course.bibliography.complementary && (
                    <TableRow>
                      <TableCell className="w-[150px] font-medium text-muted-foreground bg-muted/50 align-top">
                        Complementar
                      </TableCell>
                      <TableCell>
                        <pre className="whitespace-pre-wrap font-sans text-sm">
                          {course.bibliography.complementary}
                        </pre>
                      </TableCell>
                    </TableRow>
                  )}
                  {course.bibliography.recommended && (
                    <TableRow>
                      <TableCell className="w-[150px] font-medium text-muted-foreground bg-muted/50 align-top">
                        Recomendada
                      </TableCell>
                      <TableCell>
                        <pre className="whitespace-pre-wrap font-sans text-sm">
                          {course.bibliography.recommended}
                        </pre>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
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
                    <TableHead className="w-[100px]">Data</TableHead>
                    <TableHead className="w-[150px]">Tipo</TableHead>
                    <TableHead>Tópico</TableHead>
                    <TableHead>Conteúdo</TableHead>
                    <TableHead>Atividade</TableHead>
                    <TableHead className="w-[150px]">Local</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classroom.classSchedule
                    .sort(
                      (a, b) =>
                        new Date(a.date).getTime() - new Date(b.date).getTime()
                    )
                    .map((scheduleItem, index) => {
                      const isHoliday = scheduleItem.content
                        .toLowerCase()
                        .includes('feriado');
                      return (
                        <TableRow
                          key={index}
                          className={cn(
                            isHoliday && 'bg-muted/50 text-muted-foreground'
                          )}
                        >
                          <TableCell className="font-medium">
                            {scheduleItem.date}
                          </TableCell>
                          <TableCell>
                            <Badge variant={isHoliday ? 'secondary' : 'outline'}>
                              {scheduleItem.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {scheduleItem.topic}
                          </TableCell>
                          <TableCell>{scheduleItem.content}</TableCell>
                          <TableCell>{scheduleItem.activity}</TableCell>
                          <TableCell>{scheduleItem.location}</TableCell>
                        </TableRow>
                      );
                    })}
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


export function CourseDetailClient({ courseId }: { courseId: string }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const courseDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, `professors/${user.uid}/courses/${courseId}`);
  }, [user, firestore, courseId]);

  const { data: course, isLoading: isCourseLoading } =
    useDoc<Course>(courseDocRef);

  const classroomQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(
        firestore,
        `professors/${user.uid}/courses/${courseId}/classrooms`
      )
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
      <div className="flex flex-col gap-6">
         <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold text-destructive">
            Disciplina não encontrada
            </h1>
        </div>
        <p className="text-muted-foreground">
          A disciplina que você está procurando não existe ou você não tem
          permissão para vê-la.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className='flex-grow flex items-center justify-between'>
            <h1 className="text-2xl font-bold text-primary">{course.name}</h1>
            <Badge variant="outline">{course.code}</Badge>
        </div>
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
          <ClassroomTabs courseId={course.id} courseCode={course.code} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
