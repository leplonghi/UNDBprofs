
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import { doc, collection, addDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import {
  Loader2,
  UploadCloud,
  Link2,
} from 'lucide-react';
import type { Course, Document as DocumentType } from '@/types';
import { Progress } from '../ui/progress';

interface AddDocumentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const MAX_FILE_SIZE_MB = 1;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export function AddDocumentDialog({
  isOpen,
  onOpenChange,
}: AddDocumentDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState<'file' | 'link'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState('');
  const [courseId, setCourseId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const coursesQuery = useMemoFirebase(
    () =>
      user ? collection(firestore, `professors/${user.uid}/courses`) : null,
    [user, firestore]
  );
  const { data: courses, isLoading: isLoadingCourses } =
    useCollection<Course>(coursesQuery);

  const resetState = () => {
    setIsProcessing(false);
    setUploadProgress(0);
    setDocumentName('');
    setDocumentType('file');
    setFile(null);
    setLink('');
    setCourseId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetState();
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
            // Clear the file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            setFile(null);
        } else {
            setFile(selectedFile);
        }
    }
  };

  const handleSubmit = async () => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Usuário não autenticado.' });
      return;
    }
    if (!documentName) {
      toast({ variant: 'destructive', title: 'O nome do documento é obrigatório.' });
      return;
    }
    if (documentType === 'file' && !file) {
      toast({ variant: 'destructive', title: 'Nenhum arquivo selecionado.' });
      return;
    }
    if (documentType === 'link' && !link) {
      toast({ variant: 'destructive', title: 'O link é obrigatório.' });
      return;
    }

    setIsProcessing(true);

    const docCollectionRef = collection(
      firestore,
      `professors/${user.uid}/documents`
    );

    try {
      let fileUrl = '';
      let fileMetadata: Partial<DocumentType> = {};

      if (documentType === 'link') {
        fileUrl = link;
      } else if (file) {
        const storage = getStorage();
        const storageRef = ref(
          storage,
          `documents/${user.uid}/${uuidv4()}-${file.name}`
        );
        const uploadTask = uploadBytesResumable(storageRef, file);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error) => {
              console.error('Upload failed:', error);
              reject(error);
            },
            async () => {
              fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
              fileMetadata = {
                fileName: file.name,
                fileType: file.type,
              };
              resolve();
            }
          );
        });
      }

      const documentData: Omit<DocumentType, 'id'> = {
        professorId: user.uid,
        courseId: courseId || null,
        name: documentName,
        fileUrl,
        documentType,
        ...fileMetadata,
        createdAt: new Date().toISOString(),
      };

      await addDoc(docCollectionRef, documentData);

      toast({
        title: 'Documento Adicionado!',
        description: `"${documentName}" foi salvo com sucesso.`,
      });
      handleOpenChange(false);
    } catch (error) {
      console.error('Error adding document:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao Adicionar Documento',
        description: 'Não foi possível salvar o documento. Tente novamente.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Novo Documento</DialogTitle>
          <DialogDescription>
            Envie um arquivo ou cole um link externo para compartilhar com suas
            turmas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="doc-name">Nome do Documento</Label>
            <Input
              id="doc-name"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="Ex: Aula 01 - Introdução"
              disabled={isProcessing}
            />
          </div>

          <div className="space-y-2">
            <Label>Associar à Disciplina (Opcional)</Label>
            <Select
              onValueChange={(value) => setCourseId(value)}
              disabled={isLoadingCourses || isProcessing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma disciplina..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                {courses?.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name} ({course.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <RadioGroup
            defaultValue="file"
            className="grid grid-cols-2 gap-4"
            value={documentType}
            onValueChange={(value: 'file' | 'link') => setDocumentType(value)}
          >
            <div>
              <RadioGroupItem
                value="file"
                id="type-file"
                className="peer sr-only"
                disabled={isProcessing}
              />
              <Label
                htmlFor="type-file"
                className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <UploadCloud className="mb-2 h-6 w-6" />
                Upload de Arquivo
              </Label>
            </div>

            <div>
              <RadioGroupItem
                value="link"
                id="type-link"
                className="peer sr-only"
                disabled={isProcessing}
              />
              <Label
                htmlFor="type-link"
                className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <Link2 className="mb-2 h-6 w-6" />
                Link Externo
              </Label>
            </div>
          </RadioGroup>

          {documentType === 'file' ? (
            <div className="space-y-2 pt-2">
              <Label>Arquivo</Label>
              <div
                className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="w-10 h-10 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  {file ? file.name : 'Clique para selecionar um arquivo'}
                </p>
              </div>
              <Input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                disabled={isProcessing}
              />
              {isProcessing && uploadProgress > 0 && (
                <Progress value={uploadProgress} className="w-full" />
              )}
            </div>
          ) : (
            <div className="space-y-2 pt-2">
              <Label htmlFor="doc-link">URL do Link</Label>
              <Input
                id="doc-link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
                disabled={isProcessing}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isProcessing}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isProcessing}>
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Documento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
