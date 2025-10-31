'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { placeholderCourses } from '@/lib/placeholder-data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function CoursesTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Disciplina</TableHead>
          <TableHead>Código</TableHead>
          <TableHead>Turma</TableHead>
          <TableHead className="text-right">Alunos</TableHead>
          <TableHead>
            <span className="sr-only">Ações</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {placeholderCourses.map((course) => (
          <TableRow key={course.id}>
            <TableCell className="font-medium">{course.name}</TableCell>
            <TableCell>
              <Badge variant="outline">{course.code}</Badge>
            </TableCell>
            <TableCell>{course.classroom}</TableCell>
            <TableCell className="text-right">{course.students}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button aria-haspopup="true" size="icon" variant="ghost">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                  <DropdownMenuItem>Editar</DropdownMenuItem>
                  <DropdownMenuItem>Arquivar</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">Excluir</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
