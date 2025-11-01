'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, getDocs, DocumentData } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import type { Course } from '@/types';


interface Classroom {
  id: string;
  name: string;
  semester: string;
  courseId: string;
  courseName?: string;
  courseCode?: string;
}

interface ClassroomsListProps {
  filter: 'active' | 'past';
}

function getSemesterValue(semesterString: string): number {
  if (!semesterString || !/^\d{4}\.[12]$/.test(semesterString)) {
    return 0; // Return a value that indicates an invalid format
  }
  const [year, semester] = semesterString.split('.').map(Number);
  return year * 10 + semester;
}

function getCurrentSemesterValue(): number {
  // Simulating being in October 2025 as requested
  const year = 2025;
  const month = 9; // October (0-indexed)
  const semester = month >= 0 && month <= 6 ? 1 : 2; // Jan-Jul is sem 1, Aug-Dec is sem 2
  return year * 10 + semester;
}


export function ClassroomsList({ filter }: ClassroomsListProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const coursesRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `professors/${user.uid}/courses`);
  }, [user, firestore]);

  const { data: courses, isLoading: coursesLoading, error: coursesError } = useCollection<Course>(coursesRef);


  useEffect(() => {
    async function fetchAllClassrooms() {
      if (!user || !firestore || !courses) {
        if (!coursesLoading) setIsLoading(false);
        return;
      };

      setIsLoading(true);
      
      try {
        const classroomPromises = courses.map(async (course) => {
            const classroomsRef = collection(firestore, `professors/${user.uid}/courses/${course.id}/classrooms`);
            const classroomsSnapshot = await getDocs(classroomsRef);
            
            return classroomsSnapshot.docs.map(classroomDoc => {
                const classroomData = classroomDoc.data();
                return {
                    id: classroomDoc.id,
                    name: classroomData.name,
                    semester: classroomData.semester,
                    courseId: course.id,
                    courseName: course.name,
                    courseCode: course.code,
                };
            });
        });

        const allClassroomsArrays = await Promise.all(classroomPromises);
        const allClassrooms = allClassroomsArrays.flat();
        
        const currentSemesterValue = getCurrentSemesterValue();
        const filtered = allClassrooms.filter(c => {
            const classroomSemesterValue = getSemesterValue(c.semester);
            if (classroomSemesterValue === 0) return false;
            
            if (filter === 'active') {
                return classroomSemesterValue >= currentSemesterValue;
            } else { // filter === 'past'
                return classroomSemesterValue < currentSemesterValue;
            }
        });

        setClassrooms(filtered);
      } catch(e) {
          console.error("Error fetching classrooms for courses: ", e)
      } finally {
          setIsLoading(false);
      }
    }

    if (!coursesLoading) {
      fetchAllClassrooms();
    }
    
  }, [user, firestore, courses, coursesLoading, filter]);

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

  if (classrooms.length === 0) {
    return (
      <p className="p-4 text-center text-muted-foreground">
        Nenhuma turma encontrada para este filtro.
      </p>
    );
  }

  return (
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
        {classrooms.map(c => (
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
  );
}
