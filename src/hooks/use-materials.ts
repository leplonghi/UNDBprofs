'use client';

import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import {
  collection, query, orderBy, addDoc
} from 'firebase/firestore';
import type { Document, DocumentType } from '@/types';
import { useToast } from './use-toast';
import { useState } from 'react';

export interface AddMaterialData {
  name: string;
  description: string;
  course: string;
  discipline: string;
  documentType: DocumentType;
  uploadType: 'link';
  link: string;
}

export function useMaterials() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // Kept for now, but unused

  const materialsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'documents'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: materials, isLoading, error } = useCollection<Document>(materialsQuery);

  const addMaterial = async (data: AddMaterialData): Promise<boolean> => {
    if (!firestore || !user?.uid) {
      toast({ variant: 'destructive', title: 'Você precisa estar logado.' });
      return false;
    }

    setIsAdding(true);
    setUploadProgress(0);

    try {
      if (data.uploadType !== 'link' || !data.link) {
        throw new Error("Dados inválidos. Apenas links são permitidos.");
      }

      const docRef = collection(firestore, 'documents');
      await addDoc(docRef, {
        name: data.name,
        description: data.description,
        course: data.course,
        discipline: data.discipline,
        documentType: data.documentType,
        uploadType: 'link',
        fileUrl: data.link,
        professorId: user.uid,
        authorName: user.displayName || 'Anônimo',
        createdAt: new Date().toISOString(),
        views: 0,
        favorites: 0,
      });

      toast({ title: 'Sucesso!', description: 'Material compartilhado com a comunidade.' });
      setIsAdding(false);
      return true;

    } catch (e) {
      console.error('Error adding material: ', e);
      toast({ variant: 'destructive', title: 'Erro ao compartilhar', description: 'Não foi possível enviar o material.' });
      setIsAdding(false);
      return false;
    }
  };

  return { materials, isLoading, error, addMaterial, isAdding, uploadProgress };
}
