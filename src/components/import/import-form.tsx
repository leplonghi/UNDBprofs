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
import type { Course, Classroom } from '@/types';

const formSchema = z.object({
  courseName: z.string().min(1, 'Nome do curso é obrigatório.'),
  courseCode: z.string().min(1, 'Código do curso é obrigatório.'),
  syllabus: z.string().min(1, 'Ementa é obrigatória.'),
  objectives: z.string().min(1, 'Objetivos são obrigatórios.'),
  workload: z.string().min(1, 'Carga horária é obrigatória.'),
  semester: z.string().min(1, 'Semestre é obrigatório.'),
  competencies: z.string().min(1, 'Competências são obrigatórias.'),
  thematicTree: z.array(z.object({ name: z.string(), description: z.string() })).optional(),
  bibliography: z.string().min(1, 'Bibliografia é obrigatória.'),
  classSchedule: z.array(z.object({ date: z.string(), content: z.string(), activity: z.string() })).optional(),
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
      objectives: '',
      workload: '',
      semester: '',
      competencies: '',
      thematicTree: [],
      bibliography: '',
      classSchedule: [],
    },
  });

   useEffect(() => {
    const storedData = sessionStorage.getItem('importedData');
    if (storedData) {
      try {
        const data = JSON.parse(storedData) as ImportCourseFromLessonPlanOutput;
        setExtractedData(data);
        // DO NOT remove the item from session storage here.
        // It will be cleared after successful submission.
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
        // If there's no stored data, redirect.
        toast({ title: 'Nenhum dado a ser importado.', description: 'Por favor, importe um arquivo PDF primeiro.' });
        router.push('/disciplinas');
    }
  }, [router, toast]);

  useEffect(() => {
    // When extractedData is populated, reset the form
    if (extractedData) {
      form.reset({
        courseName: extractedData.courseName,
        courseCode: extractedData.courseCode,
        syllabus: extractedData.syllabus,
        objectives: extractedData.objectives,
        workload: extractedData.workload,
        semester: extractedData.semester,
        competencies: extractedData.competencies,
        thematicTree: extractedData.thematicTree,
        bibliography: extractedData.bibliography,
        classSchedule: extractedData.classSchedule,
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
    
    // Generate unique IDs for the new course and classroom
    const courseId = uuidv4();
    const classroomId = uuidv4();

    // Create document references
    const courseRef = doc(firestore, `professors/${user.uid}/courses/${courseId}`);
    const classroomRef = doc(firestore, `professors/${user.uid}/courses/${courseId}/classrooms/${classroomId}`);

    // Prepare the data for the Course document
    const courseData: Omit<Course, 'id' | 'professorId'> = {
        name: values.courseName,
        code: values.courseCode,
        syllabus: values.syllabus,
        objectives: values.objectives,
        competencies: values.competencies || '',
        thematicTree: values.thematicTree || [],
        bibliography: values.bibliography || '',
    };

    // Prepare the data for the Classroom document
    const classroomData: Omit<Classroom, 'id'| 'courseId'> = {
        name: `Turma de ${values.semester}`, // e.g., "Turma de 2025.1"
        semester: values.semester,
        workload: values.workload,
        classSchedule: values.classSchedule ?? [],
    };
    
    try {
        // Use a batch write to save both documents atomically
        const batch = writeBatch(firestore);
        batch.set(courseRef, { ...courseData, id: courseId, professorId: user.uid });
        batch.set(classroomRef, { ...classroomData, id: classroomId, courseId: courseId });
        await batch.commit();

        toast({
        title: 'Disciplina e Turma Criadas!',
        description: `A disciplina "${values.courseName}" e sua primeira turma foram salvas com sucesso.`,
        });

        // Clear storage only after successful save
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

  if (!extractedData) {
    return (
        <div className="flex items-center justify-center space-x-2 text-muted-foreground p-8">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Redirecionando...</span>
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
                      <FormLabel>Competências</FormLabel>
                      <FormControl>
                        <Textarea rows={5} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="thematicTree"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Árvore Temática</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={8}
                          value={field.value ? JSON.stringify(field.value, null, 2) : ''}
                          onChange={(e) => {
                            try {
                              const parsed = JSON.parse(e.target.value);
                              field.onChange(parsed);
                            } catch (error) {
                              // Handle invalid JSON input if necessary
                              console.warn("Invalid JSON for thematicTree");
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bibliography"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bibliografia</FormLabel>
                      <FormControl>
                        <Textarea rows={8} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

            <div className="space-y-4 rounded-lg border p-4">
                <h3 className="font-semibold text-lg text-primary">Dados da Turma</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                </div>
                <FormField
                  control={form.control}
                  name="classSchedule"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cronograma de Aulas</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={8}
                          value={field.value ? JSON.stringify(field.value, null, 2) : ''}
                          onChange={(e) => {
                             try {
                              const parsed = JSON.parse(e.target.value);
                              field.onChange(parsed);
                            } catch (error) {
                              console.warn("Invalid JSON for classSchedule");
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
