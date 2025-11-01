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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, PlusCircle, Trash2, ClipboardPaste } from 'lucide-react';
import type { Student, ClassroomStudent, Grade } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { Separator } from '../ui/separator';

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
  maxScore: z.coerce.number().optional(),
  group: z.enum(['N1', 'N2']).optional(),
});

const formSchema = z.object({
  grades: z.array(gradeSchema),
});

type FormData = z.infer<typeof formSchema>;


const studioTemplate: Omit<Grade, 'id'>[] = [
    { description: 'Relatório de Análise e Benchmarking', score: 0, maxScore: 2, group: 'N1' },
    { description: 'Solução Preliminar', score: 0, maxScore: 2, group: 'N1' },
    { description: 'Checks de Desenvolvimento', score: 0, maxScore: 1, group: 'N2' },
    { description: 'Caderno Técnico', score: 0, maxScore: 3, group: 'N2' },
];


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

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "grades",
  });
  
  React.useEffect(() => {
    form.reset({
        grades: classroomStudent.grades || []
    })
  }, [classroomStudent, form, isOpen]);

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

  const applyStudioTemplate = () => {
    const templateWithIds = studioTemplate.map(item => ({ ...item, id: uuidv4() }));
    replace(templateWithIds);
    toast({
        title: 'Template Aplicado!',
        description: 'As notas do template de estúdio foram carregadas.'
    })
  }

  const watchedGrades = form.watch('grades');
  const n1Grades = watchedGrades.filter(g => g.group === 'N1');
  const n2Grades = watchedGrades.filter(g => g.group === 'N2');
  const otherGrades = watchedGrades.filter(g => !g.group);
  
  const n1Total = n1Grades.reduce((acc, grade) => acc + (grade.score || 0), 0);
  const n2Total = n2Grades.reduce((acc, grade) => acc + (grade.score || 0), 0);
  const finalGrade = n1Total + n2Total + otherGrades.reduce((acc, grade) => acc + (grade.score || 0), 0);

  const renderGradeRow = (field: Record<"id", string>, index: number) => (
       <TableRow key={field.id}>
            <TableCell>
                <FormField
                    control={form.control}
                    name={`grades.${index}.description`}
                    render={({ field: formField }) => (
                        <FormItem>
                            <FormControl>
                                <Input {...formField} placeholder="Ex: Prova 1" />
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
                    render={({ field: formField }) => (
                        <FormItem>
                            <FormControl>
                                <div className="flex items-center gap-2">
                                    <Input type="number" step="0.1" {...formField} />
                                    {form.getValues(`grades.${index}`).maxScore && <span className="text-sm text-muted-foreground">/ {form.getValues(`grades.${index}`).maxScore?.toFixed(1)}</span>}
                                </div>
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
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Notas de {student.name}</DialogTitle>
          <DialogDescription>
            Gerencie as notas do aluno. Adicione, edite ou aplique templates de avaliação.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <div className="max-h-[55vh] overflow-y-auto rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Descrição da Avaliação</TableHead>
                            <TableHead className="w-[150px]">Nota</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {n1Grades.length > 0 && (
                            <TableRow className="bg-muted/30">
                                <TableCell colSpan={3} className="py-2 text-sm font-semibold text-primary">N1</TableCell>
                            </TableRow>
                        )}
                        {fields.map((field, index) => watchedGrades[index].group === 'N1' ? renderGradeRow(field, index) : null)}

                        {n2Grades.length > 0 && (
                             <TableRow className="bg-muted/30">
                                <TableCell colSpan={3} className="py-2 text-sm font-semibold text-primary">N2</TableCell>
                            </TableRow>
                        )}
                        {fields.map((field, index) => watchedGrades[index].group === 'N2' ? renderGradeRow(field, index) : null)}
                        
                        {otherGrades.length > 0 && (
                            <>
                            <TableRow className="bg-muted/30">
                                <TableCell colSpan={3} className="py-2 text-sm font-semibold text-primary">Outras</TableCell>
                            </TableRow>
                             {fields.map((field, index) => !watchedGrades[index].group ? renderGradeRow(field, index) : null)}
                            </>
                        )}
                         
                         {fields.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                    Nenhuma nota lançada.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                    <TableFooter>
                        <TableRow className="bg-secondary/50">
                            <TableHead>Totais</TableHead>
                            <TableHead colSpan={2} className="text-right">
                                <span className="mr-4">N1: <span className="font-bold">{n1Total.toFixed(1)}</span></span>
                                <span className="mr-4">N2: <span className="font-bold">{n2Total.toFixed(1)}</span></span>
                                <span>Final: <span className="font-bold text-primary">{finalGrade.toFixed(1)}</span></span>
                            </TableHead>
                        </TableRow>
                    </TableFooter>
                </Table>
             </div>
             <div className='flex justify-start gap-2'>
                <Button type="button" variant="outline" size="sm" onClick={handleAddNewGrade}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Nota
                </Button>
                 <Button type="button" variant="secondary" size="sm" onClick={applyStudioTemplate}>
                    <ClipboardPaste className="mr-2 h-4 w-4" />
                    Aplicar Template de Estúdio
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
