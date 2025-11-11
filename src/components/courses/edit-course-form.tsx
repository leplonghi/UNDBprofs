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
import { Loader2, ArrowLeft, Save, FileScan } from 'lucide-react';
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
  ImportCourseFromLessonPlanOutput
} from '@/types';
import { ClassScheduleEditor } from '@/components/import/ClassScheduleEditor';
import { Badge } from '../ui/badge';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ReImportUploadForm } from '../import/re-import-upload-form';

const competencySchema = z.object({
    competency: z.string(),
    ch: z.string().optional(),
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
  competencies: z.string().optional(),
  workload: z.string().optional(),
  year: z.string().optional(),
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
  const [isReImportOpen, setIsReImportOpen] = useState(false);
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
      competencies: '',
      workload: '',
      year: '',
      semester: '',
      classType: 'Integradora',
      competencyMatrix: [],
      learningUnits: [],
      thematicTree: [],
      bibliography: { basic: '', complementary: '', recommended: '' },
      classSchedule: [],
    },
  });

  const resetFormWithData = (data: Partial<FormData>) => {
     form.reset({
        courseName: data.courseName,
        courseCode: data.courseCode,
        syllabus: data.syllabus,
        competencies: data.competencies,
        competencyMatrix: data.competencyMatrix || [],
        learningUnits: data.learningUnits || [],
        thematicTree: data.thematicTree || [],
        bibliography: data.bibliography || {
          basic: '',
          complementary: '',
          recommended: '',
        },
        workload: data.workload,
        year: data.year,
        semester: data.semester,
        classType: data.classType,
        classSchedule: data.classSchedule || [],
      });
  }

  useEffect(() => {
    if (course && classroom) {
      resetFormWithData({
        courseName: course.name,
        courseCode: course.code,
        syllabus: course.syllabus,
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
        year: classroom.year,
        semester: classroom.semester,
        classType: classroom.classType,
        classSchedule: classroom.classSchedule || [],
      });
    }
  }, [course, classroom]); // `form` dependency removed to prevent reset loop

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

    const updatedCourseData: Partial<Omit<Course, 'id'>> = {
      name: values.courseName,
      code: values.courseCode,
      syllabus: values.syllabus,
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
      year: values.year,
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

  const handleExtractionComplete = (data: ImportCourseFromLessonPlanOutput) => {
    resetFormWithData(data);
    setIsReImportOpen(false);
    toast({
        title: "Dados Repreenchidos!",
        description: "O formulário foi atualizado com os dados do novo PDF. Revise e salve."
    })
  };

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
                <Dialog open={isReImportOpen} onOpenChange={setIsReImportOpen}>
                    <DialogTrigger asChild>
                         <Button variant="outline">
                            <FileScan className="mr-2 h-4 w-4" />
                            Re-importar com IA
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                         <DialogHeader>
                            <DialogTitle>Re-importar Plano de Ensino</DialogTitle>
                            <DialogDescription>
                                Envie um novo arquivo PDF. Os dados extraídos pela IA irão preencher o formulário de edição para sua revisão.
                            </DialogDescription>
                        </DialogHeader>
                        <ReImportUploadForm
                            user={user}
                            onExtractionComplete={handleExtractionComplete}
                        />
                    </DialogContent>
                </Dialog>
                 {!isMobile && (
                    <Button onClick={form.handleSubmit(onSubmit)} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Salvar
                    </Button>
                )}
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-20 md:pb-6">
                
                <Card>
                    <CardHeader>
                        <CardTitle>Informações do Plano de Ensino</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                           <FormField
                          control={form.control}
                          name="year"
                          render={({ field }) => (
                              <FormItem>
                              <FormLabel>Ano</FormLabel>
                              <FormControl>
                                  <Input {...field} />
                              </FormControl>
                              <FormMessage />
                              </FormItem>
                          )}
                          />
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
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Matriz de Competências</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                        <FormField
                            control={form.control}
                            name="syllabus"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ementa</FormLabel>
                                <FormControl>
                                <Textarea rows={8} {...field} />
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
                                <Textarea rows={8} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />

                        {competencyMatrix && competencyMatrix.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Competências Específicas</h3>
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
                             </div>
                        )}
                    </CardContent>
                </Card>


                {learningUnits && learningUnits.length > 0 && (
                     <Card>
                        <CardHeader>
                            <CardTitle>Unidades de Aprendizagem</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <Accordion type="multiple" className="w-full">
                                {learningUnits.map((unit, index) => (
                                    <AccordionItem value={`unit-${index}`} key={index}>
                                        <AccordionTrigger>{unit.name}</AccordionTrigger>
                                        <AccordionContent>
                                            <p className="text-muted-foreground whitespace-pre-wrap">{unit.content}</p>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </CardContent>
                    </Card>
                )}

                {thematicTree && thematicTree.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Árvore Temática</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Bibliografia</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Cronograma de Aulas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ClassScheduleEditor control={form.control} />
                    </CardContent>
                </Card>
                
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
