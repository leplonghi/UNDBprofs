'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, 'Nome da disciplina é obrigatório.'),
  code: z.string().min(1, 'Código é obrigatório.'),
  semester: z.string().min(1, 'Semestre é obrigatório.'),
  workload: z.string().min(1, 'Carga horária é obrigatória.'),
  syllabus: z.string().min(1, 'Ementa é obrigatória.'),
  objectives: z.string().min(1, 'Objetivos são obrigatórios.'),
});

type FormData = z.infer<typeof formSchema>;

export default function NewCoursePage() {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      code: '',
      semester: '',
      workload: '',
      syllabus: '',
      objectives: '',
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

    const courseData = {
      professorId: user.uid,
      name: values.name,
      code: values.code,
      semester: values.semester,
      workload: values.workload,
      syllabus: values.syllabus,
      objectives: values.objectives,
    };
    
    try {
      const coursesCollection = collection(firestore, `professors/${user.uid}/courses`);
      await addDocumentNonBlocking(coursesCollection, courseData);

      toast({
        title: 'Disciplina Criada com Sucesso!',
        description: `A disciplina "${values.name}" foi adicionada.`,
      });
      
      router.push('/disciplinas');

    } catch (error) {
      console.error('Error creating course: ', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao Salvar',
        description: 'Não foi possível criar a disciplina. Tente novamente.',
      });
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Nova Disciplina</CardTitle>
        <CardDescription>
          Preencha as informações abaixo para criar uma nova disciplina.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
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
                <FormField
                    control={form.control}
                    name="semester"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Semestre</FormLabel>
                        <FormControl>
                        <Input {...field} placeholder="Ex: 2024.2" />
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
                        <Input {...field} placeholder="Ex: 72h" />
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
          </CardContent>
          <CardFooter>
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Criar Disciplina
              </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
