'use client';

import { useState, useTransition } from 'react';
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';

const formSchema = z.object({
  courseName: z.string().min(1, 'Nome do curso é obrigatório.'),
  courseCode: z.string().min(1, 'Código do curso é obrigatório.'),
  syllabus: z.string().min(1, 'Ementa é obrigatória.'),
  objectives: z.string().min(1, 'Objetivos são obrigatórios.'),
  workload: z.string().min(1, 'Carga horária é obrigatória.'),
  semester: z.string().min(1, 'Semestre é obrigatório.'),
});

export function ImportForm() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [extractedData, setExtractedData] = useState<ImportCourseFromLessonPlanOutput | null>(null);
  const [fileName, setFileName] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
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
          form.reset(result);
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

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast({
      title: 'Disciplina Criada com Sucesso!',
      description: `A disciplina "${values.courseName}" foi adicionada.`,
    });
    form.reset();
    setExtractedData(null);
    setFileName('');
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Importar de Plano de Ensino</CardTitle>
        <CardDescription>
          Faça o upload do arquivo PDF do plano de ensino. A IA irá extrair as informações para você.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center space-y-2 rounded-lg border-2 border-dashed border-border p-8 text-center">
              <Upload className="h-12 w-12 text-muted-foreground" />
              <Label
                htmlFor="file-upload"
                className="cursor-pointer text-primary underline-offset-4 hover:underline"
              >
                Escolha um arquivo PDF
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
                <span>Analisando documento...</span>
              </div>
            )}

            {extractedData && (
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
              </div>
            )}
          </CardContent>
          <CardFooter>
            {extractedData && (
              <Button type="submit" className="w-full">
                Confirmar e Criar Disciplina
              </Button>
            )}
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
