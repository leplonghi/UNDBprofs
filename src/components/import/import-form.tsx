'use client';

import { useState, useTransition, useEffect } from 'react';
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
import { doc, setDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

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
  const [isPending, startTransition] = useTransition();
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
        form.reset({
            courseName: data.courseName,
            courseCode: data.courseCode,
            syllabus: data.syllabus,
            objectives: data.objectives,
            workload: data.workload,
            semester: data.semester,
            competencies: data.competencies,
            thematicTree: data.thematicTree,
            bibliography: data.bibliography,
            classSchedule: data.classSchedule,
        });
        // Clean up session storage after use
        sessionStorage.removeItem('importedData');
      } catch (error) {
        console.error("Failed to parse stored data", error);
        toast({
            variant: 'destructive',
            title: 'Erro ao Carregar Dados',
            description: 'Não foi possível ler os dados da importação anterior.',
        });
      }
    }
  }, [form, toast]);


  async function onSubmit(values: FormData) {
     if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Erro de Autenticação',
        description: 'Você precisa estar logado para salvar as informações.',
      });
      return;
    }

    startTransition(async () => {
        const courseId = uuidv4();
        const classroomId = uuidv4();
    
        const courseData = {
          id: courseId,
          professorId: user.uid,
          name: values.courseName,
          code: values.courseCode,
          syllabus: values.syllabus,
          objectives: values.objectives,
          competencies: values.competencies,
          thematicTree: values.thematicTree,
          bibliography: values.bibliography,
          // semester and workload are now part of classroom
        };
    
        const classroomData = {
            id: classroomId,
            courseId: courseId,
            professorId: user.uid,
            name: values.semester,
            semester: values.semester,
            workload: values.workload,
            classSchedule: values.classSchedule ?? [],
            classType: 'Regular', // Default value, can be extracted in future
            gradingRule: '', // Default value, can be extracted in future
        };
        
        try {
          const courseRef = doc(firestore, `professors/${user.uid}/courses/${courseId}`);
          await setDoc(courseRef, courseData);
          
          const classroomRef = doc(firestore, `professors/${user.uid}/courses/${courseId}/classrooms/${classroomId}`);
          await setDoc(classroomRef, classroomData);
    
          toast({
            title: 'Disciplina e Turma Criadas!',
            description: `A disciplina "${values.courseName}" e sua primeira turma foram salvas.`,
          });
          
          router.push(`/disciplinas`);
    
        } catch (error) {
          console.error('Error creating documents: ', error);
          toast({
            variant: 'destructive',
            title: 'Erro ao Salvar',
            description: 'Não foi possível salvar as informações. Tente novamente.',
          });
        }
    });
  }

  if (!extractedData) {
    return (
        <div className="flex items-center justify-center space-x-2 text-muted-foreground p-8">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Carregando dados da importação...</span>
        </div>
    );
  }

  return (
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {(extractedData || form.formState.isDirty) && (
              <div className="space-y-4 rounded-lg border p-4">
                <h3 className="font-semibold">Revise os Dados Extraídos</h3>
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
                  <FormField
                    control={form.control}
                    name="semester"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Semestre (da Turma)</FormLabel>
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
                        <FormLabel>Carga Horária (da Turma)</FormLabel>
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
                        <Textarea rows={5} value={field.value?.map(v => `${v.name}: ${v.description}`).join('\n')} onChange={(e) => {
                          const value = e.target.value.split('\n').map(line => {
                            const [name, ...description] = line.split(':');
                            return {name: name.trim(), description: description.join(':').trim()};
                          });
                          field.onChange(value);
                        }} />
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
                <FormField
                  control={form.control}
                  name="classSchedule"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cronograma de Aulas (da Turma)</FormLabel>
                      <FormControl>
                          <Textarea rows={8} value={field.value?.map(v => `${v.date} - ${v.content}: ${v.activity}`).join('\n')} onChange={(e) => {
                          const value = e.target.value.split('\n').map(line => {
                            const [date, rest] = line.split(' - ');
                            const [content, ...activity] = rest ? rest.split(':') : ['', ''];
                            return {date: date.trim(), content: content.trim(), activity: activity.join(':').trim()};
                          });
                          field.onChange(value);
                        }} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Confirmar e Salvar
                </Button>
              </div>
            )}
        </form>
      </Form>
  );
}
