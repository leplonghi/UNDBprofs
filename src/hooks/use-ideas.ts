'use client';

import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import {
  collection,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import type { Idea } from '@/types';
import { useToast } from './use-toast';
import { useState } from 'react';

export function useIdeas() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);

  const ideasQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'ideas'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const {
    data: ideas,
    isLoading,
    error,
  } = useCollection<Idea>(ideasQuery);

  const addIdea = async (ideaData: Omit<Idea, 'id' | 'createdAt' | 'updatedAt' | 'supportCount' | 'authorId' | 'authorName' | 'course'>) => {
    if (!firestore || !user?.uid) {
      toast({
        variant: 'destructive',
        title: 'Você precisa estar logado para adicionar uma ideia.',
      });
      return;
    }

    setIsAdding(true);
    try {
      const docRef = await addDoc(collection(firestore, 'ideas'), {
        ...ideaData,
        authorId: user.uid,
        authorName: user.displayName || 'Anônimo',
        course: 'Arquitetura e Urbanismo', // Placeholder, should come from profile
        status: 'nova',
        supportCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      toast({
        title: 'Ideia Adicionada!',
        description: 'Sua ideia foi enviada com sucesso.',
      });
    } catch (e) {
      console.error('Error adding idea: ', e);
      toast({
        variant: 'destructive',
        title: 'Erro ao adicionar ideia',
        description: 'Não foi possível enviar sua ideia. Tente novamente.',
      });
    } finally {
      setIsAdding(false);
    }
  };

  return { ideas, isLoading, error, addIdea, isAdding };
}
