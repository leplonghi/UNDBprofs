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
import type { Course, Classroom, ClassScheduleItem, LearningUnit, Competency } from '@/types';
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

  const groupedSchedule = useMemo(() => {
    if (!course.learningUnits || !course.competencyMatrix || !classroom?.classSchedule) {
      return [];
    }

    const scheduleByTopic = (classroom.classSchedule || []).reduce((acc, item) => {
        const key = item.topic.trim();
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(item);
        return acc;
    }, {} as Record<string, ClassScheduleItem[]>);

    const unitWorkloads = Object.entries(scheduleByTopic).reduce((acc, [topic, items]) => {
        const totalHours = items.reduce((sum, item) => {
            const hoursMatch = item.activity.match(/(\d+)h/);
            const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
            return sum + hours;
        }, 0);
        acc[topic] = `${totalHours}h`;
        return acc;
    }, {} as Record<string, string>);
    
    return course.learningUnits.map((unit, index) => {
      const competency = course.competencyMatrix?.[index] || { competency: '', skills: [] };
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
        const groupTotal = group.scheduleItems.reduce((groupSum, item) => {
             const hoursMatch = item.activity.match(/(\d+)h/);
             return groupSum + (hoursMatch ? parseInt(hoursMatch[1], 10) : 0);
        }, 0);
        return sum + groupTotal;
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
                {course.competencyMatrix && course.competencyMatrix.length > 0 && (
                    <Accordion type="multiple" className="w-full" defaultValue={['comp-0']}>
                        {course.competencyMatrix.map((comp, compIndex) => (
                            <AccordionItem key={compIndex} value={`comp-${compIndex}`} className="border-b last:border-b-0">
                                <AccordionTrigger className="text-base font-medium px-4">{comp.competency}</AccordionTrigger>
                                <AccordionContent className="p-4 bg-muted/20">
                                    <div className="space-y-4">
                                        {comp.skills.map((skill, skillIndex) => (
                                            <div key={skillIndex}>
                                                <h4 className="font-medium text-primary">{skill.skill}</h4>
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
                )}
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
                        {groupedSchedule.map((group) => {
                             const rowCount = group.scheduleItems.length || 1;
                             return (
                                <React.Fragment key={group.unit.name}>
                                    {group.scheduleItems.length > 0 ? (
                                        group.scheduleItems.map((item, itemIndex) => (
                                            <tr key={itemIndex} className="border-b">
                                                {itemIndex === 0 && (
                                                    <>
                                                        <td className="p-2 border-r align-top" rowSpan={rowCount}>
                                                            {group.unit.name}
                                                        </td>
                                                        <td className="p-2 border-r align-top" rowSpan={rowCount}>
                                                            <ul className="list-disc pl-4 space-y-1">
                                                                {group.competency?.skills?.map((skill, skillIdx) => (
                                                                <li key={skillIdx}>{skill.skill}</li>
                                                                ))}
                                                            </ul>
                                                        </td>
                                                        <td className="p-2 border-r align-top text-center" rowSpan={rowCount}>
                                                            {group.unitWorkload}
                                                        </td>
                                                    </>
                                                )}
                                                <td className="p-2 border-r align-top">{item.content}</td>
                                                <td className="p-2 text-center align-top">{item.activity.match(/(\d+h)/)?.[0]}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr className="border-b">
                                            <td className="p-2 border-r align-top">{group.unit.name}</td>
                                            <td className="p-2 border-r align-top">
                                                <ul className="list-disc pl-4 space-y-1">
                                                    {group.competency?.skills?.map((skill, skillIdx) => (
                                                        <li key={skillIdx}>{skill.skill}</li>
                                                    ))}
                                                </ul>
                                            </td>
                                            <td className="p-2 border-r align-top text-center">{group.unitWorkload}</td>
                                            <td className="p-2 border-r align-top text-center text-muted-foreground" colSpan={2}>
                                                Nenhuma aula agendada para esta unidade.
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            )
                        })}
                        <tr className="bg-gray-200 dark:bg-gray-700 font-bold">
                            <td colSpan={4} className="p-2 text-right border-r">TOTAL CH</td>
                            <td className="p-2 text-center">{totalCH}</td>
                        </tr>
                    </tbody>
                </table>
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

    