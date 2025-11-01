'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  useFirestore,
  useUser,
  updateDocumentNonBlocking,
  useDoc,
  useMemoFirebase,
} from '@/firebase';
import { doc, collection, writeBatch } from 'firebase/firestore';
import type { ClassroomStudent, Student, Grade } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { Skeleton } from '../ui/skeleton';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { debounce } from 'lodash';
import { Loader2, ClipboardPaste } from 'lucide-react';


const studioTemplate: Omit<Grade, 'id'>[] = [
    { description: 'Relatório de Análise e Benchmarking', score: 0, maxScore: 2, group: 'N1' },
    { description: 'Solução Preliminar', score: 0, maxScore: 2, group: 'N1' },
    { description: 'Checks de Desenvolvimento', score: 0, maxScore: 1, group: 'N2' },
    { description: 'Caderno Técnico', score: 0, maxScore: 3, group: 'N2' },
];


function StudentGradeRow({
  classroomStudent,
  courseId,
  classroomId,
  gradeStructure,
  onGradeChange,
}: {
  classroomStudent: ClassroomStudent;
  courseId: string;
  classroomId: string;
  gradeStructure: Omit<Grade, 'score'>[];
  onGradeChange: (studentId: string, gradeId: string, newScore: number) => void;
}) {
  const firestore = useFirestore();
  const { user } = useUser();

  const studentDocRef = useMemoFirebase(() => {
    if (!firestore || !classroomStudent.studentId) return null;
    return doc(firestore, `students/${classroomStudent.studentId}`);
  }, [firestore, classroomStudent.studentId]);

  const { data: student, isLoading } = useDoc<Student>(studentDocRef);
  
  if (isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={gradeStructure.length + 4}>
          <Skeleton className="h-8 w-full" />
        </TableCell>
      </TableRow>
    );
  }

  if (!student) {
    return null; // Or some error indication
  }

  const getGrade = (gradeId: string) => {
    return classroomStudent.grades?.find(g => g.id === gradeId)?.score ?? 0;
  }
  
  const n1Grades = classroomStudent.grades?.filter(g => g.group === 'N1') || [];
  const n2Grades = classroomStudent.grades?.filter(g => g.group === 'N2') || [];
  
  const n1Total = n1Grades.reduce((acc, g) => acc + (g.score || 0), 0);
  const n2Total = n2Grades.reduce((acc, g) => acc + (g.score || 0), 0);
  const finalGrade = n1Total + n2Total;


  return (
    <TableRow>
      <TableCell className="sticky left-0 bg-background z-10">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="font-medium max-w-[150px] truncate">{student.name}</span>
        </div>
      </TableCell>
      {gradeStructure.map(gradeItem => (
        <TableCell key={gradeItem.id}>
          <Input
            type="number"
            step="0.1"
            defaultValue={getGrade(gradeItem.id)}
            onChange={(e) => onGradeChange(classroomStudent.id, gradeItem.id, parseFloat(e.target.value) || 0)}
            className="w-20"
          />
        </TableCell>
      ))}
      <TableCell className="font-semibold text-center">{n1Total.toFixed(1)}</TableCell>
      <TableCell className="font-semibold text-center">{n2Total.toFixed(1)}</TableCell>
      <TableCell className="font-bold text-primary text-center">{finalGrade.toFixed(1)}</TableCell>
    </TableRow>
  );
}


export function GradesTable({
  courseId,
  classroomId,
  classroomStudents,
  isLoading,
}: {
  courseId: string;
  classroomId: string;
  classroomStudents: ClassroomStudent[];
  isLoading: boolean;
}) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const [localGrades, setLocalGrades] = useState<Record<string, Grade[]>>({});
  const [gradeStructure, setGradeStructure] = useState<Omit<Grade, 'score'>[]>([]);

  useEffect(() => {
    const initialGrades: Record<string, Grade[]> = {};
    let structure: Omit<Grade, 'score'>[] | null = null;

    for (const cs of classroomStudents) {
      initialGrades[cs.id] = cs.grades || [];
      // Use the grade structure from the first student that has one
      if (!structure && cs.grades && cs.grades.length > 0) {
        structure = cs.grades.map(({ score, ...rest }) => rest);
      }
    }
    
    setLocalGrades(initialGrades);
    if(structure) {
        setGradeStructure(structure);
    }

  }, [classroomStudents]);


  const handleGradeChange = (studentId: string, gradeId: string, newScore: number) => {
    setLocalGrades(prev => {
      const studentGrades = [...(prev[studentId] || [])];
      const gradeIndex = studentGrades.findIndex(g => g.id === gradeId);
      if (gradeIndex > -1) {
        studentGrades[gradeIndex] = { ...studentGrades[gradeIndex], score: newScore };
      }
      return { ...prev, [studentId]: studentGrades };
    });
  };

  const debouncedSaveChanges = useCallback(
    debounce(async (gradesToSave: Record<string, Grade[]>) => {
      if (!user || !firestore || Object.keys(gradesToSave).length === 0) return;

      setIsSaving(true);
      const batch = writeBatch(firestore);

      Object.entries(gradesToSave).forEach(([csId, grades]) => {
        const studentRef = doc(firestore, `professors/${user.uid}/courses/${courseId}/classrooms/${classroomId}/classroomStudents/${csId}`);
        batch.update(studentRef, { grades });
      });

      try {
        await batch.commit();
        toast({ title: 'Notas Salvas!', description: 'As alterações foram salvas com sucesso.' });
      } catch (error) {
        console.error("Error saving grades:", error);
        toast({ variant: 'destructive', title: 'Erro ao Salvar', description: 'Não foi possível salvar as notas.' });
      } finally {
        setIsSaving(false);
      }
    }, 1000),
    [user, firestore, courseId, classroomId, toast]
  );
  
  useEffect(() => {
    if (Object.keys(localGrades).length > 0) {
        debouncedSaveChanges(localGrades);
    }
    return () => debouncedSaveChanges.cancel();
  }, [localGrades, debouncedSaveChanges]);

  const applyStudioTemplate = async () => {
     if (!user || !firestore) {
        toast({ variant: "destructive", title: "Erro de autenticação" });
        return;
    }
    
    setIsSaving(true);

    const newStructure = studioTemplate.map(item => ({ ...item, id: uuidv4() }));
    const batch = writeBatch(firestore);
    const newLocalGrades: Record<string, Grade[]> = {};

    for (const cs of classroomStudents) {
        const newGrades = newStructure.map(item => ({...item, score: 0}));
        newLocalGrades[cs.id] = newGrades;
        const studentRef = doc(firestore, `professors/${user.uid}/courses/${courseId}/classrooms/${classroomId}/classroomStudents/${cs.id}`);
        batch.update(studentRef, { grades: newGrades });
    }
    
    try {
        await batch.commit();
        setGradeStructure(newStructure.map(({ score, ...rest }) => rest));
        setLocalGrades(newLocalGrades);
        toast({ title: "Template Aplicado!", description: "A estrutura de notas de estúdio foi aplicada a todos os alunos." });
    } catch(error) {
        console.error("Error applying template:", error);
        toast({ variant: "destructive", title: "Erro ao Aplicar Template", description: "Não foi possível aplicar o template." });
    } finally {
        setIsSaving(false);
    }
  };
  
  const n1Structure = gradeStructure.filter(g => g.group === 'N1');
  const n2Structure = gradeStructure.filter(g => g.group === 'N2');
  
  return (
    <div className='space-y-4'>
        <div className='flex items-center justify-between'>
            <div className='space-y-1'>
                 <h3 className="text-lg font-semibold">Matriz de Notas</h3>
                 <p className='text-sm text-muted-foreground'>Edite as notas dos alunos diretamente na tabela. As alterações são salvas automaticamente.</p>
            </div>
            <div className='flex items-center gap-2'>
                 <Button variant="secondary" onClick={applyStudioTemplate} disabled={isSaving}>
                    <ClipboardPaste className="mr-2 h-4 w-4" />
                    Aplicar Template de Estúdio
                </Button>
                {isSaving && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
            </div>
        </div>
      <div className="w-full overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-background z-10 w-[200px]">Aluno</TableHead>
              {n1Structure.length > 0 && <TableHead colSpan={n1Structure.length} className="text-center bg-muted/30">N1</TableHead>}
              {n2Structure.length > 0 && <TableHead colSpan={n2Structure.length} className="text-center bg-muted/30">N2</TableHead>}
              <TableHead colSpan={3} className='text-center'>Totais</TableHead>
            </TableRow>
            <TableRow>
                <TableHead className="sticky left-0 bg-background z-10"></TableHead>
                {gradeStructure.map(grade => (
                    <TableHead key={grade.id} className="min-w-[150px]">{grade.description} ({grade.maxScore?.toFixed(1)})</TableHead>
                ))}
                <TableHead className='text-center'>Total N1</TableHead>
                <TableHead className='text-center'>Total N2</TableHead>
                <TableHead className='text-center'>Nota Final</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={gradeStructure.length + 4}>
                  <Skeleton className="h-10 w-full" />
                </TableCell>
              </TableRow>
            ) : classroomStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={gradeStructure.length + 4} className="h-24 text-center">
                  Nenhum aluno para exibir. Adicione alunos à turma primeiro.
                </TableCell>
              </TableRow>
            ) : (
              classroomStudents.map((cs) => (
                 localGrades[cs.id] &&
                <StudentGradeRow
                  key={cs.id}
                  classroomStudent={{...cs, grades: localGrades[cs.id]}}
                  courseId={courseId}
                  classroomId={classroomId}
                  gradeStructure={gradeStructure}
                  onGradeChange={handleGradeChange}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
