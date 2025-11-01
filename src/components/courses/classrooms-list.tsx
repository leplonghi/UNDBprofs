'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import type { Course, Classroom } from '@/types';

interface ClassroomsListProps {
  filter: 'active' | 'past';
}

function getSemesterValue(semesterString: string): number {
  if (!semesterString || !/^\d{4}\.[12]$/.test(semesterString)) {
    return 0;
  }
  const [year, semester] = semesterString.split('.').map(Number);
  return year * 10 + semester;
}

function getCurrentSemesterValue(): number {
  const year = 2025;
  const month = 9; 
  const semester = month >= 0 && month <= 6 ? 1 : 2;
  return year * 10 + semester;
}

// Componente auxiliar para carregar turmas de uma única disciplina
function CourseClassroomsLoader({ course, onClassroomsLoaded }: { course: Course, onClassroomsLoaded: (courseId: string, classrooms: Classroom[]) => void }) {
    const { user } = useUser();
    const firestore = useFirestore();

    const classroomsRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, `professors/${user.uid}/courses/${course.id}/classrooms`);
    }, [user, firestore, course.id]);

    const { data: classrooms, isLoading, error } = useCollection<Classroom>(classroomsRef);

    useEffect(() => {
        if (classrooms) {
            const classroomsWithCourseInfo = classrooms.map(c => ({
                ...c,
                courseName: course.name,
                courseCode: course.code,
            }));
            onClassroomsLoaded(course.id, classroomsWithCourseInfo);
        } else if (!isLoading) {
            // Se não estiver carregando e não houver turmas (ou erro), notifique o pai com uma lista vazia
            onClassroomsLoaded(course.id, []);
        }
    }, [classrooms, isLoading, course.id, course.name, course.code, onClassroomsLoaded]);

    // Este componente não renderiza nada diretamente, apenas carrega dados.
    return null;
}


export function ClassroomsList({ filter }: ClassroomsListProps) {
  const { user } = useUser();
  const firestore = useFirestore();

  // Mapa para armazenar turmas por courseId
  const [classroomsByCourse, setClassroomsByCourse] = useState<Map<string, Classroom[]>>(new Map());
  
  const coursesRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `professors/${user.uid}/courses`);
  }, [user, firestore]);

  const { data: courses, isLoading: coursesLoading, error: coursesError } = useCollection<Course>(coursesRef);

  const handleClassroomsLoaded = React.useCallback((courseId: string, loadedClassrooms: Classroom[]) => {
      setClassroomsByCourse(prevMap => {
          const newMap = new Map(prevMap);
          newMap.set(courseId, loadedClassrooms);
          return newMap;
      });
  }, []);

  const allClassrooms = React.useMemo(() => {
    return Array.from(classroomsByCourse.values()).flat();
  }, [classroomsByCourse]);

  const filteredClassrooms = React.useMemo(() => {
    const currentSemesterValue = getCurrentSemesterValue();
    return allClassrooms.filter(c => {
      const classroomSemesterValue = getSemesterValue(c.semester);
      if (classroomSemesterValue === 0) return false;
      
      if (filter === 'active') {
        return classroomSemesterValue >= currentSemesterValue;
      } else { // filter === 'past'
        return classroomSemesterValue < currentSemesterValue;
      }
    });
  }, [allClassrooms, filter]);

  // Determina se o carregamento geral está completo
  const isLoading = coursesLoading || (courses && courses.length > 0 && classroomsByCourse.size < courses.length);
  
  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (coursesError) {
    return (
         <p className="p-4 text-center text-destructive">
            Ocorreu um erro de permissão ao buscar as turmas. Verifique as regras de segurança do Firestore.
        </p>
    )
  }

  if (filteredClassrooms.length === 0) {
    return (
      <>
        {courses?.map(course => (
            <CourseClassroomsLoader key={course.id} course={course} onClassroomsLoaded={handleClassroomsLoaded} />
        ))}
        <p className="p-4 text-center text-muted-foreground">
            Nenhuma turma encontrada para este filtro.
        </p>
      </>
    );
  }

  return (
    <>
      {courses?.map(course => (
        <CourseClassroomsLoader key={course.id} course={course} onClassroomsLoaded={handleClassroomsLoaded} />
      ))}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Turma</TableHead>
            <TableHead>Disciplina</TableHead>
            <TableHead>Semestre</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredClassrooms.map(c => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell>
                  <div className='flex flex-col'>
                      <span>{c.courseName}</span>
                      <Badge variant="outline" className='w-fit'>{c.courseCode}</Badge>
                  </div>
              </TableCell>
              <TableCell>{c.semester}</TableCell>
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
    </>
  );
}
