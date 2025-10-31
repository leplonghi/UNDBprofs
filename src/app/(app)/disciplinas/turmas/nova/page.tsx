
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useParams } from 'next/navigation';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

const formSchema = z.object({
  courseId: z.string().min(1, 'Selecione uma disciplina.'),
  name: z.string().min(1, 'Nome da turma é obrigatório.'),
  semester: z.string().min(1, 'Semestre é obrigatório.'),
  workload: z.string().min(1, 'Carga horária é obrigatória.'),
});

type FormData = z.infer<typeof formSchema>;

export default function NewClassroomPage() {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  
  const coursesRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `professors/${user.uid}/courses`);
  }, [user, firestore]);

  const { data: courses, isLoading: coursesLoading } = useCollection(coursesRef);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      courseId: '',
      name: '',
      semester: '',
      workload: '',
    },
  });

  async function onSubmit(values: FormData) {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Erro de Autenticação',
        description: 'Você precisa estar logado para criar uma turma.',
      });
      return;
    }

    const classroomId = uuidv4();
    const classroomData = {
        id: classroomId,
        courseId: values.courseId,
        professorId: user.uid, // Make sure to include professorId
        name: values.name,
        semester: values.semester,
        workload: values.workload,
        classType: 'Regular',
        gradingRule: '',
    };
    
    try {
      const classroomDocRef = doc(firestore, `professors/${user.uid}/courses/${values.courseId}/classrooms/${classroomId}`);
      
      setDoc(classroomDocRef, classroomData);

      toast({
        title: 'Turma Criada com Sucesso!',
        description: `A turma "${values.name}" foi adicionada.`,
      });
      
      router.push(`/disciplinas/${values.courseId}`);

    } catch (error) {
      console.error('Error creating classroom: ', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao Salvar',
        description: 'Não foi possível criar a turma. Tente novamente.',
      });
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Nova Turma (Manual)</CardTitle>
        <CardDescription>
          Preencha as informações para uma nova turma. Primeiro, selecione a disciplina à qual ela pertence.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="courseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Disciplina</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a disciplina..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {coursesLoading ? (
                        <SelectItem value="loading" disabled>Carregando...</SelectItem>
                      ) : courses && courses.length > 0 ? (
                        courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.name} ({course.code})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-courses" disabled>Nenhuma disciplina encontrada.</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Se a disciplina não estiver na lista, você pode criá-la.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/disciplinas/nova">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ou crie uma nova disciplina
                </Link>
            </Button>
            
            <div className="border-t pt-6 space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nome da Turma</FormLabel>
                        <FormControl>
                        <Input {...field} placeholder="Ex: Turma A" />
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
          </CardContent>
          <CardFooter>
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || coursesLoading}>
                {form.formState.isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Criar Turma
              </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
