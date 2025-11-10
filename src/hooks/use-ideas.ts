'use client';

import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import {
  collection,
  query,
  orderBy,
  addDoc,
  doc,
  runTransaction,
  getDoc,
  Timestamp,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import type { Idea, IdeaComment, IdeaSupport } from '@/types';
import { useToast } from './use-toast';
import { useState, useEffect, useCallback } from 'react';

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
      await addDoc(collection(firestore, 'ideas'), {
        ...ideaData,
        authorId: user.uid,
        authorName: user.displayName || 'Anônimo',
        course: 'Arquitetura e Urbanismo', // Placeholder, should come from profile
        status: 'nova',
        supportCount: 0,
        commentCount: 0,
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

  const toggleSupport = async (ideaId: string) => {
    if (!firestore || !user?.uid) return;

    const ideaRef = doc(firestore, 'ideas', ideaId);
    const supportRef = doc(firestore, `ideas/${ideaId}/supports`, user.uid);

    try {
      await runTransaction(firestore, async (transaction) => {
        const supportDoc = await transaction.get(supportRef);
        const ideaDoc = await transaction.get(ideaRef);
        if (!ideaDoc.exists()) {
          throw new Error("A ideia não existe mais.");
        }

        const currentSupportCount = ideaDoc.data().supportCount || 0;

        if (supportDoc.exists()) {
          // User has supported, so remove support
          transaction.delete(supportRef);
          transaction.update(ideaRef, { supportCount: currentSupportCount - 1 });
        } else {
          // User has not supported, so add support
          transaction.set(supportRef, { supportedAt: new Date().toISOString() });
          transaction.update(ideaRef, { supportCount: currentSupportCount + 1 });
        }
      });
    } catch (e) {
      console.error("Error toggling support: ", e);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar apoio",
      });
    }
  };
  
    const addComment = async (ideaId: string, text: string) => {
    if (!firestore || !user?.uid) return;
    
    const ideaRef = doc(firestore, 'ideas', ideaId);
    const commentsColRef = collection(firestore, `ideas/${ideaId}/comments`);

    try {
        await runTransaction(firestore, async (transaction) => {
            const ideaDoc = await transaction.get(ideaRef);
            if (!ideaDoc.exists()) throw new Error("Ideia não encontrada.");
            
            const newCommentRef = doc(commentsColRef);
            transaction.set(newCommentRef, {
                userId: user.uid,
                userName: user.displayName || 'Anônimo',
                text: text,
                createdAt: new Date().toISOString(),
            });

            const currentCommentCount = ideaDoc.data().commentCount || 0;
            transaction.update(ideaRef, { commentCount: currentCommentCount + 1 });
        });
    } catch (e) {
      console.error("Error adding comment: ", e);
      toast({ variant: "destructive", title: "Erro ao adicionar comentário" });
    }
  };

  return { ideas, isLoading, error, addIdea, isAdding, toggleSupport, addComment };
}


export function useIdeaDetails(ideaId: string | null) {
  const { user } = useUser();
  const firestore = useFirestore();

  const [comments, setComments] = useState<IdeaComment[]>([]);
  const [supports, setSupports] = useState<IdeaSupport[]>([]);
  const [isCommentsLoading, setIsCommentsLoading] = useState(true);
  const [isSupportsLoading, setIsSupportsLoading] = useState(true);
  const [hasUserSupported, setHasUserSupported] = useState(false);

  useEffect(() => {
    if (!firestore || !ideaId) {
        setComments([]);
        setIsCommentsLoading(false);
        return;
    };
    setIsCommentsLoading(true);
    const commentsQuery = query(collection(firestore, `ideas/${ideaId}/comments`), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
        const newComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IdeaComment));
        setComments(newComments);
        setIsCommentsLoading(false);
    });
    return () => unsubscribe();
  }, [firestore, ideaId]);

  useEffect(() => {
    if (!firestore || !ideaId) {
        setSupports([]);
        setIsSupportsLoading(false);
        return;
    }
    setIsSupportsLoading(true);
    const supportsQuery = collection(firestore, `ideas/${ideaId}/supports`);
    const unsubscribe = onSnapshot(supportsQuery, (snapshot) => {
      const newSupports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IdeaSupport));
      setSupports(newSupports);
      setHasUserSupported(!!(user && snapshot.docs.some(doc => doc.id === user.uid)));
      setIsSupportsLoading(false);
    });
    return () => unsubscribe();
  }, [firestore, ideaId, user]);

  return { comments, supports, isCommentsLoading, isSupportsLoading, hasUserSupported };
}
