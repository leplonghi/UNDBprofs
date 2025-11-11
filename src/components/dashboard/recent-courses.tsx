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
import type { Course, Classroom } from '@/types';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';


interface RecentCoursesProps {
    courses: Course[];
    classroomsByCourse: Record<string, Classroom[]>;
    isLoading: boolean;
}

const isSemesterActive = (semester: string): boolean => {
    if (!semester || !semester.includes('.')) return false;

    const [year, sem] = semester.split('.').map(Number);
    if (isNaN(year) || isNaN(sem)) return false;

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // 1-12

    if (year !== currentYear) return false;

    if (sem === 1) { // 1st semester (e.g., Feb-Jul)
        return currentMonth >= 2 && currentMonth <= 7;
    } else if (sem === 2) { // 2nd semester (e.g., Aug-Dec)
        return currentMonth >= 8 && currentMonth <= 12;
    }

    return false;
}


export function RecentCourses({ courses, classroomsByCourse, isLoading }: RecentCoursesProps) {
  const recentCourses = useMemo(() => {
    return (courses || [])
      .map(course => {
        const classroom = classroomsByCourse[course.id]?.[0];
        const isActive = classroom ? isSemesterActive(classroom.semester) : false;
        return { ...course, classroom, isActive };
      })
      .sort((a, b) => {
        // Active courses first
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        // Then sort by semester, descending
        const semesterA = a.classroom?.semester || '0';
        const semesterB = b.classroom?.semester || '0';
        return semesterB.localeCompare(semesterA);
      })
      .slice(0, 5);
  }, [courses, classroomsByCourse]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Disciplinas Recentes</CardTitle>
        <CardDescription>
          As disciplinas que você adicionou recentemente. As ativas aparecem com mais destaque.
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
                  <TableRow key={course.id} className={cn(!course.isActive && "text-muted-foreground")}>
                    <TableCell>
                      <Link href={`/disciplinas/${course.id}`} className="font-medium hover:underline">
                          {course.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={course.isActive ? "secondary" : "outline"}>{course.code}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        {course.classroom?.semester ?? <span className="text-muted-foreground">N/A</span>}
                    </TableCell>
                  </TableRow>
                )
              )
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
