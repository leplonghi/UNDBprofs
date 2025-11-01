'use client';

import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import type { Student, ClassroomStudent, Grade } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface StudentGradesDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  student: Student;
  classroomStudent: ClassroomStudent;
  courseId: string;
  classroomId: string;
}

const gradeSchema = z.object({
  id: z.string(),
  description: z.string().min(1, 'Descrição é obrigatória.'),
  score: z.coerce.number().min(0, 'Nota deve ser positiva.').max(10, 'Nota não pode ser maior que 10.'),
});

const formSchema = z.object({
  grades: z.array(gradeSchema),
});

type FormData = z.infer<typeof formSchema>;

export function StudentGradesDialog({
  isOpen,
  onOpenChange,
  student,
  classroomStudent,
  courseId,
  classroomId,
}: StudentGradesDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      grades: classroomStudent.grades || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "grades",
  });
  
  React.useEffect(() => {
    form.reset({
        grades: classroomStudent.grades || []
    })
  }, [classroomStudent, form])

  const onSubmit = async (values: FormData) => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Erro de Autenticação.' });
      return;
    }

    setIsSaving(true);
    const classroomStudentRef = doc(
      firestore,
      `professors/${user.uid}/courses/${courseId}/classrooms/${classroomId}/classroomStudents/${classroomStudent.id}`
    );

    try {
      updateDocumentNonBlocking(classroomStudentRef, { grades: values.grades });
      toast({
        title: 'Notas Salvas!',
        description: `As notas de ${student.name} foram atualizadas.`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving grades:", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao Salvar',
        description: 'Não foi possível salvar as notas. Tente novamente.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNewGrade = () => {
    append({ id: uuidv4(), description: '', score: 0 });
  };
  
  const average = form.watch('grades').reduce((acc, grade) => acc + (grade.score || 0), 0) / (form.watch('grades').length || 1);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Notas de {student.name}</DialogTitle>
          <DialogDescription>
            Gerencie as notas do aluno para esta turma. A média atual é {average.toFixed(1)}.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <div className="max-h-80 overflow-y-auto rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Descrição</TableHead>
                            <TableHead className="w-[100px]">Nota</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.map((field, index) => (
                           <TableRow key={field.id}>
                                <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`grades.${index}.description`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input {...field} placeholder="Ex: Prova 1" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </TableCell>
                                <TableCell>
                                     <FormField
                                        control={form.control}
                                        name={`grades.${index}.score`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input type="number" step="0.1" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                           </TableRow>
                        ))}
                         {fields.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                    Nenhuma nota lançada.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
             </div>
             <div className='flex justify-start'>
                <Button type="button" variant="outline" size="sm" onClick={handleAddNewGrade}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Nota
                </Button>
             </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSaving}>Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
