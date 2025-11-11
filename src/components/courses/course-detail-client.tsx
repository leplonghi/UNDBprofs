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
import { Skeleton } from '@/components/ui/skeleton';
import {
  useDoc,
  useUser,
  useFirestore,
  useMemoFirebase,
  useCollection,
} from '@/firebase';
import type { Course, Classroom, ClassScheduleItem, Activity, LearningUnit, Competency } from '@/types';
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

interface GroupedScheduleItem {
    unit: LearningUnit;
    competency: Competency;
    unitWorkload: string;
    scheduleItems: ClassScheduleItem[];
}

function CourseInformation({
  course,
  classroom,
}: {
  course: Course;
  classroom: Classroom | undefined;
}) {
  const router = useRouter();
  
  const { user } = useUser();
  const thematicTreeColors = [
      'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800',
      'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
      'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
      'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800',
      'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800',
  ];

  const groupedSchedule = useMemo(() => {
    if (!course.learningUnits || !course.competencyMatrix || !classroom?.classSchedule) {
      return [];
    }

    // Map schedule items by their topic for quick lookup
    const scheduleByTopic = (classroom.classSchedule || []).reduce((acc, item) => {
        const key = item.topic.trim();
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(item);
        return acc;
    }, {} as Record<string, ClassScheduleItem[]>);
    
    // Calculate total workload for each unit from the schedule
    const unitWorkloads = Object.entries(scheduleByTopic).reduce((acc, [topic, items]) => {
        const totalHours = items.reduce((sum, item) => {
            const hours = parseInt(item.activity.match(/(\d+)h/)?.[1] || '0');
            return sum + hours;
        }, 0);
        acc[topic] = `${totalHours}h`;
        return acc;
    }, {} as Record<string, string>);
    
    // Assuming a 1-to-1 mapping between learningUnits and competencyMatrix items by order
    return course.learningUnits.map((unit, index) => {
      const competency = course.competencyMatrix![index];
      const scheduleItems = scheduleByTopic[unit.name.trim()] || [];
      return {
        unit,
        competency,
        unitWorkload: unitWorkloads[unit.name.trim()] || '0h',
        scheduleItems,
      };
    });

  }, [course.learningUnits, course.competencyMatrix, classroom?.classSchedule]);

  const totalCH = useMemo(() => {
    const total = groupedSchedule.reduce((sum, group) => {
        return sum + parseInt(group.unitWorkload.replace('h', '') || '0');
    }, 0);
    return `${total}H`;
  }, [groupedSchedule]);


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Visualização do Plano de Ensino</CardTitle>
            <CardDescription>
              Dados extraídos do documento PDF.
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
        
        <div className="space-y-4 rounded-lg border p-4">
            <h2 className="text-center font-bold text-lg bg-gray-200 dark:bg-gray-700 py-2 rounded-t-md">PLANO DE ENSINO</h2>
            <div className="border">
                <div className='p-2 border-b'>
                    <span className="font-bold">CURSO:</span> ARQUITETURA E URBANISMO
                </div>
                 <div className="grid grid-cols-3 border-b">
                    <div className="col-span-2 p-2 border-r"><span className="font-bold">UNIDADE CURRICULAR:</span> {course.name}</div>
                    <div className="p-2"><span className="font-bold">CARGA HORÁRIA:</span> {classroom?.workload}</div>
                </div>
                <div className="grid grid-cols-3">
                    <div className="col-span-2 p-2 border-r"><span className="font-bold">PROFESSOR:</span> {user?.displayName}</div>
                    <div className="p-2"><span className="font-bold">SEMESTRE:</span> {classroom?.semester}</div>
                </div>
            </div>

            <h2 className="text-center font-bold text-lg bg-gray-200 dark:bg-gray-700 py-2 mt-4">MATRIZ DE COMPETÊNCIAS</h2>
             <div className="border">
                <div className="grid grid-cols-2">
                    <div className="p-2 border-r">
                        <h3 className="font-bold text-center mb-2">EMENTA</h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{course.syllabus}</p>
                    </div>
                    <div className="p-2">
                        <h3 className="font-bold text-center mb-2">COMPETÊNCIAS</h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{course.competencies}</p>
                         {course.objectives && (
                            <div className="mt-4">
                                <h4 className="font-bold">Objetivos:</h4>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{course.objectives}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {groupedSchedule && groupedSchedule.length > 0 && (
             <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-200 dark:bg-gray-700 font-bold">
                        <tr>
                            <th className="p-2 border-r w-1/6">UNIDADE DE APRENDIZAGEM</th>
                            <th className="p-2 border-r w-2/6">HABILIDADES</th>
                            <th className="p-2 border-r w-[80px]">CH</th>
                            <th className="p-2 border-r w-2/6">DESCRITORES</th>
                            <th className="p-2 w-[80px]">CH</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groupedSchedule.map((group, groupIndex) => (
                            <React.Fragment key={groupIndex}>
                                {group.scheduleItems.map((item, itemIndex) => (
                                    <tr key={itemIndex} className="border-b">
                                        {itemIndex === 0 && (
                                            <>
                                                <td className="p-2 border-r align-top" rowSpan={group.scheduleItems.length}>
                                                    {group.unit.name}
                                                </td>
                                                <td className="p-2 border-r align-top" rowSpan={group.scheduleItems.length}>
                                                    <ul className="list-disc pl-4 space-y-1">
                                                        {group.competency?.skills?.map((skill, skillIdx) => (
                                                          <li key={skillIdx}>{skill.skill}</li>
                                                        ))}
                                                    </ul>
                                                </td>
                                                <td className="p-2 border-r align-top text-center" rowSpan={group.scheduleItems.length}>
                                                    {group.unitWorkload}
                                                </td>
                                            </>
                                        )}
                                        <td className="p-2 border-r align-top">{item.content}</td>
                                        <td className="p-2 text-center align-top">{item.activity.match(/(\d+h)/)?.[0]}</td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                        <tr className="bg-gray-200 dark:bg-gray-700 font-bold">
                            <td colSpan={4} className="p-2 text-right border-r">TOTAL CH</td>
                            <td className="p-2 text-center">{totalCH}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        )}

        {course.thematicTree && course.thematicTree.length > 0 && (
          <div>
            <h3 className="font-semibold">Árvore Temática</h3>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
