'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, ThumbsUp } from 'lucide-react';
import type { Idea } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface IdeaCardProps {
  idea: Idea;
  onSelect: () => void;
}

const statusMap: Record<Idea['status'], { label: string; className: string }> = {
  nova: { label: 'Nova', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-300' },
  em_analise: { label: 'Em Análise', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-300' },
  implementada: { label: 'Implementada', className: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-300' },
};

export function IdeaCard({ idea, onSelect }: IdeaCardProps) {
  const timeAgo = formatDistanceToNow(new Date(idea.createdAt), {
    addSuffix: true,
    locale: ptBR,
  });
  const statusInfo = statusMap[idea.status];

  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow cursor-pointer" onClick={onSelect}>
      <CardHeader>
        <div className="flex justify-between items-start">
            <CardTitle className="text-lg pr-2">{idea.title}</CardTitle>
            <Badge variant="outline" className={statusInfo.className}>{statusInfo.label}</Badge>
        </div>
        <div className="text-xs text-muted-foreground pt-1">
            <span>Por {idea.authorName}</span>
            <span className="mx-1">•</span>
            <span>{timeAgo}</span>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {idea.description}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between items-center text-sm text-muted-foreground border-t pt-4">
        <Badge variant="secondary">{idea.category}</Badge>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <ThumbsUp className="h-4 w-4" />
            <span>{idea.supportCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span>{idea.commentCount || 0}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
