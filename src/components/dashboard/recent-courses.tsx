'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import type { Course } from '@/types';
import { Skeleton } from '../ui/skeleton';

interface RecentCoursesProps {
    courses: Course[];
    isLoading: boolean;
}

export function RecentCourses({ courses, isLoading }: RecentCoursesProps) {
  // Sort courses by a potential 'lastAccessed' or 'createdAt' field if available.
  // For now, we'll just take the first 5.
  const recentCourses = courses.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Disciplinas Recentes</CardTitle>
        <CardDescription>
          As disciplinas que você adicionou recentemente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Disciplina</TableHead>
              <TableHead>Código</TableHead>
              <TableHead className="text-right">Semestre</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                Array.from({length: 3}).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={3}>
                            <Skeleton className="h-8 w-full" />
                        </TableCell>
                    </TableRow>
                ))
            ) : recentCourses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  Nenhuma disciplina recente.
                </TableCell>
              </TableRow>
            ) : (
              recentCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>
                    <Link href={`/disciplinas/${course.id}`} className="font-medium hover:underline">
                        {course.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{course.code}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{course.semester}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
