'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import {
  useFirestore,
  useUser,
  useDoc,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { doc, writeBatch, query, collection } from 'firebase/firestore';
import type {
  Course,
  Classroom,
} from '@/types';
import { ClassScheduleEditor } from '@/components/import/ClassScheduleEditor';
import { Badge } from '../ui/badge';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';


const competencySchema = z.object({
    competency: z.string(),
    skills: z.array(z.object({
        skill: z.string(),
        descriptors: z.string(),
    })),
});

const learningUnitSchema = z.object({
    name: z.string(),
    content: z.string(),
});

const formSchema = z.object({
  courseName: z.string().optional(),
  courseCode: z.string().optional(),
  syllabus: z.string().optional(),
  objectives: z.string().optional(),
  competencies: z.string().optional(),
  workload: z.string().optional(),
  semester: z.string().optional(),
  classType: z.enum(['Integradora', 'Modular']).optional(),
  competencyMatrix: z.array(competencySchema).optional(),
  learningUnits: z.array(learningUnitSchema).optional(),
  thematicTree: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
      })
    )
    .optional(),
  bibliography: z.object({
    basic: z.string().optional(),
    complementary: z.string().optional(),
    recommended: z.string().optional(),
  }).optional(),
  classSchedule: z
    .array(
      z.object({
        date: z.string(),
        type: z.string(),
        topic: z.string(),
        content: z.string(),
        activity: z.string(),
        location: z.string(),
      })
    )
    .optional(),
});

type FormData = z.infer<typeof formSchema>;

export function EditCourseForm({ courseId }: { courseId: string }) {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const isMobile = useIsMobile();

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

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      courseName: '',
      courseCode: '',
      syllabus: '',
      objectives: '',
      competencies: '',
      workload: '',
      semester: '',
      classType: 'Integradora',
      competencyMatrix: [],
      learningUnits: [],
      thematicTree: [],
      bibliography: { basic: '', complementary: '', recommended: '' },
      classSchedule: [],
    },
  });

  useEffect(() => {
    if (course && classroom) {
      form.reset({
        courseName: course.name,
        courseCode: course.code,
        syllabus: course.syllabus,
        objectives: course.objectives,
        competencies: course.competencies,
        competencyMatrix: course.competencyMatrix || [],
        learningUnits: course.learningUnits || [],
        thematicTree: course.thematicTree || [],
        bibliography: course.bibliography || {
          basic: '',
          complementary: '',
          recommended: '',
        },
        workload: classroom.workload,
        semester: classroom.semester,
        classType: classroom.classType,
        classSchedule: classroom.classSchedule || [],
      });
    }
  }, [course, classroom, form]);

  async function onSubmit(values: FormData) {
    if (!user || !firestore || !course || !classroom) {
      toast({
        variant: 'destructive',
        title: 'Erro de Dados',
        description:
          'Não foi possível encontrar os dados do curso ou da turma para salvar.',
      });
      return;
    }

    setIsSaving(true);

    const courseRef = doc(firestore, `professors/${user.uid}/courses/${courseId}`);
    const classroomRef = doc(
      firestore,
      `professors/${user.uid}/courses/${courseId}/classrooms/${classroom.id}`
    );

    const updatedCourseData: Partial<Course> = {
      name: values.courseName,
      code: values.courseCode,
      syllabus: values.syllabus,
      objectives: values.objectives,
      competencies: values.competencies,
      competencyMatrix: values.competencyMatrix || [],
      learningUnits: values.learningUnits || [],
      thematicTree: values.thematicTree || [],
      bibliography: {
        basic: values.bibliography?.basic || '',
        complementary: values.bibliography?.complementary || '',
        recommended: values.bibliography?.recommended || '',
      },
    };

    const updatedClassroomData: Partial<Classroom> = {
      semester: values.semester,
      workload: values.workload,
      classType: values.classType,
      classSchedule: values.classSchedule ?? [],
    };

    try {
      const batch = writeBatch(firestore);
      batch.update(courseRef, updatedCourseData);
      batch.update(classroomRef, updatedClassroomData);
      await batch.commit();

      toast({
        title: 'Plano de Ensino Atualizado!',
        description: `As alterações em "${values.courseName}" foram salvas com sucesso.`,
      });

      router.push(`/disciplinas/${courseId}`);
    } catch (error) {
      console.error('Error updating documents: ', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao Salvar',
        description: 'Não foi possível salvar as alterações. Tente novamente.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  const detectedClassType = form.watch('classType');
  const competencyMatrix = form.watch('competencyMatrix');
  const learningUnits = form.watch('learningUnits');
  const thematicTree = form.watch('thematicTree');
  
  const thematicTreeColors = [
      'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800',
      'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
      'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
      'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800',
      'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800',
  ];

  if (isCourseLoading || areClassroomsLoading) {
    return (
      <div className="flex items-center justify-center space-x-2 text-muted-foreground p-8">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Carregando dados para edição...</span>
      </div>
    );
  }
  
  if(!course) {
      return (
        <Card>
            <CardHeader>
                <CardTitle className="text-destructive">Erro</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Disciplina não encontrada ou você não tem permissão para editá-la.</p>
                 <Button onClick={() => router.push('/disciplinas')} className="mt-4">Voltar para Disciplinas</Button>
            </CardContent>
        </Card>
    );
  }

  return (
    <div className='flex flex-col gap-6'>
        <FormProvider {...form}>
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className='flex-grow'>
                    <h1 className="text-2xl font-bold text-primary">Editar Plano de Ensino</h1>
                    <p className="text-muted-foreground">Modifique as informações da disciplina e da turma abaixo.</p>
                </div>
                 {!isMobile && (
                    <Button onClick={form.handleSubmit(onSubmit)} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Salvar
                    </Button>
                )}
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-20 md:pb-6">
                <Accordion type="multiple" defaultValue={['item-1', 'item-2', 'item-3', 'item-4', 'item-5']} className="w-full space-y-4">
                    
                    <AccordionItem value="item-1" className="border rounded-lg">
                        <AccordionTrigger className="px-6 text-lg font-semibold">Informações Gerais</AccordionTrigger>
                        <AccordionContent className="px-6 space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <FormField
                                control={form.control}
                                name="courseName"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Nome da Disciplina</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <FormField
                                control={form.control}
                                name="courseCode"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Código</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                              <FormField
                              control={form.control}
                              name="semester"
                              render={({ field }) => (
                                  <FormItem>
                                  <FormLabel>Semestre</FormLabel>
                                  <FormControl>
                                      <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                  </FormItem>
                              )}
                              />
                              <FormField
                              control={form.control}
                              name="workload"
                              render={({ field }) => (
                                  <FormItem>
                                  <FormLabel>Carga Horária</FormLabel>
                                  <FormControl>
                                      <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                  </FormItem>
                              )}
                              />
                              <div className="space-y-2">
                              <FormLabel>Tipo da Turma</FormLabel>
                              <div className="flex items-center h-10">
                                  <Badge
                                  variant={
                                      detectedClassType === 'Integradora'
                                      ? 'default'
                                      : 'secondary'
                                  }
                                  >
                                  {detectedClassType}
                                  </Badge>
                              </div>
                              </div>
                          </div>
                        </AccordionContent>
                    </AccordionItem>

                     <AccordionItem value="item-2" className="border rounded-lg">
                        <AccordionTrigger className="px-6 text-lg font-semibold">Estrutura Pedagógica</AccordionTrigger>
                        <AccordionContent className="px-6 space-y-4">
                             <FormField
                                control={form.control}
                                name="syllabus"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ementa</FormLabel>
                                    <FormControl>
                                    <Textarea rows={5} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="objectives"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Objetivos</FormLabel>
                                    <FormControl>
                                    <Textarea rows={5} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="competencies"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Competências Gerais</FormLabel>
                                    <FormControl>
                                    <Textarea rows={5} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </AccordionContent>
                     </AccordionItem>
                    
                      <AccordionItem value="item-3" className="border rounded-lg">
                        <AccordionTrigger className="px-6 text-lg font-semibold">Estruturas Detalhadas (Opcional)</AccordionTrigger>
                        <AccordionContent className="px-6 space-y-6">
                            {competencyMatrix && competencyMatrix.length > 0 && (
                               <Accordion type="multiple" className="w-full">
                                    <AccordionItem value="comp-matrix-inner">
                                        <AccordionTrigger className="text-base font-semibold">Matriz de Competências</AccordionTrigger>
                                        <AccordionContent className='pt-4'>
                                            {competencyMatrix.map((comp, compIndex) => (
                                                <Accordion key={compIndex} type="multiple" className="w-full mt-2">
                                                    <AccordionItem value={`comp-${compIndex}`} >
                                                        <AccordionTrigger className="text-base font-medium bg-muted/50 px-4 rounded-t-md">{comp.competency}</AccordionTrigger>
                                                        <AccordionContent className="p-4 border border-t-0 rounded-b-md">
                                                            <div className="space-y-4">
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
                                                </Accordion>
                                            ))}
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            )}

                             {learningUnits && learningUnits.length > 0 && (
                                <FormItem>
                                    <Accordion type="multiple" className="w-full">
                                        <AccordionItem value="learning-units-inner">
                                            <AccordionTrigger className="text-base font-semibold">Unidades de Aprendizagem</AccordionTrigger>
                                            <AccordionContent className='pt-4'>
                                                {learningUnits.map((unit, index) => (
                                                    <AccordionItem value={`unit-${index}`} key={index}>
                                                        <AccordionTrigger>{unit.name}</AccordionTrigger>
                                                        <AccordionContent>
                                                            <p className="text-muted-foreground whitespace-pre-wrap">{unit.content}</p>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                ))}
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                </FormItem>
                            )}

                            {thematicTree && thematicTree.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-2">Árvore Temática</h3>
                                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {thematicTree.map((item, index) => (
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

                        </AccordionContent>
                      </AccordionItem>

                    <AccordionItem value="item-4" className="border rounded-lg">
                        <AccordionTrigger className="px-6 text-lg font-semibold">Bibliografia</AccordionTrigger>
                        <AccordionContent className="px-6 space-y-4">
                             <FormField
                              control={form.control}
                              name="bibliography.basic"
                              render={({ field }) => (
                                  <FormItem>
                                  <FormLabel>Básica</FormLabel>
                                  <FormControl>
                                      <Textarea rows={5} {...field} className="font-sans" />
                                  </FormControl>
                                  <FormMessage />
                                  </FormItem>
                              )}
                              />
                              <FormField
                              control={form.control}
                              name="bibliography.complementary"
                              render={({ field }) => (
                                  <FormItem>
                                  <FormLabel>Complementar</FormLabel>
                                  <FormControl>
                                      <Textarea rows={5} {...field} className="font-sans" />
                                  </FormControl>
                                  <FormMessage />
                                  </FormItem>
                              )}
                              />
                              <FormField
                              control={form.control}
                              name="bibliography.recommended"
                              render={({ field }) => (
                                  <FormItem>
                                  <FormLabel>Recomendada</FormLabel>
                                  <FormControl>
                                      <Textarea rows={3} {...field} className="font-sans" />
                                  </FormControl>
                                  <FormMessage />
                                  </FormItem>
                              )}
                              />
                        </AccordionContent>
                    </AccordionItem>

                     <AccordionItem value="item-5" className="border rounded-lg">
                        <AccordionTrigger className="px-6 text-lg font-semibold">Cronograma de Aulas</AccordionTrigger>
                        <AccordionContent className="px-6">
                            <ClassScheduleEditor control={form.control} />
                        </AccordionContent>
                     </AccordionItem>

                </Accordion>
                
                {isMobile && (
                    <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-10">
                        <Button type="submit" className="w-full" disabled={isSaving}>
                            {isSaving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : <Save className="mr-2 h-4 w-4" />}
                            Salvar Alterações
                        </Button>
                    </div>
                )}
              </form>
            </Form>
        </FormProvider>
    </div>
  );
}
