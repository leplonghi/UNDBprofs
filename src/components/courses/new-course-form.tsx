'use client';

import { useForm, FormProvider, useFieldArray } from 'react-hook-form';
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
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import type { Course, Classroom, ClassScheduleItem } from '@/types';
import { createActivitiesFromPreset } from '@/lib/presets';
import { ClassScheduleEditor } from '../import/ClassScheduleEditor';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Separator } from '../ui/separator';

const competencySchema = z.object({
    competency: z.string().min(1, "A competência não pode ser vazia."),
    skills: z.array(z.object({
        skill: z.string().min(1, "A habilidade não pode ser vazia."),
        descriptors: z.string().min(1, "O descritor não pode ser vazio."),
    })).min(1, "Adicione pelo menos uma habilidade."),
});

const learningUnitSchema = z.object({
    name: z.string().min(1, "O nome da unidade é obrigatório."),
    content: z.string().min(1, "O conteúdo da unidade é obrigatório."),
});

const thematicTreeSchema = z.object({
    name: z.string().min(1, "O nome é obrigatório."),
    description: z.string().min(1, "A descrição é obrigatória."),
});


const formSchema = z.object({
  name: z.string().min(1, 'Nome da disciplina é obrigatório.'),
  code: z.string().min(1, 'Código é obrigatório.'),
  semester: z.string().min(1, "Semestre é obrigatório (ex: 2025.2)"),
  workload: z.string().min(1, "Carga horária é obrigatória"),
  classType: z.enum(['Integradora', 'Modular']).default('Modular'),
  syllabus: z.string().min(1, 'Ementa é obrigatória.'),
  competencies: z.string().optional(),
  bibliography_basic: z.string().optional(),
  bibliography_complementary: z.string().optional(),
  bibliography_recommended: z.string().optional(),
  competencyMatrix: z.array(competencySchema).optional(),
  learningUnits: z.array(learningUnitSchema).optional(),
  thematicTree: z.array(thematicTreeSchema).optional(),
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

function CompetencyMatrixEditor() {
    const { control } = useForm<FormData>();
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'competencyMatrix'
    });

    return (
        <div className="space-y-4">
            {fields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-md space-y-3">
                     <FormField
                        control={control}
                        name={`competencyMatrix.${index}.competency`}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Competência</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <SkillEditor competencyIndex={index} />
                    <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)}>
                        <Trash2 className="mr-2 h-4 w-4" />Remover Competência
                    </Button>
                </div>
            ))}
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ competency: '', skills: [{ skill: '', descriptors: '' }] })}
            >
                <PlusCircle className="mr-2 h-4 w-4" />Adicionar Competência
            </Button>
        </div>
    );
}

function SkillEditor({ competencyIndex }: { competencyIndex: number }) {
    const { control } = useForm<FormData>();
    const { fields, append, remove } = useFieldArray({
        control,
        name: `competencyMatrix.${competencyIndex}.skills`
    });

    return (
        <div className="space-y-3 pl-4 border-l-2">
             <h4 className="font-semibold text-sm">Habilidades</h4>
            {fields.map((field, index) => (
                <div key={field.id} className="p-3 border rounded-md space-y-2">
                     <FormField
                        control={control}
                        name={`competencyMatrix.${competencyIndex}.skills.${index}.skill`}
                        render={({ field }) => (
                             <FormItem>
                                <FormLabel>Habilidade</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={control}
                        name={`competencyMatrix.${competencyIndex}.skills.${index}.descriptors`}
                        render={({ field }) => (
                             <FormItem>
                                <FormLabel>Descritores</FormLabel>
                                <FormControl><Textarea {...field} rows={2} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            ))}
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ skill: '', descriptors: '' })}
            >
                <PlusCircle className="mr-2 h-4 w-4" />Adicionar Habilidade
            </Button>
        </div>
    );
}

function LearningUnitsEditor() {
    const { control } = useForm<FormData>();
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'learningUnits'
    });

    return (
        <div className="space-y-4">
            {fields.map((field, index) => (
                 <div key={field.id} className="p-4 border rounded-md space-y-3 relative">
                     <FormField
                        control={control}
                        name={`learningUnits.${index}.name`}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nome da Unidade</FormLabel>
                                <FormControl><Input {...field} placeholder={`UA ${index + 1}`} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={control}
                        name={`learningUnits.${index}.content`}
                        render={({ field }) => (
                             <FormItem>
                                <FormLabel>Conteúdo</FormLabel>
                                <FormControl><Textarea {...field} rows={3} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                 </div>
            ))}
             <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ name: '', content: '' })}
            >
                <PlusCircle className="mr-2 h-4 w-4" />Adicionar Unidade de Aprendizagem
            </Button>
        </div>
    )
}

function ThematicTreeEditor() {
    const { control } = useForm<FormData>();
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'thematicTree'
    });

    return (
         <div className="space-y-4">
            {fields.map((field, index) => (
                 <div key={field.id} className="p-4 border rounded-md space-y-3 relative">
                     <FormField
                        control={control}
                        name={`thematicTree.${index}.name`}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nome da Etapa</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={control}
                        name={`thematicTree.${index}.description`}
                        render={({ field }) => (
                             <FormItem>
                                <FormLabel>Descrição da Etapa</FormLabel>
                                <FormControl><Textarea {...field} rows={2} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                 </div>
            ))}
             <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ name: '', description: '' })}
            >
                <PlusCircle className="mr-2 h-4 w-4" />Adicionar Etapa na Árvore Temática
            </Button>
        </div>
    );
}

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
      semester: '2025.2',
      workload: '80h',
      classType: 'Modular',
      syllabus: '',
      competencies: '',
      bibliography_basic: '',
      bibliography_complementary: '',
      bibliography_recommended: '',
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
                
                <Card>
                    <CardHeader>
                        <CardTitle>Estruturas Detalhadas</CardTitle>
                        <CardDescription>Adicione aqui a matriz detalhada, unidades e a árvore temática.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="font-semibold mb-2">Matriz de Competências</h3>
                            <CompetencyMatrixEditor />
                        </div>
                        <Separator />
                         <div>
                            <h3 className="font-semibold mb-2">Unidades de Aprendizagem</h3>
                            <LearningUnitsEditor />
                        </div>
                        <Separator />
                         <div>
                            <h3 className="font-semibold mb-2">Árvore Temática</h3>
                            <ThematicTreeEditor />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Bibliografia</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
