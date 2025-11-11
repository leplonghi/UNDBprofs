'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Download, Star, ExternalLink, FileText } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Document as Material } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MaterialsTableProps {
  materials: Material[];
}

export function MaterialsTable({ materials }: MaterialsTableProps) {
  if (materials.length === 0) {
    return (
      <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
        <p>Nenhum material compartilhado ainda.</p>
        <p className="text-sm">Seja o primeiro a compartilhar algo com a comunidade!</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Material</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Disciplina/Área</TableHead>
            <TableHead>Autor</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="w-[50px]"><span className="sr-only">Ações</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {materials.map((material) => (
            <TableRow key={material.id}>
              <TableCell className="font-medium max-w-xs truncate">
                 <a href={material.fileUrl} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-2">
                    {material.uploadType === 'link' ? <ExternalLink className="h-4 w-4 flex-shrink-0" /> : <FileText className="h-4 w-4 flex-shrink-0" />}
                    {material.name}
                 </a>
              </TableCell>
              <TableCell><Badge variant="secondary" className="capitalize">{material.documentType}</Badge></TableCell>
              <TableCell>{material.discipline}</TableCell>
              <TableCell>{material.authorName}</TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {formatDistanceToNow(new Date(material.createdAt), { addSuffix: true, locale: ptBR })}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                       <a href={material.fileUrl} target="_blank" rel="noopener noreferrer">
                         <Download className="mr-2 h-4 w-4" /> Abrir/Baixar
                       </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Star className="mr-2 h-4 w-4" /> Salvar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
