
'use client';

import React, { useState, useEffect } from 'react';
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
import { collection, addDoc } from 'firebase/firestore';
import { Loader2, Link2 } from 'lucide-react';
import type { Course } from '@/types';

interface AddDocumentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  courseId?: string | null;
}

export function AddDocumentDialog({
  isOpen,
  onOpenChange,
  courseId: preselectedCourseId,
}: AddDocumentDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const [documentName, setDocumentName] = useState('');
  const [link, setLink] = useState('');
  const [courseId, setCourseId] = useState<string | null>(null);

  const coursesQuery = useMemoFirebase(
    () =>
      user ? collection(firestore, `professors/${user.uid}/courses`) : null,
    [user, firestore]
  );
  const { data: courses, isLoading: isLoadingCourses } =
    useCollection<Course>(coursesQuery);

  useEffect(() => {
    if (preselectedCourseId) {
      setCourseId(preselectedCourseId);
    }
  }, [preselectedCourseId]);

  const resetState = () => {
    setIsProcessing(false);
    setDocumentName('');
    setLink('');
    setCourseId(preselectedCourseId || null);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetState();
    }
    onOpenChange(open);
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
    if (!link) {
      toast({ variant: 'destructive', title: 'O link é obrigatório.' });
      return;
    }

    setIsProcessing(true);

    const docCollectionRef = collection(firestore, 'documents');

    try {
      const documentData = {
        professorId: user.uid,
        course: courseId || null,
        name: documentName,
        fileUrl: link,
        uploadType: 'link',
        createdAt: new Date().toISOString(),
        authorName: user.displayName,
        description: "",
        discipline: "",
        documentType: "outro",
        views: 0,
        favorites: 0,
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
          <DialogTitle>Adicionar Novo Link</DialogTitle>
          <DialogDescription>
            Adicione um link para um documento externo, vídeo ou outro material.
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

          {!preselectedCourseId && (
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
          )}

          <div className="space-y-2 pt-2">
            <Label htmlFor="doc-link">URL do Link</Label>
            <div className="flex items-center">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted h-10">
                    <Link2 className="h-5 w-5 text-muted-foreground" />
                </span>
                <Input
                    id="doc-link"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://..."
                    disabled={isProcessing}
                    className="rounded-l-none"
                />
            </div>
          </div>
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
            Salvar Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
