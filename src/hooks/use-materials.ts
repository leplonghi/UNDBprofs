'use client';

import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import {
  collection, query, orderBy, addDoc, serverTimestamp
} from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import type { Document, DocumentType } from '@/types';
import { useToast } from './use-toast';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';


export interface AddMaterialData {
  name: string;
  description: string;
  course: string;
  discipline: string;
  documentType: DocumentType;
  uploadType: 'file' | 'link';
  file?: File | null;
  link?: string;
}

export function useMaterials() {
  const { user } } from useUser();
  const firestore = useFirestore();
  const storage = getStorage();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const materialsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Note: The collection is named 'documents' in Firestore from previous setup
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
      let fileUrl = '';
      let fileMetadata: Partial<Document> = {};

      if (data.uploadType === 'link' && data.link) {
        fileUrl = data.link;
      } else if (data.uploadType === 'file' && data.file) {
        const file = data.file;
        const storageRef = ref(storage, `materials/${user.uid}/${uuidv4()}-${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error) => reject(error),
            async () => {
              fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
              fileMetadata = { fileName: file.name, fileType: file.type };
              resolve();
            }
          );
        });
      } else {
        throw new Error("Dados inválidos para upload.");
      }

      const docRef = collection(firestore, 'documents');
      await addDoc(docRef, {
        name: data.name,
        description: data.description,
        course: data.course,
        discipline: data.discipline,
        documentType: data.documentType,
        uploadType: data.uploadType,
        fileUrl,
        ...fileMetadata,
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
