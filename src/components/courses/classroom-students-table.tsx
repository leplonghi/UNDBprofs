'use client';

import React, { useState } from 'react';
import {
  useCollection,
  useDoc,
  useFirestore,
  useUser,
  useMemoFirebase,
  deleteDocumentNonBlocking,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function StudentRow({ studentId, classroomStudentId, courseId, classroomId }: { studentId: string; classroomStudentId: string; courseId: string; classroomId: string; }) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  
  const studentDocRef = useMemoFirebase(() => {
    if (!firestore || !studentId) return null;
    return doc(firestore, `students/${studentId}`);
  }, [firestore, studentId]);

  const { data: student, isLoading } = useDoc<Student>(studentDocRef);

  const handleDelete = async () => {
    if (!user || !firestore || !student) return;

    setIsDeleting(true);
    const classroomStudentRef = doc(firestore, `professors/${user.uid}/courses/${courseId}/classrooms/${classroomId}/classroomStudents/${classroomStudentId}`);
    
    try {
        deleteDocumentNonBlocking(classroomStudentRef);
        toast({
            title: "Aluno Removido",
            description: `${student.name} foi removido da turma.`
        });
    } catch (error) {
        console.error("Error deleting student from classroom: ", error);
        toast({
            variant: "destructive",
            title: "Erro ao Remover",
            description: "Não foi possível remover o aluno. Tente novamente.",
        });
    } finally {
        setIsDeleting(false);
        setIsAlertOpen(false);
    }
  };


  if (isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={4}>
          <Skeleton className="h-8 w-full" />
        </TableCell>
      </TableRow>
    );
  }

  if (!student) {
    return (
      <TableRow>
        <TableCell colSpan={4} className="text-destructive">
          Aluno com ID {studentId} não encontrado.
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
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
      <TableCell className="text-muted-foreground">{student.registrationId || 'N/A'}</TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="icon" onClick={() => setIsAlertOpen(true)} disabled={isDeleting}>
            <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </TableCell>
    </TableRow>
    <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá permanentemente o aluno <span className='font-bold'>"{student.name}"</span> desta turma. Os dados do aluno não serão excluídos do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
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
                <TableHead>Matrícula</TableHead>
                <TableHead><span className='sr-only'>Ações</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : !classroomStudents || classroomStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Nenhum aluno encontrado nesta turma.
                  </TableCell>
                </TableRow>
              ) : (
                classroomStudents.map((cs) => (
                  <StudentRow 
                    key={cs.id} 
                    studentId={cs.studentId} 
                    classroomStudentId={cs.id}
                    courseId={courseId}
                    classroomId={classroomId}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
