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
import { ScrollArea } from '../ui/scroll-area';
import type { Classroom } from '@/types';

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
  classroom: Classroom;
  classroomRef: DocumentReference | null;
}

export function CourseClassSchedule({ classroom, classroomRef }: CourseClassScheduleProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      classSchedule: classroom.classSchedule || [],
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'classSchedule',
  });

  useEffect(() => {
    form.reset({
      classSchedule: classroom.classSchedule || [],
    });
  }, [classroom.classSchedule, form]);

  const onSubmit = (data: FormData) => {
    if (!classroomRef) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Referência da turma não encontrada.' });
        return;
    }

    updateDocumentNonBlocking(classroomRef, { classSchedule: data.classSchedule });

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

      {classroom.classSchedule && classroom.classSchedule.length > 0 ? (
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
              {classroom.classSchedule.map((item: any, index: number) => (
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
        <p className="text-sm text-muted-foreground">Nenhum cronograma de aulas cadastrado para esta turma.</p>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Editar Cronograma de Aulas</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
              <ScrollArea className="flex-1 pr-6 -mr-6">
                <div className="space-y-4 py-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex flex-col md:flex-row gap-4 items-start border p-4 rounded-lg">
                      <FormField
                        control={form.control}
                        name={`classSchedule.${index}.date`}
                        render={({ field }) => (
                          <FormItem className="flex-1 w-full">
                            <FormLabel>Data</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="AAAA-MM-DD" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`classSchedule.${index}.content`}
                        render={({ field }) => (
                          <FormItem className="flex-1 w-full">
                            <FormLabel>Conteúdo</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Tema da aula" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`classSchedule.${index}.activity`}
                        render={({ field }) => (
                          <FormItem className="flex-1 w-full">
                            <FormLabel>Atividade</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Atividade planejada"/>
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
                          className="mt-0 md:mt-8 flex-shrink-0"
                      >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remover aula</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="flex-shrink-0 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => append({ date: '', content: '', activity: '' })}
                    className="w-full"
                >
                    Adicionar Aula
                </Button>
              </div>

              <DialogFooter className="mt-4 pt-4 border-t flex-shrink-0">
                 <DialogClose asChild>
                    <Button type="button" variant="ghost">Cancelar</Button>
                 </DialogClose>
                <Button type="submit" onClick={form.handleSubmit(onSubmit)} disabled={form.formState.isSubmitting}>
                   {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
