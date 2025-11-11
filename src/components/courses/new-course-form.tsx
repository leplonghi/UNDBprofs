'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser } from '@/firebase';
import { doc, writeBatch } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { Course, Classroom, ClassScheduleItem } from '@/types';
import { createActivitiesFromPreset } from '@/lib/presets';
import { ClassScheduleEditor } from '../import/ClassScheduleEditor';
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
  name: z.string().min(1, 'Nome da disciplina é obrigatório.'),
  code: z.string().min(1, 'Código é obrigatório.'),
  syllabus: z.string().min(1, 'Ementa é obrigatória.'),
  competencies: z.string().optional(),
  bibliography_basic: z.string().optional(),
  bibliography_complementary: z.string().optional(),
  bibliography_recommended: z.string().optional(),
  semester: z.string().min(1, "Semestre é obrigatório (ex: 2025.2)"),
  workload: z.string().min(1, "Carga horária é obrigatória"),
  classType: z.enum(['Integradora', 'Modular']).default('Modular'),
  competencyMatrix: z.array(competencySchema).optional(),
  learningUnits: z.array(learningUnitSchema).optional(),
  thematicTree: z.array(z.object({ name: z.string(), description: z.string() })).optional(),
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

export default function NewCourseForm() {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      code: '',
      syllabus: '',
      competencies: '',
      bibliography_basic: '',
      bibliography_complementary: '',
      bibliography_recommended: '',
      semester: '2025.2',
      workload: '80h',
      classType: 'Modular',
      competencyMatrix: [],
      learningUnits: [],
      thematicTree: [],
      classSchedule: [],
    },
  });

  async function onSubmit(values: FormData) {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Erro de Autenticação',
        description: 'Você precisa estar logado para criar uma disciplina.',
      });
      return;
    }

    const courseId = uuidv4();
    const classroomId = uuidv4();
    const courseRef = doc(firestore, `professors/${user.uid}/courses/${courseId}`);
    const classroomRef = doc(firestore, `professors/${user.uid}/courses/${courseId}/classrooms/${classroomId}`);


    const courseData: Course = {
      id: courseId,
      professorId: user.uid,
      name: values.name,
      code: values.code,
      syllabus: values.syllabus,
      objectives: '', // Removed from form, default to empty
      competencies: values.competencies || '',
      learningUnits: values.learningUnits || [],
      competencyMatrix: values.competencyMatrix || [],
      thematicTree: values.thematicTree || [],
      bibliography: {
        basic: values.bibliography_basic || '',
        complementary: values.bibliography_complementary || '',
        recommended: values.bibliography_recommended || ''
      },
    };
    
    const defaultActivities = createActivitiesFromPreset(values.classType);

    const classroomData: Omit<Classroom, 'classSchedule'> & { classSchedule: ClassScheduleItem[] } = {
        id: classroomId,
        courseId: courseId,
        name: `Turma de ${values.semester}`,
        semester: values.semester,
        workload: values.workload,
        classType: values.classType,
        classSchedule: values.classSchedule ?? [],
        activities: defaultActivities,
    };

    const batch = writeBatch(firestore);
    batch.set(courseRef, courseData);
    batch.set(classroomRef, classroomData);

    try {
        await batch.commit();
        toast({
          title: 'Disciplina Criada com Sucesso!',
          description: `A disciplina "${values.name}" e uma turma padrão foram adicionadas.`,
        });
        router.push('/disciplinas');
    } catch (error) {
        console.error('Error creating course and classroom:', error);
        toast({
            variant: 'destructive',
            title: 'Erro ao Criar',
            description: 'Não foi possível salvar a disciplina. Tente novamente.'
        });
    }

  }

  return (
      <FormProvider {...form}>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                control={form.control}
                name="name"
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
                name="code"
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

            <FormField
                control={form.control}
                name="competencies"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Competências Gerais (Opcional)</FormLabel>
                    <FormControl>
                    <Textarea rows={5} {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />

                <Accordion type="multiple" className="w-full space-y-4">
                    <AccordionItem value="item-1" className="border rounded-md px-4">
                        <AccordionTrigger className="font-semibold">Matriz de Competências e Árvore Temática (Opcional)</AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-4">
                            <p className="text-sm text-muted-foreground">Adicione aqui a matriz detalhada e a árvore temática, se aplicável.</p>
                            {/* Placeholder para os componentes de edição da matriz e árvore */}
                            <div className="p-4 border-dashed border-2 rounded-md text-center text-muted-foreground">
                                Editor da Matriz de Competências virá aqui.
                            </div>
                            <div className="p-4 border-dashed border-2 rounded-md text-center text-muted-foreground">
                                Editor da Árvore Temática virá aqui.
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-2" className="border rounded-md px-4">
                        <AccordionTrigger className="font-semibold">Bibliografia (Opcional)</AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-4">
                        <FormField
                            control={form.control}
                            name="bibliography_basic"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Básica</FormLabel>
                                <FormControl>
                                    <Textarea rows={5} {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField
                            control={form.control}
                            name="bibliography_complementary"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Complementar</FormLabel>
                                <FormControl>
                                    <Textarea rows={5} {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField
                            control={form.control}
                            name="bibliography_recommended"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Recomendada</FormLabel>
                                <FormControl>
                                    <Textarea rows={3} {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            
                <div className="space-y-4 rounded-lg border p-4">
                    <h3 className="font-semibold text-lg">Dados da Turma Padrão</h3>
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
                        <FormField
                            control={form.control}
                            name="classType"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo da Turma</FormLabel>
                                {/* Adicionar um seletor aqui seria o ideal */}
                                <FormControl>
                                <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                    <ClassScheduleEditor control={form.control} />
                </div>


            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Criar Disciplina e Turma Padrão
            </Button>
            </form>
        </Form>
      </FormProvider>
  );
}
