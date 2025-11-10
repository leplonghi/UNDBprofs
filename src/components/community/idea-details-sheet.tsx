'use client';
import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Separator
} from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Idea } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ThumbsUp, Loader2, MessageSquare, X } from 'lucide-react';
import { useIdeas, useIdeaDetails } from '@/hooks/use-ideas';
import { CommentSection } from './comment-section';

interface IdeaDetailsSheetProps {
  idea: Idea | null;
  onOpenChange: (isOpen: boolean) => void;
}

const statusMap: Record<Idea['status'], { label: string; className: string }> = {
  nova: { label: 'Nova', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-300' },
  em_analise: { label: 'Em Análise', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-300' },
  implementada: { label: 'Implementada', className: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-300' },
};

export function IdeaDetailsSheet({ idea, onOpenChange }: IdeaDetailsSheetProps) {
  const { toggleSupport, addComment } = useIdeas();
  const { comments, supports, isCommentsLoading, isSupportsLoading, hasUserSupported } = useIdeaDetails(idea?.id ?? null);
  const [isTogglingSupport, setIsTogglingSupport] = React.useState(false);
  
  if (!idea) {
    return null;
  }
  
  const statusInfo = statusMap[idea.status];
  const formattedDate = format(new Date(idea.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  const handleSupportToggle = async () => {
      setIsTogglingSupport(true);
      await toggleSupport(idea.id);
      setIsTogglingSupport(false);
  }

  return (
    <Sheet open={!!idea} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-full flex flex-col">
        <SheetHeader className="pr-10">
          <SheetTitle className="text-2xl">{idea.title}</SheetTitle>
          <SheetDescription>
            Proposta por <span className="font-semibold">{idea.authorName}</span> em {formattedDate}
          </SheetDescription>
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="outline" className={statusInfo.className}>{statusInfo.label}</Badge>
            <Badge variant="secondary">{idea.category}</Badge>
            <Badge variant="secondary">{idea.course}</Badge>
          </div>
        </SheetHeader>
        
        <div className="py-6 flex-grow overflow-y-auto pr-6 space-y-6">
            <p className="text-base whitespace-pre-wrap">{idea.description}</p>
            <Separator />
            <div>
                <h3 className="font-semibold text-lg mb-4">Comentários ({comments.length})</h3>
                <CommentSection ideaId={idea.id} comments={comments} isLoading={isCommentsLoading} onAddComment={addComment} />
            </div>
        </div>

        <SheetFooter className="border-t pt-4">
            <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <ThumbsUp className="h-5 w-5"/>
                    <span className="font-bold text-lg text-foreground">{supports.length}</span>
                    <span>apoios</span>
                </div>
                 <Button onClick={handleSupportToggle} disabled={isTogglingSupport} variant={hasUserSupported ? 'default' : 'outline'} size="lg">
                    {isTogglingSupport ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : hasUserSupported ? (
                        <X className="mr-2 h-4 w-4" />
                    ) : (
                        <ThumbsUp className="mr-2 h-4 w-4" />
                    )}
                    {hasUserSupported ? 'Remover Apoio' : 'Apoiar Ideia'}
                </Button>
            </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
