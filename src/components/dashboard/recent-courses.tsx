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

type CourseStatus = 'Ativa' | 'Lecionada' | 'Agendada';

export function RecentCourses({ courses, classroomsByCourse, isLoading }: RecentCoursesProps) {
  
  const recentCourses = useMemo(() => {
    if (!courses) return [];

    const getCourseStatus = (classroom?: Classroom): CourseStatus => {
        if (!classroom || !classroom.year || !classroom.semester) return 'Agendada';
        
        const year = parseInt(classroom.year, 10);
        const sem = parseInt(classroom.semester, 10);

        if (isNaN(year) || isNaN(sem)) return 'Agendada';

        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1; // 1-12
        const currentSemester = currentMonth >= 2 && currentMonth <= 7 ? 1 : 2;

        if (year < currentYear) return 'Lecionada';
        if (year > currentYear) return 'Agendada';
        // If same year, check semester
        if (sem < currentSemester) return 'Lecionada';
        if (sem > currentSemester) return 'Agendada';
        
        return 'Ativa';
    }

    return courses
      .map(course => {
        const classroom = classroomsByCourse[course.id]?.[0];
        const status = getCourseStatus(classroom);
        
        return {
          ...course,
          classroom,
          status,
        };
      })
      .sort((a, b) => {
        // Sort by status: Ativa > Agendada > Lecionada
        if (a.status === 'Ativa' && b.status !== 'Ativa') return -1;
        if (a.status !== 'Ativa' && b.status === 'Ativa') return 1;
        if (a.status === 'Agendada' && b.status === 'Lecionada') return -1;
        if (a.status === 'Lecionada' && b.status === 'Agendada') return 1;
        
        // Fallback sort by year/semester
        return (b.classroom?.semester || '0').localeCompare(a.classroom?.semester || '0');
      })
      .slice(0, 5);
  }, [courses, classroomsByCourse]);

  const statusStyles: Record<CourseStatus, string> = {
    Ativa: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-300',
    Lecionada: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/50 dark:text-gray-400',
    Agendada: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300',
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Disciplinas Recentes</CardTitle>
        <CardDescription>
          As disciplinas mais recentes, destacando as ativas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Disciplina</TableHead>
              <TableHead>Ano</TableHead>
              <TableHead>Semestre</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                Array.from({length: 3}).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={4}>
                            <Skeleton className="h-8 w-full" />
                        </TableCell>
                    </TableRow>
                ))
            ) : recentCourses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Nenhuma disciplina recente.
                </TableCell>
              </TableRow>
            ) : (
              recentCourses.map((course) => {
                    const year = course.classroom?.year;
                    const semesterNumber = course.classroom?.semester;
                    return (
                        <TableRow
                          key={course.id}
                          className={cn(course.status !== 'Ativa' && 'text-muted-foreground')}
                        >
                          <TableCell>
                            <Link
                              href={`/disciplinas/${course.id}`}
                              className="font-medium hover:underline"
                            >
                              {course.name}
                            </Link>
                          </TableCell>
                          <TableCell>
                            {year ? (
                              <Badge variant={course.status === 'Ativa' ? 'secondary' : 'outline'}>
                                {year}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {semesterNumber ? `${semesterNumber}º` : 'N/A'}
                           </TableCell>
                          <TableCell className="text-right">
                             <Badge variant="outline" className={cn(statusStyles[course.status])}>
                                {course.status}
                             </Badge>
                          </TableCell>
                        </TableRow>
                    );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
