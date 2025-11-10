'use client';
import React, { useState } from 'react';
import { useUser } from '@/firebase';
import type { IdeaComment } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, Send } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface CommentSectionProps {
  ideaId: string;
  comments: IdeaComment[];
  isLoading: boolean;
  onAddComment: (ideaId: string, text: string) => Promise<void>;
}

export function CommentSection({ ideaId, comments, isLoading, onAddComment }: CommentSectionProps) {
  const { user } = useUser();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;
    setIsSubmitting(true);
    await onAddComment(ideaId, newComment);
    setNewComment('');
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                </div>
            ))
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-9 w-9">
                {/* Add AvatarImage when user profile photo is available */}
                <AvatarFallback>{comment.userName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{comment.userName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      locale: ptBR,
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <p className="text-sm text-foreground/90">{comment.text}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-center text-muted-foreground py-4">
            Nenhum comentário ainda. Seja o primeiro a opinar!
          </p>
        )}
      </div>

      {user && (
        <div className="flex flex-col gap-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Adicionar um comentário..."
            rows={3}
            disabled={isSubmitting}
          />
          <Button onClick={handleAddComment} disabled={!newComment.trim() || isSubmitting} className="self-end">
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Comentar
          </Button>
        </div>
      )}
    </div>
  );
}
