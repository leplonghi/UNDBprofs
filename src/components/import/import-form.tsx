'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
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
import { ThematicTreeEditor } from './ThematicTreeEditor';
import { ClassScheduleEditor } from './ClassScheduleEditor';
import { createActivitiesFromPreset } from '@/lib/presets';
import { Badge } from '../ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

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
  courseName: z.string().min(1, 'Nome do curso é obrigatório.'),
  courseCode: z.string().min(1, 'Código do curso é obrigatório.'),
  syllabus: z.string().min(1, 'Ementa é obrigatória.'),
  workload: z.string().min(1, 'Carga horária é obrigatória.'),
  semester: z.string().min(1, 'Semestre é obrigatório.'),
  classType: z.enum(['Integradora', 'Modular'], { required_error: 'O tipo da turma é obrigatório.' }),
  competencyMatrix: z.array(competencySchema).optional(),
  learningUnits: z.array(learningUnitSchema).optional(),
  thematicTree: z.array(z.object({ name: z.string().min(1, 'O nome é obrigatório.'), description: z.string().min(1, 'A descrição é obrigatória.') })).optional(),
  bibliography: z.object({
    basic: z.string().optional(),
    complementary: z.string().optional(),
    recommended: z.string().optional(),
  }),
  classSchedule: z.array(z.object({ 
      date: z.string().min(1, 'A data é obrigatória.'), 
      type: z.string().min(1, 'O tipo é obrigatório.'), 
      topic: z.string().min(1, 'O tópico é obrigatório.'),
      content: z.string().min(1, 'O conteúdo é obrigatório.'), 
      activity: z.string().min(1, 'A atividade é obrigatória.'),
      location: z.string().min(1, 'O local é obrigatório.'),
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
        name: values.courseName,
        code: values.courseCode,
        syllabus: values.syllabus,
        competencyMatrix: values.competencyMatrix || [],
        learningUnits: values.learningUnits || [],
        thematicTree: values.thematicTree || [],
        bibliography: {
            basic: values.bibliography.basic || '',
            complementary: values.bibliography.complementary || '',
            recommended: values.bibliography.recommended || '',
        },
    };
    
    const newActivities = createActivitiesFromPreset(values.classType);

    const classroomData: Omit<Classroom, 'classSchedule'> & { classSchedule: ClassScheduleItem[] } = {
        id: classroomId,
        courseId: courseId,
        name: `Turma de ${values.semester}`, // e.g., "Turma de 2025.1"
        semester: values.semester,
        workload: values.workload,
        classType: values.classType,
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


  if (!extractedData) {
    return (
        <div className="flex items-center justify-center space-x-2 text-muted-foreground p-8">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Carregando dados extraídos...</span>
        </div>
    );
  }

  return (
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <div className="space-y-4 rounded-lg border p-4">
                <h3 className="font-semibold text-lg text-primary">Dados da Disciplina</h3>
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
                        <Textarea rows={5} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 {learningUnits && learningUnits.length > 0 && (
                    <FormItem>
                        <FormLabel>Unidades de Aprendizagem</FormLabel>
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
                    </FormItem>
                 )}
                 {competencyMatrix && competencyMatrix.length > 0 && (
                     <FormItem>
                        <FormLabel>Matriz de Competências</FormLabel>
                        <Accordion type="multiple" className="w-full border rounded-md px-4">
                            {competencyMatrix.map((comp, compIndex) => (
                                <AccordionItem value={`comp-${compIndex}`} key={compIndex} className="border-b-0">
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
                    </FormItem>
                 )}

                 <ThematicTreeEditor control={form.control} />
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
              </div>

            <div className="space-y-4 rounded-lg border p-4">
                <h3 className="font-semibold text-lg text-primary">Dados da Turma</h3>
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
            </div>
            
            <Button type="submit" className="w-full" disabled={isSaving}>
                {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Confirmar e Salvar
            </Button>
        </form>
      </Form>
  );
}
