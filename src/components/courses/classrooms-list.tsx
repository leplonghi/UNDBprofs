'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, getDocs, query, collectionGroup, where } from 'firebase/firestore';
import { useUser, useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

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
    return 0;
  }
  const [year, semester] = semesterString.split('.').map(Number);
  return year * 10 + semester;
}

function getCurrentSemesterValue(): number {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-11
  // Semestre 1: Jan-Jul (0-6), Semestre 2: Ago-Dez (7-11)
  const semester = month <= 6 ? 1 : 2;
  return year * 10 + semester;
}


export function ClassroomsList({ filter }: ClassroomsListProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchClassroomsAndCourses() {
      if (!user || !firestore) return;

      setIsLoading(true);
      
      try {
        // 1. Fetch all courses for the professor to create a map
        const coursesRef = collection(firestore, `professors/${user.uid}/courses`);
        const coursesSnapshot = await getDocs(coursesRef);
        const coursesMap = new Map<string, { name: string; code: string }>();
        coursesSnapshot.forEach(doc => {
            const data = doc.data();
            coursesMap.set(doc.id, { name: data.name || 'Disciplina Desconhecida', code: data.code || 'N/A' });
        });

        // 2. Fetch all classrooms belonging to the user using a collectionGroup query
        const classroomsQuery = query(collectionGroup(firestore, 'classrooms'), where('professorId', '==', user.uid));
        const classroomsSnapshot = await getDocs(classroomsQuery);
        
        const allClassrooms: Classroom[] = [];
        classroomsSnapshot.forEach(doc => {
            const classroomData = doc.data();
            const courseInfo = coursesMap.get(classroomData.courseId);

            if (courseInfo) {
                 allClassrooms.push({
                    id: doc.id,
                    name: classroomData.name,
                    semester: classroomData.semester,
                    courseId: classroomData.courseId,
                    courseName: courseInfo.name,
                    courseCode: courseInfo.code,
                });
            }
        });
        
        // 3. Filter based on the 'active' or 'past' criteria
        const currentSemesterValue = getCurrentSemesterValue();
        const filteredClassrooms = allClassrooms.filter(c => {
          const classroomSemesterValue = getSemesterValue(c.semester);
          if (classroomSemesterValue === 0) return false; 

           if (filter === 'active') {
            return classroomSemesterValue >= currentSemesterValue;
          } else { 
            return classroomSemesterValue < currentSemesterValue;
          }
        });

        setClassrooms(filteredClassrooms);

      } catch (error) {
        console.error("Error fetching classrooms:", error);
        // Optionally, set an error state to show in the UI
      } finally {
        setIsLoading(false);
      }
    }

    fetchClassroomsAndCourses();
  }, [user, firestore, filter]);

  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
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
