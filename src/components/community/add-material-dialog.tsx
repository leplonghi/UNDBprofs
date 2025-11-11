'use client';

import React, { useState, useRef } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { Loader2, UploadCloud, Link2 } from 'lucide-react';
import { useMaterials, type AddMaterialData } from '@/hooks/use-materials';
import { Progress } from '../ui/progress';
import { DocumentType } from '@/types';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const materialSchema = z.object({
  name: z.string().min(3, 'O título é obrigatório.'),
  description: z.string().min(10, 'A descrição é obrigatória.'),
  course: z.string().min(1, 'O curso é obrigatório.'),
  discipline: z.string().min(1, 'A disciplina/área é obrigatória.'),
  documentType: z.string().min(1, 'O tipo de material é obrigatório.'),
  uploadType: z.enum(['file', 'link']),
  file: z.any().optional(),
  link: z.string().optional(),
}).refine(data => {
    if (data.uploadType === 'link') {
        return !!data.link && z.string().url().safeParse(data.link).success;
    }
    return true;
}, { message: 'URL inválida.', path: ['link'] })
.refine(data => {
    if (data.uploadType === 'file') {
        return !!data.file;
    }
    return true;
}, { message: 'Arquivo é obrigatório.', path: ['file'] });

type MaterialFormData = z.infer<typeof materialSchema>;


interface AddMaterialDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const documentTypes: DocumentType[] = [
    'aula expositiva', 'atividade em grupo', 'avaliação', 'projeto', 'estudo de caso', 'extensão', 'guia', 'outro'
];
const courses = ['Arquitetura e Urbanismo', 'Direito', 'Engenharia Civil', 'Psicologia', 'Sistemas de Informação'];


export function AddMaterialDialog({ isOpen, onOpenChange }: AddMaterialDialogProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const { addMaterial, isAdding, uploadProgress } = useMaterials();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { control, register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      uploadType: 'file',
      course: 'Arquitetura e Urbanismo'
    }
  });

  const uploadType = watch('uploadType');
  const file = watch('file');

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset();
    }
    onOpenChange(open);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
        if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
            toast({
                variant: 'destructive',
                title: 'Arquivo muito grande',
                description: `O arquivo excede o limite de ${MAX_FILE_SIZE_MB}MB. Por favor, use a opção "Link Externo".`,
            });
            if (fileInputRef.current) fileInputRef.current.value = '';
            setValue('file', null);
        } else {
            setValue('file', selectedFile);
        }
    }
  };
  
  const onSubmit = async (data: MaterialFormData) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Usuário não autenticado.' });
        return;
    }
    
    const materialData: AddMaterialData = {
        name: data.name,
        description: data.description,
        course: data.course,
        discipline: data.discipline,
        documentType: data.documentType as DocumentType,
        uploadType: data.uploadType,
        file: data.file,
        link: data.link
    };
    
    const success = await addMaterial(materialData);
    if (success) {
        handleOpenChange(false);
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Compartilhar Material</DialogTitle>
          <DialogDescription>
            Ajude a comunidade compartilhando seus materiais. Preencha os campos abaixo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Título do Material</Label>
                    <Input id="name" {...register('name')} disabled={isAdding} />
                    {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="discipline">Disciplina ou Área</Label>
                    <Input id="discipline" {...register('discipline')} placeholder="Ex: Projeto Arquitetônico IV" disabled={isAdding} />
                    {errors.discipline && <p className="text-sm text-destructive">{errors.discipline.message}</p>}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Breve Descrição</Label>
                <Textarea id="description" {...register('description')} rows={3} disabled={isAdding} />
                {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Curso</Label>
                    <Controller
                        name="course"
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isAdding}>
                                <SelectTrigger><SelectValue placeholder="Selecione o curso" /></SelectTrigger>
                                <SelectContent>
                                    {courses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.course && <p className="text-sm text-destructive">{errors.course.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label>Tipo de Material</Label>
                     <Controller
                        name="documentType"
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isAdding}>
                                <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                                <SelectContent>
                                    {documentTypes.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}
                    />
                     {errors.documentType && <p className="text-sm text-destructive">{errors.documentType.message}</p>}
                </div>
            </div>

            <Controller
                name="uploadType"
                control={control}
                render={({ field }) => (
                    <RadioGroup value={field.value} onValueChange={field.onChange} className="grid grid-cols-2 gap-4">
                        <div>
                            <RadioGroupItem value="file" id="type-file" className="peer sr-only" disabled={isAdding} />
                            <Label htmlFor="type-file" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                <UploadCloud className="mb-2 h-6 w-6" /> Upload de Arquivo
                            </Label>
                        </div>
                        <div>
                            <RadioGroupItem value="link" id="type-link" className="peer sr-only" disabled={isAdding} />
                            <Label htmlFor="type-link" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                <Link2 className="mb-2 h-6 w-6" /> Link Externo
                            </Label>
                        </div>
                    </RadioGroup>
                )}
            />

            {uploadType === 'file' ? (
                <div className="space-y-2 pt-2">
                    <Label>Arquivo</Label>
                    <div className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary" onClick={() => fileInputRef.current?.click()}>
                        <UploadCloud className="w-10 h-10 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">{file ? file.name : 'Clique para selecionar um arquivo'}</p>
                    </div>
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} disabled={isAdding} />
                     {errors.file && <p className="text-sm text-destructive">{errors.file.message}</p>}
                    {isAdding && uploadProgress > 0 && <Progress value={uploadProgress} className="w-full" />}
                </div>
            ) : (
                <div className="space-y-2 pt-2">
                    <Label htmlFor="link">URL do Link</Label>
                    <Input id="link" {...register('link')} placeholder="https://..." disabled={isAdding} />
                    {errors.link && <p className="text-sm text-destructive">{errors.link.message}</p>}
                </div>
            )}
            
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isAdding}>Cancelar</Button>
                <Button type="submit" disabled={isAdding}>
                    {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Compartilhar
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
