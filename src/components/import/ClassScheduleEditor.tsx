'use client';

import { useFieldArray, useFormContext, type Control } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FormField, FormItem, FormControl, FormMessage, FormLabel } from '@/components/ui/form';
import { PlusCircle, Trash2, CalendarIcon, XCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, addDays, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';


interface ClassScheduleEditorProps {
    control: Control<any>;
}

export function ClassScheduleEditor({ control }: ClassScheduleEditorProps) {
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'classSchedule',
  });
  
  const { setValue } = useFormContext();

  const handleAutoFillDates = (baseDate: Date) => {
    fields.forEach((field, index) => {
        if (index > 0) { // Don't update the first one, as it's the base
            const newDate = addDays(baseDate, index * 7);
            setValue(`classSchedule.${index}.date`, format(newDate, 'yyyy-MM-dd'));
        }
    });
  };
  
  const clearAllDates = () => {
    fields.forEach((field, index) => {
        setValue(`classSchedule.${index}.date`, '');
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <FormLabel>Cronograma de Aulas</FormLabel>
        <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAllDates}
            disabled={fields.length === 0}
            >
            <XCircle className="mr-2 h-4 w-4" />
            Limpar Datas
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Data</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Tópico</TableHead>
              <TableHead>Conteúdo</TableHead>
              <TableHead>Atividade</TableHead>
              <TableHead>Local</TableHead>
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
                         <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                    )}
                                >
                                    {field.value ? (
                                    format(parseISO(field.value), "dd/MM/yyyy")
                                    ) : (
                                    <span>Selecione a data</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value ? parseISO(field.value) : undefined}
                                    onSelect={(date) => {
                                        if (date) {
                                           const formattedDate = format(date, 'yyyy-MM-dd');
                                           field.onChange(formattedDate);
                                           if (index === 0) { // Is first item
                                                handleAutoFillDates(date);
                                           }
                                        }
                                    }}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TableCell>
                 <TableCell>
                   <FormField
                    control={control}
                    name={`classSchedule.${index}.type`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} placeholder="Ex: TEÓRICA" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TableCell>
                 <TableCell>
                   <FormField
                    control={control}
                    name={`classSchedule.${index}.topic`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} placeholder="Ex: UA I" />
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
                   <FormField
                    control={control}
                    name={`classSchedule.${index}.location`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                           <Input {...field} placeholder="Ex: Sala de Aula"/>
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
        onClick={() => append({ date: '', type: '', topic: '', content: '', activity: '', location: '' })}
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Adicionar Aula
      </Button>
    </div>
  );
}
