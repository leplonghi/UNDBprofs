'use client';

import { useForm } from 'react-hook-form';
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
import type { Course, Classroom } from '@/types';
import { createActivitiesFromPreset } from '@/lib/presets';

const formSchema = z.object({
  name: z.string().min(1, 'Nome da disciplina é obrigatório.'),
  code: z.string().min(1, 'Código é obrigatório.'),
  syllabus: z.string().min(1, 'Ementa é obrigatória.'),
  objectives: z.string().optional(),
  bibliography_basic: z.string().optional(),
  bibliography_complementary: z.string().optional(),
  bibliography_recommended: z.string().optional(),
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
      objectives: '',
      bibliography_basic: '',
      bibliography_complementary: '',
      bibliography_recommended: '',
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
      objectives: values.objectives || '',
      learningUnits: [],
      competencyMatrix: [],
      thematicTree: [], // Default empty value
      bibliography: {
        basic: values.bibliography_basic || '',
        complementary: values.bibliography_complementary || '',
        recommended: values.bibliography_recommended || ''
      },
    };
    
    // Create default classroom with default activities
    const defaultActivities = createActivitiesFromPreset('Modular');
    const defaultSemester = '2025.2';

    const classroomData: Classroom = {
        id: classroomId,
        courseId: courseId,
        name: `Turma de ${defaultSemester}`,
        semester: defaultSemester,
        workload: 'N/D',
        classType: 'Modular',
        classSchedule: [],
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-4">
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
                <div className='space-y-2'>
                    <h3 className='font-medium text-sm'>Bibliografia</h3>
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
                </div>
          </div>
            <div className="pt-6">
                 <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Criar Disciplina
                </Button>
            </div>
        </form>
      </Form>
  );
}

    