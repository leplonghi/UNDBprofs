'use client';

import { useFieldArray, type Control } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FormField, FormItem, FormControl, FormMessage, FormLabel } from '@/components/ui/form';
import { PlusCircle, Trash2 } from 'lucide-react';

interface ThematicTreeEditorProps {
    control: Control<any>;
}

export function ThematicTreeEditor({ control }: ThematicTreeEditorProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'thematicTree',
  });

  return (
    <div className="space-y-2">
      <FormLabel>Árvore Temática</FormLabel>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/3">Nome da Etapa</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-[50px]"><span className="sr-only">Remover</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((item, index) => (
              <TableRow key={item.id}>
                <TableCell>
                  <FormField
                    control={control}
                    name={`thematicTree.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} placeholder="Ex: Análise de Requisitos" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TableCell>
                <TableCell>
                  <FormField
                    control={control}
                    name={`thematicTree.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea {...field} placeholder="Descreva a etapa do projeto..." rows={2} />
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
        onClick={() => append({ name: '', description: '' })}
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Adicionar Etapa
      </Button>
    </div>
  );
}
