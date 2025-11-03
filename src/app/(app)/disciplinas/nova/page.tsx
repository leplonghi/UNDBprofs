'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, UploadCloud } from 'lucide-react';
import type { Course } from '@/types';
import { importCourseFromLessonPlan } from '@/ai/flows/import-course-from-lesson-plan';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const formSchema = z.object({
  name: z.string().min(1, 'Nome da disciplina é obrigatório.'),
  code: z.string().min(1, 'Código é obrigatório.'),
  syllabus: z.string().min(1, 'Ementa é obrigatória.'),
  objectives: z.string().min(1, 'Objetivos são obrigatórios.'),
  competencies: z.string().optional(),
  bibliography_basic: z.string().optional(),
  bibliography_complementary: z.string().optional(),
  bibliography_recommended: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function NewCoursePage() {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      code: '',
      syllabus: '',
      objectives: '',
      competencies: '',
      bibliography_basic: '',
      bibliography_complementary: '',
      bibliography_recommended: '',
    },
  });

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Acesso Negado',
        description: 'Você precisa estar logado para importar um arquivo.',
      });
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    startTransition(() => {
      toast({
        title: 'Processando Arquivo...',
        description:
          'Aguarde enquanto a IA extrai as informações do plano de ensino.',
      });

      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = async () => {
        try {
          const lessonPlanDataUri = reader.result as string;
          const result = await importCourseFromLessonPlan({ lessonPlanDataUri });

          sessionStorage.setItem('importedData', JSON.stringify(result));

          toast({
            title: 'Extração Concluída!',
            description: 'Revise os dados extraídos do plano de ensino.',
          });

          router.push('/disciplinas/importar');
        } catch (error) {
          console.error(error);
          toast({
            variant: 'destructive',
            title: 'Erro na Extração',
            description: 'Não foi possível processar o arquivo. Tente novamente.',
          });
        }
      };

      reader.onerror = () => {
        toast({
          variant: 'destructive',
          title: 'Erro de Leitura',
          description: 'Não foi possível ler o arquivo selecionado.',
        });
      };
    });
  };

  const handleImportClick = () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Acesso Negado',
        description: 'Você precisa estar logado.',
      });
      return;
    }
    fileInputRef.current?.click();
  };

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
    const courseRef = doc(firestore, `professors/${user.uid}/courses/${courseId}`);

    const courseData: Course = {
      id: courseId,
      professorId: user.uid,
      name: values.name,
      code: values.code,
      syllabus: values.syllabus,
      objectives: values.objectives,
      competencies: values.competencies || '',
      thematicTree: [], // Default empty value
      bibliography: {
        basic: values.bibliography_basic || '',
        complementary: values.bibliography_complementary || '',
        recommended: values.bibliography_recommended || '',
      },
    };

    setDocumentNonBlocking(courseRef, courseData, { merge: false });

    toast({
      title: 'Disciplina Criada com Sucesso!',
      description: `A disciplina "${values.name}" foi adicionada.`,
    });

    router.push('/disciplinas');
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Adicionar Nova Disciplina</CardTitle>
        <CardDescription>
          Use a IA para importar de um plano de ensino (PDF) ou preencha o
          formulário manualmente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="importar" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="importar">Importar com IA</TabsTrigger>
            <TabsTrigger value="manual">Cadastro Manual</TabsTrigger>
          </TabsList>
          <TabsContent value="importar">
            <div className="text-center p-8 space-y-4">
              <p className="text-muted-foreground">
                Recomendado! Economize tempo deixando a IA preencher tudo para
                você a partir do plano de ensino oficial.
              </p>
              <Input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf"
                disabled={isPending}
              />
              <Button onClick={handleImportClick} disabled={isPending} size="lg">
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UploadCloud className="mr-2 h-4 w-4" />
                )}
                Carregar PDF do Plano de Ensino
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="manual">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="space-y-4 pt-6">
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
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm">Bibliografia</h3>
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
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Criar Disciplina
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
