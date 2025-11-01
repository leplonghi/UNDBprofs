'use client';

import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { doc, writeBatch } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { Loader2, UploadCloud } from 'lucide-react';
import type { Student, ClassroomStudent } from '@/types';

interface StudentUploadDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  classroomId: string;
  courseId: string;
}

interface ParsedStudent {
  name: string;
  email: string;
}

export function StudentUploadDialog({
  isOpen,
  onOpenChange,
  classroomId,
  courseId,
}: StudentUploadDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
    } else {
      toast({
        variant: 'destructive',
        title: 'Arquivo Inválido',
        description: 'Por favor, selecione um arquivo no formato CSV.',
      });
      setSelectedFile(null);
    }
  };

  const parseCSV = (file: File): Promise<ParsedStudent[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = event => {
        const text = event.target?.result as string;
        const rows = text.split(/\r?\n/).filter(row => row.trim() !== '');
        const header = rows.shift()?.split(',').map(h => h.trim());

        if (!header || !header.includes('name') || !header.includes('email')) {
          return reject(new Error("O CSV deve conter as colunas 'name' e 'email'."));
        }

        const nameIndex = header.indexOf('name');
        const emailIndex = header.indexOf('email');

        const students = rows.map(row => {
          const columns = row.split(',');
          return {
            name: columns[nameIndex]?.trim(),
            email: columns[emailIndex]?.trim(),
          };
        }).filter(s => s.name && s.email); // Ensure no empty rows are processed

        resolve(students);
      };
      reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
      reader.readAsText(file);
    });
  };

  const handleUpload = async () => {
    if (!selectedFile || !user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Selecione um arquivo e certifique-se de estar logado.',
      });
      return;
    }

    setIsUploading(true);
    toast({ title: 'Iniciando importação...', description: 'Processando a lista de alunos.' });

    try {
      const studentsToCreate = await parseCSV(selectedFile);
      if (studentsToCreate.length === 0) {
        throw new Error('Nenhum aluno válido encontrado no arquivo.');
      }

      const batch = writeBatch(firestore);

      for (const studentData of studentsToCreate) {
        const studentId = uuidv4(); // In a real app, you might want to query for existing students first.
        const classroomStudentId = uuidv4();
        
        // 1. Create Student document
        const studentRef = doc(firestore, `students/${studentId}`);
        const studentPayload: Student = {
          id: studentId,
          name: studentData.name,
          email: studentData.email,
        };
        batch.set(studentRef, studentPayload);

        // 2. Create ClassroomStudent association
        const classroomStudentRef = doc(firestore, `professors/${user.uid}/courses/${courseId}/classrooms/${classroomId}/classroomStudents/${classroomStudentId}`);
        const classroomStudentPayload: ClassroomStudent = {
          id: classroomStudentId,
          classroomId: classroomId,
          studentId: studentId,
        };
        batch.set(classroomStudentRef, classroomStudentPayload);
      }
      
      await batch.commit();

      toast({
        title: 'Sucesso!',
        description: `${studentsToCreate.length} aluno(s) foram adicionados à turma.`,
      });
      onOpenChange(false);
      setSelectedFile(null);

    } catch (error: any) {
      console.error('Error uploading students:', error);
      toast({
        variant: 'destructive',
        title: 'Erro na Importação',
        description: error.message || 'Não foi possível processar a lista de alunos.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Alunos à Turma</DialogTitle>
          <DialogDescription>
            Envie um arquivo CSV com as colunas &quot;name&quot; e &quot;email&quot; para adicionar os alunos a esta turma.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div 
            className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className="w-10 h-10 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              {selectedFile ? selectedFile.name : 'Clique para selecionar um arquivo CSV'}
            </p>
          </div>
          <Input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
            Cancelar
          </Button>
          <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar Lista
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
