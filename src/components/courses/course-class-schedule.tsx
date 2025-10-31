'use client';
import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { DocumentReference } from 'firebase/firestore';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { updateDocumentNonBlocking } from '@/firebase';
import { Loader2, Pencil, Trash2 } from 'lucide-react';

const classScheduleItemSchema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  content: z.string().min(1, 'Conteúdo é obrigatório'),
  activity: z.string().min(1, 'Atividade é obrigatória'),
});

const formSchema = z.object({
  classSchedule: z.array(classScheduleItemSchema),
});

type FormData = z.infer<typeof formSchema>;

interface CourseClassScheduleProps {
  course: any;
  courseRef: DocumentReference | null;
}

export function CourseClassSchedule({ course, courseRef }: CourseClassScheduleProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      classSchedule: course.classSchedule || [],
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'classSchedule',
  });

  useEffect(() => {
    // Reset form when the course data changes (e.g., on initial load)
    form.reset({
      classSchedule: course.classSchedule || [],
    });
  }, [course.classSchedule, form]);

  const onSubmit = (data: FormData) => {
    if (!courseRef) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Referência do curso não encontrada.' });
        return;
    }

    updateDocumentNonBlocking(courseRef, { classSchedule: data.classSchedule });

    toast({
      title: 'Cronograma Atualizado!',
      description: 'As alterações no cronograma de aulas foram salvas.',
    });
    setIsEditDialogOpen(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-lg">Cronograma de Aulas</h3>
        <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar Cronograma
        </Button>
      </div>

      {course.classSchedule && course.classSchedule.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Conteúdo</TableHead>
                <TableHead>Atividade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {course.classSchedule.map((item: any, index: number) => (
                <TableRow key={index}>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>{item.content}</TableCell>
                  <TableCell>{item.activity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhum cronograma de aulas cadastrado.</p>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Editar Cronograma de Aulas</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto space-y-6 p-1">
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-7 gap-2 items-start border p-3 rounded-lg relative">
                    <FormField
                      control={form.control}
                      name={`classSchedule.${index}.date`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Data</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`classSchedule.${index}.content`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Conteúdo</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`classSchedule.${index}.activity`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Atividade</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => remove(index)}
                        className="md:mt-8"
                    >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remover aula</span>
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => append({ date: '', content: '', activity: '' })}
              >
                Adicionar Aula
              </Button>
            </form>
          </Form>
          <DialogFooter className="mt-4 pt-4 border-t">
             <DialogClose asChild>
                <Button type="button" variant="ghost">Cancelar</Button>
             </DialogClose>
            <Button type="submit" onClick={form.handleSubmit(onSubmit)} disabled={form.formState.isSubmitting}>
               {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
