'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, getDocs } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import type { Course, Classroom } from '@/types';

function getSemesterValue(semesterString: string): number {
  if (!semesterString || !/^\d{4}\.[12]$/.test(semesterString)) {
    return 0;
  }
  const [year, semester] = semesterString.split('.').map(Number);
  return year * 10 + semester;
}

export function ClassroomsList() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [allClassrooms, setAllClassrooms] = useState<(Classroom & { courseName?: string, courseCode?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const coursesRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `professors/${user.uid}/courses`);
  }, [user, firestore]);

  const { data: courses, isLoading: coursesLoading, error: coursesError } = useCollection<Course>(coursesRef);

  useEffect(() => {
    if (coursesError) {
      setError(coursesError);
      setIsLoading(false);
      return;
    }

    if (coursesLoading || !courses || !firestore || !user) {
      return;
    }

    const fetchAllClassrooms = async () => {
      setIsLoading(true);
      try {
        const classroomPromises = courses.map(course => {
          const classroomsRef = collection(firestore, `professors/${user.uid}/courses/${course.id}/classrooms`);
          return getDocs(classroomsRef).then(snapshot => 
            snapshot.docs.map(doc => ({
              ...(doc.data() as Classroom),
              id: doc.id,
              courseName: course.name,
              courseCode: course.code,
              courseId: course.id,
            }))
          );
        });

        const classroomsByCourse = await Promise.all(classroomPromises);
        const flattenedClassrooms = classroomsByCourse.flat();

        flattenedClassrooms.sort((a, b) => getSemesterValue(b.semester) - getSemesterValue(a.semester));

        setAllClassrooms(flattenedClassrooms);
      } catch (e) {
        console.error("Error fetching classrooms: ", e);
        setError(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllClassrooms();

  }, [courses, coursesLoading, coursesError, firestore, user]);

  if (isLoading || coursesLoading) {
    return (
      <div className="p-4 space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return (
         <p className="p-4 text-center text-destructive">
            Ocorreu um erro ao buscar as turmas. Verifique as permissões ou tente novamente.
        </p>
    );
  }

  if (allClassrooms.length === 0) {
    return (
      <p className="p-4 text-center text-muted-foreground">
        Nenhuma turma encontrada.
      </p>
    );
  }

  return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Turma</TableHead>
            <TableHead>Disciplina</TableHead>
            <TableHead>Ano</TableHead>
            <TableHead>Semestre</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allClassrooms.map(c => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell>
                  <div className='flex flex-col'>
                      <Link href={`/disciplinas/${c.courseId}`} className="hover:underline font-medium">
                        <span>{c.courseName}</span>
                      </Link>
                      <Badge variant="outline" className='w-fit'>{c.courseCode}</Badge>
                  </div>
              </TableCell>
              <TableCell>{c.semester?.split('.')[0]}</TableCell>
              <TableCell>{c.semester?.split('.')[1]}</TableCell>
              <TableCell className="text-right">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/disciplinas/${c.courseId}/turmas/${c.id}`}>
                    Gerenciar
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
  );
}
