'use client';
import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useDoc,
  useUser,
  useFirestore,
  useMemoFirebase,
  useCollection,
} from '@/firebase';
import type { Course, Classroom, ClassScheduleItem } from '@/types';
import { doc, collection, query } from 'firebase/firestore';
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

const thematicTreeColors = [
    'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800',
    'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800',
    'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800',
];

function CourseInformation({
  course,
  classroom,
}: {
  course: Course;
  classroom: Classroom | undefined;
}) {
  const router = useRouter();
  const { user } = useUser();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Visualização do Plano de Ensino</CardTitle>
            <CardDescription>
              Dados extraídos e salvos do documento PDF.
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
      <CardContent className="space-y-8">
        
        <div className="space-y-0 rounded-lg border overflow-hidden">
             <h2 className="text-center font-bold text-lg bg-gray-200 dark:bg-gray-700 py-2">PLANO DE ENSINO</h2>
            <table className="w-full text-sm border-collapse">
                <tbody>
                    <tr className="border-b">
                        <td className="p-2" colSpan={3}><span className="font-bold">CURSO:</span> ARQUITETURA E URBANISMO</td>
                    </tr>
                    <tr className="border-b">
                        <td className="p-2 border-r w-8/12" colSpan={2}><span className="font-bold">UNIDADE CURRICULAR:</span> {course.name}</td>
                        <td className="p-2 w-4/12"><span className="font-bold">CARGA HORÁRIA:</span> {classroom?.workload}</td>
                    </tr>
                    <tr>
                        <td className="p-2 border-r w-8/12" colSpan={2}><span className="font-bold">PROFESSOR:</span> {user?.displayName}</td>
                        <td className="p-2 w-4/12"><span className="font-bold">SEMESTRE:</span> {classroom?.semester}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div>
            <h2 className="text-center font-bold text-lg bg-gray-200 dark:bg-gray-700 py-2 rounded-t-lg border border-b-0">MATRIZ DE COMPETÊNCIAS</h2>
            <div className="border">
                 <table className="w-full text-sm">
                    <tbody>
                        <tr className='border-b'>
                            <td className="p-2 w-1/2 border-r align-top">
                                <h3 className="font-bold mb-2">EMENTA</h3>
                                <p className="text-muted-foreground whitespace-pre-wrap">{course.syllabus}</p>
                            </td>
                            <td className="p-2 w-1/2 align-top">
                                <h3 className="font-bold mb-2">COMPETÊNCIAS</h3>
                                <p className="text-muted-foreground whitespace-pre-wrap">{course.competencies}</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        {classroom?.classSchedule && classroom.classSchedule.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <h2 className="text-center font-bold text-lg bg-gray-200 dark:bg-gray-700 py-2 border-b">CRONOGRAMA DE AULAS</h2>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Tópico</TableHead>
                        <TableHead>Conteúdo</TableHead>
                        <TableHead>Atividade</TableHead>
                        <TableHead>Local</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {classroom.classSchedule.map((item, index) => (
                        <TableRow key={index}>
                            <TableCell>{item.date}</TableCell>
                            <TableCell>{item.type}</TableCell>
                            <TableCell>{item.topic}</TableCell>
                            <TableCell className="whitespace-pre-wrap">{item.content}</TableCell>
                            <TableCell className="whitespace-pre-wrap">{item.activity}</TableCell>
                            <TableCell>{item.location}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </div>
        )}
        
        {course.thematicTree && course.thematicTree.length > 0 && (
             <div className="space-y-4">
                <h3 className="font-semibold text-xl">Árvore Temática</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {course.thematicTree.map((item, index) => (
                        <Card key={index} className={cn(thematicTreeColors[index % thematicTreeColors.length])}>
                        <CardHeader>
                            <CardTitle className='text-lg'>{item.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                            {item.description}
                            </p>
                        </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )}

        {course.bibliography && (course.bibliography.basic || course.bibliography.complementary || course.bibliography.recommended) && (
          <div>
            <h3 className="font-semibold text-xl mb-4">Bibliografia</h3>
            <div className="rounded-md border">
              <table className="w-full">
                <tbody className='text-sm'>
                  {course.bibliography.basic && (
                    <tr className='border-b'>
                      <td className="w-[150px] p-2 font-medium text-muted-foreground bg-muted/50 align-top">
                        Básica
                      </td>
                      <td className='p-2'>
                        <pre className="whitespace-pre-wrap font-sans">
                          {course.bibliography.basic}
                        </pre>
                      </td>
                    </tr>
                  )}
                  {course.bibliography.complementary && (
                    <tr className='border-b'>
                      <td className="w-[150px] p-2 font-medium text-muted-foreground bg-muted/50 align-top">
                        Complementar
                      </td>
                      <td className='p-2'>
                        <pre className="whitespace-pre-wrap font-sans">
                          {course.bibliography.complementary}
                        </pre>
                      </td>
                    </tr>
                  )}
                  {course.bibliography.recommended && (
                    <tr>
                      <td className="w-[150px] p-2 font-medium text-muted-foreground bg-muted/50 align-top">
                        Recomendada
                      </td>
                      <td className='p-2'>
                        <pre className="whitespace-pre-wrap font-sans">
                          {course.bibliography.recommended}
                        </pre>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
       
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

      <Tabs defaultValue="info" className="w-full">
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
