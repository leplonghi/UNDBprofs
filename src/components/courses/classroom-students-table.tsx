'use client';

import React from 'react';
import {
  useCollection,
  useDoc,
  useFirestore,
  useUser,
  useMemoFirebase,
} from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { ClassroomStudent, Student } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

function StudentRow({ studentId }: { studentId: string }) {
  const firestore = useFirestore();
  const studentDocRef = useMemoFirebase(() => {
    if (!firestore || !studentId) return null;
    return doc(firestore, `students/${studentId}`);
  }, [firestore, studentId]);

  const { data: student, isLoading } = useDoc<Student>(studentDocRef);

  if (isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={2}>
          <Skeleton className="h-8 w-full" />
        </TableCell>
      </TableRow>
    );
  }

  if (!student) {
    return (
      <TableRow>
        <TableCell colSpan={2} className="text-destructive">
          Aluno com ID {studentId} não encontrado.
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
             <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{student.name}</span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">{student.email}</TableCell>
    </TableRow>
  );
}

export function ClassroomStudentsTable({
  courseId,
  classroomId,
}: {
  courseId: string;
  classroomId: string;
}) {
  const { user } = useUser();
  const firestore = useFirestore();

  const classroomStudentsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(
      firestore,
      `professors/${user.uid}/courses/${courseId}/classrooms/${classroomId}/classroomStudents`
    );
  }, [user, firestore, courseId, classroomId]);

  const { data: classroomStudents, isLoading } = useCollection<ClassroomStudent>(
    classroomStudentsQuery
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alunos da Turma</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-96 overflow-y-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={2}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : !classroomStudents || classroomStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center">
                    Nenhum aluno encontrado nesta turma.
                  </TableCell>
                </TableRow>
              ) : (
                classroomStudents.map((cs) => (
                  <StudentRow key={cs.id} studentId={cs.studentId} />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
