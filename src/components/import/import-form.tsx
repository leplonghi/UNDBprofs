'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  importCourseFromLessonPlan,
  type ImportCourseFromLessonPlanOutput,
} from '@/ai/flows/import-course-from-lesson-plan';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

const formSchema = z.object({
  courseName: z.string().min(1, 'Nome do curso é obrigatório.'),
  courseCode: z.string().min(1, 'Código do curso é obrigatório.'),
  syllabus: z.string().min(1, 'Ementa é obrigatória.'),
  objectives: z.string().min(1, 'Objetivos são obrigatórios.'),
  workload: z.string().min(1, 'Carga horária é obrigatória.'),
  semester: z.string().min(1, 'Semestre é obrigatório.'),
});

type FormData = z.infer<typeof formSchema>;

export function ImportForm() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [extractedData, setExtractedData] = useState<ImportCourseFromLessonPlanOutput | null>(null);
  const [fileName, setFileName] = useState('');
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
    },
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setExtractedData(null);
    form.reset();

    const reader = new FileReader();
    reader.readAsDataURL(file);

    startTransition(() => {
      reader.onload = async () => {
        try {
          const lessonPlanDataUri = reader.result as string;
          const result = await importCourseFromLessonPlan({ lessonPlanDataUri });
          setExtractedData(result);
          form.reset({
            courseName: result.courseName,
            courseCode: result.courseCode,
            syllabus: result.syllabus,
            objectives: result.objectives,
            workload: result.workload,
            semester: result.semester,
          });
          toast({
            title: 'Extração Concluída!',
            description: 'Revise os dados extraídos do plano de ensino.',
          });
        } catch (error) {
          console.error(error);
          toast({
            variant: 'destructive',
            title: 'Erro na Extração',
            description: 'Não foi possível processar o arquivo. Tente novamente.',
          });
        }
      };
    });
  };

  async function onSubmit(values: FormData) {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Erro de Autenticação',
        description: 'Você precisa estar logado para salvar as informações.',
      });
      return;
    }

    const courseId = uuidv4();
    const classroomId = uuidv4();

    const courseData = {
      id: courseId,
      professorId: user.uid,
      name: values.courseName,
      code: values.courseCode,
      syllabus: values.syllabus,
      objectives: values.objectives,
    };

    const classroomData = {
        id: classroomId,
        courseId: courseId,
        professorId: user.uid,
        name: `Turma 1`, // Generic name
        semester: values.semester,
        workload: values.workload,
        classType: 'Regular', // Default value
        gradingRule: '', // Default value
    };
    
    try {
      // We don't await these to make the UI faster. The optimistic UI will handle it.
      const courseRef = doc(firestore, `professors/${user.uid}/courses/${courseId}`);
      setDoc(courseRef, courseData);
      
      const classroomRef = doc(firestore, `professors/${user.uid}/courses/${courseId}/classrooms/${classroomId}`);
      setDoc(classroomRef, classroomData);


      toast({
        title: 'Disciplina e Turma Criadas!',
        description: `A disciplina "${values.courseName}" e sua primeira turma foram salvas.`,
      });
      
      router.push(`/disciplinas/${courseId}`);

    } catch (error) {
      console.error('Error creating documents: ', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao Salvar',
        description: 'Não foi possível salvar as informações. Tente novamente.',
      });
    }
  }

  return (
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex flex-col items-center justify-center space-y-2 rounded-lg border-2 border-dashed border-border p-8 text-center">
              <Upload className="h-12 w-12 text-muted-foreground" />
              <Label
                htmlFor="file-upload"
                className="cursor-pointer text-primary underline-offset-4 hover:underline"
              >
                Escolha um arquivo PDF do Plano de Ensino
              </Label>
              <Input
                id="file-upload"
                type="file"
                accept=".pdf"
                className="sr-only"
                onChange={handleFileChange}
                disabled={isPending}
              />
              <p className="text-sm text-muted-foreground">
                {fileName || 'Nenhum arquivo selecionado.'}
              </p>
            </div>

            {isPending && (
              <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Analisando documento... Isso pode levar alguns instantes.</span>
              </div>
            )}

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
                 <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? (
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
