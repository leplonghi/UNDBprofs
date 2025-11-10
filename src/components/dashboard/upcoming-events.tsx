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
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import type { AcademicEvent, Course } from '@/types';
import { Skeleton } from '../ui/skeleton';
import { format, isFuture } from 'date-fns';
import { useMemo } from 'react';

interface UpcomingEventsProps {
    events: AcademicEvent[] | null;
    courses: Course[] | null;
    isLoading: boolean;
}

export function UpcomingEvents({ events, courses, isLoading }: UpcomingEventsProps) {
  
  const coursesById = useMemo(() => {
    if (!courses) return {};
    return courses.reduce((acc, course) => {
        acc[course.id] = course;
        return acc;
    }, {} as Record<string, Course>);
  }, [courses]);

  const upcomingEvents = useMemo(() => {
    if (!events) return [];
    return events
        .filter(event => isFuture(new Date(event.dateTime)))
        .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
        .slice(0, 5);
  }, [events]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Próximos Eventos</CardTitle>
        <CardDescription>
          Seus próximos eventos e atividades acadêmicas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>Evento</TableCell>
              <TableCell className="text-right">Data</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                Array.from({length: 3}).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={2}>
                            <Skeleton className="h-8 w-full" />
                        </TableCell>
                    </TableRow>
                ))
            ) : upcomingEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="h-24 text-center">
                  Nenhum evento futuro encontrado.
                </TableCell>
              </TableRow>
            ) : (
              upcomingEvents.map((event) => {
                const course = coursesById[event.courseId];
                return (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div className="font-medium">{event.name}</div>
                      {course && (
                        <div className="text-sm text-muted-foreground">
                            <Badge variant="outline">{course.code}</Badge>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                        {format(new Date(event.dateTime), 'dd/MM/yyyy')}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
