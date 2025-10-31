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

function getCurrentSemester() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11

  // January to June is semester 1, July to December is semester 2
  const semester = month < 6 ? 1 : 2;

  return `${year}.${semester}`;
}

export function ClassroomsList({ filter }: ClassroomsListProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchClassrooms() {
      if (!user || !firestore) return;

      setIsLoading(true);
      
      try {
        // 1. Fetch all courses for the professor to create a map of courseId -> courseInfo
        const coursesRef = collection(firestore, `professors/${user.uid}/courses`);
        const coursesSnapshot = await getDocs(coursesRef);
        const coursesMap = new Map<string, { name: string; code: string }>();
        coursesSnapshot.forEach(doc => {
            coursesMap.set(doc.id, { name: doc.data().name, code: doc.data().code });
        });

        // 2. Query the classrooms collection group for the specific professor
        const classroomsQuery = query(
            collectionGroup(firestore, 'classrooms'),
            where('professorId', '==', user.uid)
        );
        const classroomsSnapshot = await getDocs(classroomsQuery);
        
        const allClassrooms: Classroom[] = [];
        classroomsSnapshot.forEach(doc => {
            const data = doc.data();
            const courseInfo = coursesMap.get(data.courseId);
            allClassrooms.push({
                id: doc.id,
                name: data.name,
                semester: data.semester,
                courseId: data.courseId,
                courseName: courseInfo?.name || 'Disciplina Desconhecida',
                courseCode: courseInfo?.code || 'N/A'
            });
        });

        // 3. Filter classrooms based on the current semester
        const currentSemester = getCurrentSemester();
        const filteredClassrooms = allClassrooms.filter(c => {
          if (filter === 'active') {
            return c.semester === currentSemester;
          } else {
            return c.semester !== currentSemester;
          }
        });

        setClassrooms(filteredClassrooms);

      } catch (error) {
        console.error("Error fetching classrooms:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchClassrooms();
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
