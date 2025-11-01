'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  useFirestore,
  useUser,
  useDoc,
  useMemoFirebase,
} from '@/firebase';
import { doc, writeBatch } from 'firebase/firestore';
import type { ClassroomStudent, Student, Grade } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { Skeleton } from '../ui/skeleton';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { debounce } from 'lodash';
import { Loader2, ClipboardPaste, Users, Trash2 } from 'lucide-react';

const studioTemplate: Omit<Grade, 'id'>[] = [
    { description: 'Relatório de Análise e Benchmarking', score: 0, maxScore: 2, group: 'N1' },
    { description: 'Solução Preliminar', score: 0, maxScore: 2, group: 'N1' },
    { description: 'Checks de Desenvolvimento', score: 0, maxScore: 1, group: 'N2' },
    { description: 'Caderno Técnico', score: 0, maxScore: 3, group: 'N2' },
];

function StudentRow({ studentId }: { studentId: string }) {
  const firestore = useFirestore();
  const studentDocRef = useMemoFirebase(() => {
    if (!firestore || !studentId) return null;
    return doc(firestore, `students/${studentId}`);
  }, [firestore, studentId]);

  const { data: student, isLoading } = useDoc<Student>(studentDocRef);

  if (isLoading) {
    return <Skeleton className="h-8 w-full" />;
  }
  if (!student) return null;

  return (
    <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
        <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <span className="font-medium max-w-[150px] truncate">{student.name}</span>
    </div>
  )
}

export function StudentGroups({
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
  const [studentGroups, setStudentGroups] = useState<string[][]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [ungroupedStudents, setUngroupedStudents] = useState<string[]>([]);

  const applyStudioTemplate = useCallback(async () => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Erro de autenticação' });
      return;
    }
    if (classroomStudents.length === 0) {
      // Don't apply if there are no students
      return;
    }

    setIsSaving(true);

    const newStructure = studioTemplate.map((item) => ({ ...item, id: uuidv4() }));
    const batch = writeBatch(firestore);
    const newLocalGrades: Record<string, Grade[]> = {};

    for (const cs of classroomStudents) {
      const newGrades = newStructure.map((item) => ({ ...item, score: 0 }));
      newLocalGrades[cs.id] = newGrades;
      const studentRef = doc(
        firestore,
        `professors/${user.uid}/courses/${courseId}/classrooms/${classroomId}/classroomStudents/${cs.id}`
      );
      batch.update(studentRef, { grades: newGrades });
    }

    try {
      await batch.commit();
      setGradeStructure(newStructure.map(({ score, ...rest }) => rest));
      setLocalGrades(newLocalGrades);
      toast({
        title: 'Template Aplicado!',
        description: 'A estrutura de notas de estúdio foi aplicada a todos os alunos.',
      });
    } catch (error) {
      console.error('Error applying template:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao Aplicar Template',
        description: 'Não foi possível aplicar o template.',
      });
    } finally {
      setIsSaving(false);
    }
  }, [user, firestore, classroomId, courseId, classroomStudents, toast]);

  useEffect(() => {
    if (isLoading || classroomStudents.length === 0) return;

    const initialGrades: Record<string, Grade[]> = {};
    let structure: Omit<Grade, 'score'>[] | null = null;
    const allStudentIds = new Set<string>();
    const groupedStudentIds = new Set<string>();

    let hasGrades = false;
    for (const cs of classroomStudents) {
      if (cs.grades && cs.grades.length > 0) {
        hasGrades = true;
        break;
      }
    }

    if (!hasGrades) {
      applyStudioTemplate();
      return;
    }
    
    // Initialize grade structure and local grades
    for (const cs of classroomStudents) {
        allStudentIds.add(cs.id);
        initialGrades[cs.id] = cs.grades || [];
        if (!structure && cs.grades && cs.grades.length > 0) {
            structure = cs.grades.map(({ score, ...rest }) => rest);
        }
    }

    setLocalGrades(initialGrades);
    if(structure) {
        setGradeStructure(structure);
    }

    // Initialize groups
    const groups = classroomStudents.reduce((acc, cs) => {
        if (cs.groupId) {
            if (!acc[cs.groupId]) {
                acc[cs.groupId] = [];
            }
            acc[cs.groupId].push(cs.id);
            groupedStudentIds.add(cs.id);
        }
        return acc;
    }, {} as Record<string, string[]>);
    setStudentGroups(Object.values(groups));

    // Initialize ungrouped students
    const ungrouped = Array.from(allStudentIds).filter(id => !groupedStudentIds.has(id));
    setUngroupedStudents(ungrouped);

  }, [classroomStudents, isLoading, applyStudioTemplate]);


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
    }, 1500),
    [user, firestore, courseId, classroomId, toast]
  );
  
  useEffect(() => {
    if (Object.keys(localGrades).length > 0) {
        const hasGrades = classroomStudents.some(cs => cs.grades && cs.grades.length > 0);
        if (hasGrades) { // Only save if grades existed before
             debouncedSaveChanges(localGrades);
        }
    }
    return () => debouncedSaveChanges.cancel();
  }, [localGrades, classroomStudents, debouncedSaveChanges]);

  const handleGradeChange = (studentOrGroupId: string, gradeId: string, newScore: number, isGroup: boolean) => {
      setLocalGrades(prev => {
          const newGrades = {...prev};
          const studentIdsToUpdate = isGroup ? studentGroups.flat().find(id => id === studentOrGroupId) ? studentGroups.find(g => g.includes(studentOrGroupId)) : [studentOrGroupId] : [studentOrGroupId];
          
          studentIdsToUpdate?.forEach(studentId => {
                const studentGrades = [...(newGrades[studentId] || [])];
                const gradeIndex = studentGrades.findIndex(g => g.id === gradeId);
                if (gradeIndex > -1) {
                    studentGrades[gradeIndex] = { ...studentGrades[gradeIndex], score: newScore };
                }
                newGrades[studentId] = studentGrades;
          });

          return newGrades;
      });
  };

    const handleCreateGroup = () => {
        if (selectedStudents.length < 2) {
            toast({ variant: 'destructive', title: 'Seleção Inválida', description: 'Selecione pelo menos 2 alunos para criar um grupo.' });
            return;
        }

        const newGroupId = uuidv4();
        const batch = writeBatch(firestore);
        selectedStudents.forEach(csId => {
            const studentRef = doc(firestore, `professors/${user.uid}/courses/${courseId}/classrooms/${classroomId}/classroomStudents/${csId}`);
            batch.update(studentRef, { groupId: newGroupId });
        });

        batch.commit().then(() => {
            setStudentGroups(prev => [...prev, selectedStudents]);
            setUngroupedStudents(prev => prev.filter(id => !selectedStudents.includes(id)));
            setSelectedStudents([]);
            toast({ title: 'Grupo Criado!', description: 'O grupo foi criado com sucesso.' });
        }).catch(err => {
            console.error("Error creating group:", err);
            toast({ variant: 'destructive', title: 'Erro ao Criar Grupo' });
        })
    };

    const handleUngroup = (group: string[]) => {
        const batch = writeBatch(firestore);
        group.forEach(csId => {
            const studentRef = doc(firestore, `professors/${user.uid}/courses/${courseId}/classrooms/${classroomId}/classroomStudents/${csId}`);
            batch.update(studentRef, { groupId: null });
        });

         batch.commit().then(() => {
            setStudentGroups(prev => prev.filter(g => g !== group));
            setUngroupedStudents(prev => [...prev, ...group]);
            toast({ title: 'Grupo Desfeito!' });
        }).catch(err => {
            console.error("Error ungrouping:", err);
            toast({ variant: 'destructive', title: 'Erro ao Desfazer Grupo' });
        })
    }
  
  const n1Structure = gradeStructure.filter(g => g.group === 'N1');
  const n2Structure = gradeStructure.filter(g => g.group === 'N2');

  const renderGradeRow = (studentId: string, isGroup: boolean) => {
    const studentClassroom = classroomStudents.find(cs => cs.id === studentId);
    if (!studentClassroom) return null;
    const grades = localGrades[studentId] || [];

    const getGrade = (gradeId: string) => grades.find(g => g.id === gradeId)?.score ?? 0;
    
    const n1Grades = grades.filter(g => g.group === 'N1') || [];
    const n2Grades = grades.filter(g => g.group === 'N2') || [];
    
    const n1Total = n1Grades.reduce((acc, g) => acc + (g.score || 0), 0);
    const n2Total = n2Grades.reduce((acc, g) => acc + (g.score || 0), 0);
    const finalGrade = n1Total + n2Total;

    return (
        <TableRow key={studentId}>
             <TableCell className="sticky left-0 bg-background z-10 w-[250px]">
                <div className='flex items-center gap-2'>
                    {!isGroup && <Checkbox
                        checked={selectedStudents.includes(studentId)}
                        onCheckedChange={(checked) => {
                            setSelectedStudents(prev => checked ? [...prev, studentId] : prev.filter(id => id !== studentId));
                        }}
                    />}
                    <StudentRow studentId={studentClassroom.studentId} />
                </div>
            </TableCell>
             {gradeStructure.map(gradeItem => (
                <TableCell key={gradeItem.id}>
                <Input
                    type="number"
                    step="0.5"
                    defaultValue={getGrade(gradeItem.id)}
                    onChange={(e) => handleGradeChange(studentId, gradeItem.id, parseFloat(e.target.value) || 0, isGroup)}
                    className="w-24"
                    disabled={isSaving}
                />
                </TableCell>
            ))}
            <TableCell className="font-semibold text-center">{n1Total.toFixed(1)}</TableCell>
            <TableCell className="font-semibold text-center">{n2Total.toFixed(1)}</TableCell>
            <TableCell className="font-bold text-primary text-center">{finalGrade.toFixed(1)}</TableCell>
        </TableRow>
    )
  }

  const renderGroupRow = (group: string[], groupIndex: number) => {
      const firstStudentId = group[0];
      if (!firstStudentId) return null;

      return (
          <React.Fragment key={`group-${groupIndex}`}>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableCell className="sticky left-0 bg-muted/50 z-10 font-semibold" colSpan={1}>
                      <div className='flex items-center justify-between'>
                        <span>Grupo {groupIndex + 1}</span>
                        <Button variant="ghost" size="icon" onClick={() => handleUngroup(group)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                  </TableCell>
                  <TableCell colSpan={gradeStructure.length + 3}></TableCell>
              </TableRow>
              {renderGradeRow(firstStudentId, true)}
              {group.map(csId => (
                  <TableRow key={csId} className='border-l-2 border-primary'>
                       <TableCell className="sticky left-0 bg-background z-10 pl-8">
                           <StudentRow studentId={classroomStudents.find(cs => cs.id === csId)!.studentId} />
                       </TableCell>
                       <TableCell colSpan={gradeStructure.length + 3} className='text-center text-muted-foreground'>
                           As notas deste aluno são sincronizadas com as do grupo.
                       </TableCell>
                  </TableRow>
              ))}
          </React.Fragment>
      )
  }

  return (
    <div className='space-y-4'>
        <div className='flex items-center justify-between'>
            <div className='space-y-1'>
                 <h3 className="text-lg font-semibold">Grupos e Notas</h3>
                 <p className='text-sm text-muted-foreground'>Crie grupos e edite as notas. As alterações são salvas automaticamente.</p>
            </div>
            <div className='flex items-center gap-2'>
                <Button variant="outline" onClick={handleCreateGroup} disabled={isSaving || selectedStudents.length < 2}>
                    <Users className="mr-2" />
                    Agrupar Selecionados
                </Button>
                 <Button variant="secondary" onClick={applyStudioTemplate} disabled={isSaving}>
                    <ClipboardPaste className="mr-2" />
                    Aplicar Template de Estúdio
                </Button>
                {isSaving && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
            </div>
        </div>
      <div className="w-full overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-background z-10 w-[250px]">Aluno</TableHead>
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
                <>
                    {studentGroups.map((group, index) => renderGroupRow(group, index))}
                    {ungroupedStudents.map((csId) => renderGradeRow(csId, false))}
                </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
