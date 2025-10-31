'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useParams } from 'next/navigation';
import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, 'Nome da turma é obrigatório.'),
  semester: z.string().min(1, 'Semestre é obrigatório.'),
  workload: z.string().min(1, 'Carga horária é obrigatória.'),
});

type FormData = z.infer<typeof formSchema>;

export default function NewClassroomPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  
  const courseId = params.id as string;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
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
     if (!courseId) {
      toast({
        variant: 'destructive',
        title: 'Erro: Disciplina não encontrada',
        description: 'Não foi possível identificar a disciplina para associar esta turma.',
      });
      return;
    }

    const classroomId = uuidv4();
    const classroomData = {
        id: classroomId,
        courseId: courseId,
        professorId: user.uid,
        name: values.name,
        semester: values.semester,
        workload: values.workload,
        classType: 'Regular', // Default value
        gradingRule: '', // Default value
    };
    
    try {
      const classroomCollection = collection(firestore, `professors/${user.uid}/courses/${courseId}/classrooms`);
      const classroomDocRef = doc(classroomCollection, classroomId);
      
      // We don't await this to make the UI faster
      setDoc(classroomDocRef, classroomData);

      toast({
        title: 'Turma Criada com Sucesso!',
        description: `A turma "${values.name}" foi adicionada.`,
      });
      
      router.push(`/disciplinas/${courseId}`);

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
        <CardTitle>Nova Turma</CardTitle>
        <CardDescription>
          Preencha as informações para uma nova turma da disciplina.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
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
          </CardContent>
          <CardFooter>
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
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
