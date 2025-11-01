'use client';

import { useFieldArray, type Control } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FormField, FormItem, FormControl, FormMessage, FormLabel } from '@/components/ui/form';
import { PlusCircle, Trash2 } from 'lucide-react';

interface ClassScheduleEditorProps {
    control: Control<any>;
}

export function ClassScheduleEditor({ control }: ClassScheduleEditorProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'classSchedule',
  });

  return (
    <div className="space-y-2">
      <FormLabel>Cronograma de Aulas</FormLabel>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Data</TableHead>
              <TableHead>Conteúdo</TableHead>
              <TableHead>Atividade</TableHead>
              <TableHead className="w-[50px]"><span className="sr-only">Remover</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((item, index) => (
              <TableRow key={item.id}>
                <TableCell>
                   <FormField
                    control={control}
                    name={`classSchedule.${index}.date`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} placeholder="YYYY-MM-DD" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TableCell>
                <TableCell>
                   <FormField
                    control={control}
                    name={`classSchedule.${index}.content`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea {...field} placeholder="Tópicos da aula" rows={2} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TableCell>
                <TableCell>
                   <FormField
                    control={control}
                    name={`classSchedule.${index}.activity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                           <Textarea {...field} placeholder="Atividade em sala" rows={2}/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
       <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ date: '', content: '', activity: '' })}
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Adicionar Aula
      </Button>
    </div>
  );
}
