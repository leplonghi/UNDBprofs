'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, ThumbsUp } from 'lucide-react';
import type { Idea } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface IdeaCardProps {
  idea: Idea;
}

const statusMap: Record<Idea['status'], { label: string; className: string }> = {
  nova: { label: 'Nova', className: 'bg-blue-100 text-blue-800' },
  em_analise: { label: 'Em Análise', className: 'bg-yellow-100 text-yellow-800' },
  implementada: { label: 'Implementada', className: 'bg-green-100 text-green-800' },
};

export function IdeaCard({ idea }: IdeaCardProps) {
  const timeAgo = formatDistanceToNow(new Date(idea.createdAt), {
    addSuffix: true,
    locale: ptBR,
  });
  const statusInfo = statusMap[idea.status];

  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{idea.title}</CardTitle>
            <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
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
        <Badge variant="outline">{idea.category}</Badge>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <ThumbsUp className="h-4 w-4" />
            <span>{idea.supportCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span>0</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
