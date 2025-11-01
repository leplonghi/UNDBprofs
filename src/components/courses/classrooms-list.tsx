'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, getDocs, query } from 'firebase/firestore';
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

/**
 * Converte uma string de semestre (ex: "2025.2") em um valor numérico para comparação.
 * Ano tem peso maior que o semestre. Ex: 2025.2 (20252) > 2025.1 (20251) > 2024.2 (20242).
 * Retorna 0 se o formato for inválido.
 */
function getSemesterValue(semesterString: string): number {
  if (!semesterString || !/^\d{4}\.[12]$/.test(semesterString)) {
    return 0; // Formato inválido é tratado como muito antigo.
  }
  const [year, semester] = semesterString.split('.').map(Number);
  return year * 10 + semester;
}

/**
 * Calcula o valor numérico do semestre atual com base na data do sistema.
 * Semestre 1: Janeiro a Julho (meses 0-6).
 * Semestre 2: Agosto a Dezembro (meses 7-11).
 */
function getCurrentSemesterValue(): number {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-indexed (0 for January, 11 for December)
    const semester = month <= 6 ? 1 : 2; 
    return year * 10 + semester;
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
        const coursesRef = collection(firestore, `professors/${user.uid}/courses`);
        const coursesSnapshot = await getDocs(coursesRef);
        
        const allClassrooms: Classroom[] = [];
        
        for (const courseDoc of coursesSnapshot.docs) {
          const courseData = courseDoc.data();
          const classroomsRef = collection(firestore, `professors/${user.uid}/courses/${courseDoc.id}/classrooms`);
          const classroomsSnapshot = await getDocs(classroomsRef);

          classroomsSnapshot.forEach(classroomDoc => {
            const classroomData = classroomDoc.data();
            allClassrooms.push({
              id: classroomDoc.id,
              name: classroomData.name,
              semester: classroomData.semester,
              courseId: courseDoc.id,
              courseName: courseData.name || 'Disciplina Desconhecida',
              courseCode: courseData.code || 'N/A'
            });
          });
        }
        
        const currentSemesterValue = getCurrentSemesterValue();
        const filteredClassrooms = allClassrooms.filter(c => {
          const classroomSemesterValue = getSemesterValue(c.semester);
          if (classroomSemesterValue === 0) return false; // Ignora turmas com semestre inválido

           if (filter === 'active') {
            // "Ativas" são as turmas do semestre atual ou de semestres futuros.
            return classroomSemesterValue >= currentSemesterValue;
          } else { // filter === 'past'
            // "Anteriores" são apenas as turmas de semestres que já passaram.
            return classroomSemesterValue < currentSemesterValue;
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
