'use client';

import React, { useState, useRef, useTransition } from 'react';
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
import { useUser, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { Loader2, UploadCloud, FileScan, FileText } from 'lucide-react';
import type { Student, ClassroomStudent, ExtractedStudent } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { extractStudentsFromDocument } from '@/ai/flows/extract-students-from-document';
import { StudentReviewTable } from './student-review-table';


interface StudentUploadDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  classroomId: string;
  courseId: string;
}

interface ParsedStudent {
  name: string;
  email: string;
  registrationId?: string;
}

// Simple email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function StudentUploadDialog({
  isOpen,
  onOpenChange,
  classroomId,
  courseId,
}: StudentUploadDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedStudents, setExtractedStudents] = useState<ExtractedStudent[]>([]);
  const [currentTab, setCurrentTab] = useState('csv');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExtracting, startExtractionTransition] = useTransition();

  const resetState = () => {
    setIsProcessing(false);
    setSelectedFile(null);
    setExtractedStudents([]);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
        resetState();
    }
    onOpenChange(open);
  };


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (currentTab === 'csv') {
        if (file.type === 'text/csv' || file.name.endsWith('.csv') || file.type === 'application/vnd.ms-excel') {
            setSelectedFile(file);
        } else {
            toast({
                variant: 'destructive',
                title: 'Arquivo Inválido',
                description: 'Por favor, selecione um arquivo no formato CSV.',
            });
            setSelectedFile(null);
        }
    } else { // AI Extraction
        setSelectedFile(file);
    }
  };

const parseCSV = (file: File): Promise<ParsedStudent[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                const rows = text.split(/\r?\n/).filter(row => row.trim() !== '');

                if (rows.length < 2) {
                    return reject(new Error('O arquivo CSV está vazio ou contém apenas o cabeçalho.'));
                }

                const headerRow = rows.shift()!;
                const delimiter = headerRow.includes(';') ? ';' : ',';
                const headers = headerRow.split(delimiter).map(h => h.trim().toLowerCase().replace(/["']/g, ''));

                const nameIndex = headers.findIndex(h => h === 'nome' || h === 'name' || h === 'first name');
                const lastNameIndex = headers.findIndex(h => h === 'sobrenome' || h === 'last name');
                const emailIndex = headers.findIndex(h => h.includes('email') || h.includes('e-mail'));
                const registrationIdIndex = headers.findIndex(h => h.includes('matrícula') || h.includes('matricula') || h.includes('id'));
                
                if (emailIndex === -1) {
                    return reject(new Error("A coluna 'E-mail' é obrigatória no arquivo CSV."));
                }
                 if (nameIndex === -1 && lastNameIndex === -1) {
                    return reject(new Error("Pelo menos uma coluna ('Nome' ou 'Sobrenome') é obrigatória."));
                }
                
                const students = rows.map((row, index) => {
                    const columns = row.split(delimiter).map(c => c.trim().replace(/["']/g, ''));

                    const firstName = nameIndex > -1 ? (columns[nameIndex] || '') : '';
                    const lastName = lastNameIndex > -1 ? (columns[lastNameIndex] || '') : '';
                    const name = `${firstName} ${lastName}`.trim();
                    const email = columns[emailIndex] || '';
                    const registrationId = registrationIdIndex > -1 ? (columns[registrationIdIndex] || '') : undefined;
                    
                    if (name && email && emailRegex.test(email)) {
                        return { name, email, registrationId };
                    }
                    
                    if (name && email && !emailRegex.test(email)) {
                        console.warn(`Linha ${index + 2} ignorada: e-mail inválido.`, {name, email});
                        toast({
                            variant: 'destructive',
                            title: 'Linha Ignorada',
                            description: `A linha ${index + 2} foi ignorada por conter um e-mail inválido: ${email}`,
                        });
                    } else if (!name || !email) {
                        console.warn(`Linha ${index + 2} ignorada por dados ausentes.`, {name, email});
                    }

                    return null;
                }).filter((s): s is ParsedStudent => s !== null);

                if (students.length === 0) {
                    return reject(new Error('Nenhum aluno válido foi encontrado no arquivo. Verifique o conteúdo e o formato.'));
                }

                resolve(students);
            } catch (error: any) {
                reject(new Error(`Falha ao processar o CSV: ${error.message}`));
            }
        };
        reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
        reader.readAsText(file, 'UTF-8');
    });
};

const handleAIExtraction = () => {
    if (!selectedFile) {
        toast({ variant: 'destructive', title: 'Nenhum arquivo selecionado.' });
        return;
    }
    startExtractionTransition(() => {
        toast({ title: 'Extraindo alunos...', description: 'A IA está analisando o documento.' });
        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        reader.onload = async () => {
            try {
                const documentDataUri = reader.result as string;
                const result = await extractStudentsFromDocument({ documentDataUri });
                setExtractedStudents(result.students);
                toast({ title: 'Extração Concluída!', description: 'Revise a lista de alunos abaixo.' });
            } catch (error) {
                console.error('AI Extraction error:', error);
                toast({ variant: 'destructive', title: 'Erro na Extração', description: 'Não foi possível extrair alunos do documento.' });
            }
        };
        reader.onerror = () => {
             toast({ variant: 'destructive', title: 'Erro de Leitura', description: 'Não foi possível ler o arquivo selecionado.' });
        }
    });
};


  const handleUpload = async (studentsToCreate: ParsedStudent[]) => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Você precisa estar logado.' });
      return;
    }
    if (studentsToCreate.length === 0) {
        toast({ variant: 'destructive', title: 'Nenhum Aluno', description: 'A lista de alunos a ser adicionada está vazia.' });
        return;
    }

    setIsProcessing(true);
    toast({ title: 'Iniciando importação...', description: `Adicionando ${studentsToCreate.length} alunos à turma.` });

    try {
        for (const studentData of studentsToCreate) {
            const studentId = uuidv4(); 
            const studentRef = doc(firestore, `students/${studentId}`);
            
            const studentPayload: Student = {
              id: studentId,
              name: studentData.name,
              email: studentData.email,
              registrationId: studentData.registrationId || null,
            };
            
            // Create the student document first.
            setDocumentNonBlocking(studentRef, studentPayload, { merge: false });

            // Then create the association 
            const classroomStudentId = uuidv4();
            const classroomStudentRef = doc(firestore, `professors/${user.uid}/courses/${courseId}/classrooms/${classroomId}/classroomStudents/${classroomStudentId}`);
            const classroomStudentPayload: ClassroomStudent = {
              id: classroomStudentId,
              classroomId: classroomId,
              studentId: studentId,
            };
            setDocumentNonBlocking(classroomStudentRef, classroomStudentPayload, { merge: false });
      }

      toast({
        title: 'Sucesso!',
        description: `${studentsToCreate.length} aluno(s) foram adicionados à turma.`,
      });
      handleOpenChange(false);

    } catch (error: any) {
      console.error('Error uploading students:', error);
      toast({
        variant: 'destructive',
        title: 'Erro na Importação',
        description: error.message || 'Não foi possível salvar os alunos.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessCSV = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    try {
        const students = await parseCSV(selectedFile);
        await handleUpload(students);
    } catch(error: any) {
        toast({
            variant: 'destructive',
            title: 'Erro ao Processar CSV',
            description: error.message,
        });
        setIsProcessing(false);
    }
  };
  
  const handleProcessAIExtraction = async () => {
    await handleUpload(extractedStudents);
  }


  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Adicionar Alunos à Turma</DialogTitle>
          <DialogDescription>
            Use uma das opções abaixo para popular a lista de alunos da turma.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={(val) => { resetState(); setCurrentTab(val) }} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="csv">
                    <FileText className="mr-2" />
                    Importar CSV
                </TabsTrigger>
                <TabsTrigger value="ai">
                    <FileScan className="mr-2" />
                    Extrair com IA
                </TabsTrigger>
            </TabsList>
            <TabsContent value="csv">
                <div className="space-y-4 py-4">
                     <p className="text-sm text-muted-foreground">
                        Envie um arquivo CSV com as colunas "Nome", "Sobrenome" (opcional), "E-mail" e "Matrícula" (opcional).
                    </p>
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
                        accept=".csv,application/vnd.ms-excel"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={isProcessing}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isProcessing}>
                        Cancelar
                    </Button>
                    <Button onClick={handleProcessCSV} disabled={!selectedFile || isProcessing}>
                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Enviar Lista
                    </Button>
                </DialogFooter>
            </TabsContent>
            <TabsContent value="ai">
                 <div className="space-y-4 py-4">
                     <p className="text-sm text-muted-foreground">
                       Envie um documento (imagem ou PDF) contendo a lista de alunos. A IA tentará extrair nome, e-mail e matrícula.
                    </p>
                    {extractedStudents.length === 0 ? (
                        <>
                            <div 
                                className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <UploadCloud className="w-10 h-10 text-muted-foreground" />
                                <p className="mt-2 text-sm text-muted-foreground">
                                {selectedFile ? selectedFile.name : 'Clique para selecionar um documento'}
                                </p>
                            </div>
                            <Input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,.pdf"
                                className="hidden"
                                onChange={handleFileChange}
                                disabled={isExtracting}
                            />
                        </>
                    ) : (
                        <StudentReviewTable students={extractedStudents} setStudents={setExtractedStudents} />
                    )}
                </div>
                 <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isProcessing || isExtracting}>
                        Cancelar
                    </Button>
                     {extractedStudents.length === 0 ? (
                        <Button onClick={handleAIExtraction} disabled={!selectedFile || isExtracting}>
                            {isExtracting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Extrair Alunos
                        </Button>
                     ) : (
                        <Button onClick={handleProcessAIExtraction} disabled={isProcessing}>
                             {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar Alunos
                        </Button>
                     )}
                </DialogFooter>
            </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
