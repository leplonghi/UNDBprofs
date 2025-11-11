'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  type ImportCourseFromLessonPlanOutput,
} from '@/ai/flows/import-course-from-lesson-plan';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { doc, writeBatch } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import type { Course, Classroom, ClassScheduleItem, Competency, LearningUnit } from '@/types';
import { ClassScheduleEditor } from './ClassScheduleEditor';
import { createActivitiesFromPreset } from '@/lib/presets';
import { Badge } from '../ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '@/lib/utils';


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
  competencies: z.string().optional(),
  workload: z.string().optional(),
  semester: z.string().optional(),
  classType: z.enum(['Integradora', 'Modular']).optional(),
  competencyMatrix: z.array(competencySchema).optional(),
  learningUnits: z.array(learningUnitSchema).optional(),
  thematicTree: z.array(z.object({ name: z.string(), description: z.string() })).optional(),
  bibliography: z.object({
    basic: z.string().optional(),
    complementary: z.string().optional(),
    recommended: z.string().optional(),
  }).optional(),
  classSchedule: z.array(z.object({ 
      date: z.string(), 
      type: z.string(), 
      topic: z.string(),
      content: z.string(), 
      activity: z.string(),
      location: z.string(),
    })).optional(),
});

type FormData = z.infer<typeof formSchema>;

export function ImportForm() {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const [extractedData, setExtractedData] = useState<ImportCourseFromLessonPlanOutput | null>(null);
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      courseName: '',
      courseCode: '',
      syllabus: '',
      competencies: '',
      workload: '',
      semester: '',
      classType: 'Integradora',
      competencyMatrix: [],
      learningUnits: [],
      thematicTree: [],
      bibliography: {
        basic: '',
        complementary: '',
        recommended: '',
      },
      classSchedule: [],
    },
  });

   useEffect(() => {
    const storedData = sessionStorage.getItem('importedData');
    if (storedData) {
      try {
        const data = JSON.parse(storedData) as ImportCourseFromLessonPlanOutput;
        setExtractedData(data);
      } catch (error) {
        console.error("Failed to parse stored data", error);
        toast({
            variant: 'destructive',
            title: 'Erro ao Carregar Dados',
            description: 'Não foi possível ler os dados da importação anterior.',
        });
        router.push('/disciplinas');
      }
    } else {
        toast({ title: 'Nenhum dado a ser importado.', description: 'Por favor, importe um arquivo PDF primeiro.' });
        router.push('/disciplinas');
    }
  }, [router, toast]);

  useEffect(() => {
    if (extractedData) {
      form.reset({
        courseName: extractedData.courseName,
        courseCode: extractedData.courseCode,
        syllabus: extractedData.syllabus,
        competencies: extractedData.competencies,
        workload: extractedData.workload,
        semester: extractedData.semester,
        competencyMatrix: extractedData.competencyMatrix || [],
        learningUnits: extractedData.learningUnits || [],
        thematicTree: extractedData.thematicTree || [],
        bibliography: extractedData.bibliography || { basic: '', complementary: '', recommended: '' },
        classSchedule: extractedData.classSchedule || [],
        classType: extractedData.classType || 'Modular',
      });
    }
  }, [extractedData, form]);


  async function onSubmit(values: FormData) {
     if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Erro de Autenticação',
        description: 'Você precisa estar logado para salvar as informações.',
      });
      return;
    }

    setIsSaving(true);
    
    const courseId = uuidv4();
    const classroomId = uuidv4();

    const courseRef = doc(firestore, `professors/${user.uid}/courses/${courseId}`);
    const classroomRef = doc(firestore, `professors/${user.uid}/courses/${courseId}/classrooms/${classroomId}`);

    const courseData: Course = {
        id: courseId,
        professorId: user.uid,
        name: values.courseName || 'Nome não definido',
        code: values.courseCode || 'N/A',
        syllabus: values.syllabus || 'Ementa não definida',
        competencies: values.competencies || 'Competências não definidas',
        competencyMatrix: values.competencyMatrix || [],
        learningUnits: values.learningUnits || [],
        thematicTree: values.thematicTree || [],
        bibliography: {
            basic: values.bibliography?.basic || '',
            complementary: values.bibliography?.complementary || '',
            recommended: values.bibliography?.recommended || '',
        },
    };
    
    const classType = values.classType || 'Modular';
    const newActivities = createActivitiesFromPreset(classType);

    const classroomData: Omit<Classroom, 'classSchedule'> & { classSchedule: ClassScheduleItem[] } = {
        id: classroomId,
        courseId: courseId,
        name: `Turma de ${values.semester || 'Semestre indefinido'}`, // e.g., "Turma de 2025.1"
        semester: values.semester || 'N/A',
        workload: values.workload || 'N/A',
        classType: classType,
        classSchedule: values.classSchedule ?? [],
        activities: newActivities,
    };
    
    try {
        const batch = writeBatch(firestore);
        batch.set(courseRef, courseData);
        batch.set(classroomRef, classroomData);
        await batch.commit();

        toast({
        title: 'Disciplina e Turma Criadas!',
        description: `A disciplina "${values.courseName}" e sua primeira turma foram salvas com sucesso.`,
        });

        sessionStorage.removeItem('importedData');
        
        router.push(`/disciplinas`);

    } catch (error) {
        console.error('Error creating documents: ', error);
        toast({
        variant: 'destructive',
        title: 'Erro ao Salvar',
        description: 'Não foi possível salvar as informações. Tente novamente.',
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


  if (!extractedData) {
    return (
        <div className="flex items-center justify-center space-x-2 text-muted-foreground p-8">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Carregando dados extraídos...</span>
        </div>
    );
  }

  return (
        <FormProvider {...form}>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    
                    <Accordion type="multiple" defaultValue={['item-1', 'item-2']} className="w-full space-y-4">
                        <AccordionItem value="item-1" className="border rounded-lg">
                           <AccordionTrigger className="px-6 text-lg font-semibold">Dados da Disciplina</AccordionTrigger>
                           <AccordionContent className="px-6 pt-6 space-y-6">
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
                                    <Accordion type="multiple" className="w-full">
                                        <AccordionItem value="comp-matrix" className="border rounded-md px-4">
                                            <AccordionTrigger className="text-base font-semibold">Matriz de Competências Detalhada</AccordionTrigger>
                                            <AccordionContent className="pt-4">
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
                                            <AccordionItem value="learning-units" className="border rounded-md px-4">
                                                <AccordionTrigger className="text-base font-semibold">Unidades de Aprendizagem</AccordionTrigger>
                                                <AccordionContent className="pt-4">
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
                                
                                <div className='space-y-4'>
                                    <h4 className='font-medium'>Bibliografia</h4>
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
                                </div>
                           </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-2" className="border rounded-lg">
                           <AccordionTrigger className="px-6 text-lg font-semibold">Dados da Turma e Cronograma</AccordionTrigger>
                           <AccordionContent className="px-6 pt-6 space-y-6">
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
                                    <FormLabel>Tipo da Turma (Detectado)</FormLabel>
                                    <div className="flex items-center h-10">
                                        <Badge variant={detectedClassType === 'Integradora' ? 'default' : 'secondary'}>
                                            {detectedClassType}
                                        </Badge>
                                    </div>
                                    <p className='text-sm text-muted-foreground'>
                                        A IA detectou este tipo e aplicará o preset de avaliação correspondente.
                                    </p>
                                </div>
                                </div>
                                <ClassScheduleEditor control={form.control} />
                           </AccordionContent>
                        </AccordionItem>

                    </Accordion>
                    
                    <Button type="submit" className="w-full" disabled={isSaving}>
                        {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Confirmar e Salvar
                    </Button>
                </form>
            </Form>
        </FormProvider>
  );
}
