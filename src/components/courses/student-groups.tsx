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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  useFirestore,
  useUser,
  useCollection,
  useMemoFirebase,
  updateDocumentNonBlocking,
} from '@/firebase';
import { doc, writeBatch, getDoc, collection, addDoc, deleteDoc } from 'firebase/firestore';
import type { ClassroomStudent, Student, Grade, Activity, Group } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { Skeleton } from '../ui/skeleton';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { debounce } from 'lodash';
import { Loader2, Users, Trash2, Search, X, PlusCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';

function StudentRowDisplay({ student }: { student: Student }) {
  if (!student) return null;

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-8 w-8">
        <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <span className="font-medium max-w-[150px] truncate">
        {student.name}
      </span>
    </div>
  );
}

export function StudentGroups({
  courseId,
  classroomId,
  classroomStudents,
  isLoading,
  activities,
}: {
  courseId: string;
  classroomId: string;
  classroomStudents: ClassroomStudent[];
  isLoading: boolean;
  activities: Activity[];
}) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const [localGrades, setLocalGrades] = useState<Record<string, Grade[]>>({});
  
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [allStudentsData, setAllStudentsData] = useState<Record<string, Student>>({});
  const [isStudentDataLoading, setIsStudentDataLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const groupsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `professors/${user.uid}/courses/${courseId}/classrooms/${classroomId}/groups`)
  }, [user, firestore, courseId, classroomId]);
  
  const { data: groups, isLoading: isLoadingGroups } = useCollection<Group>(groupsQuery);

  const gradeStructure = useMemo(
    () => activities.filter((a) => a.active).sort((a, b) => a.order - b.order),
    [activities]
  );
  
  useEffect(() => {
    async function fetchAllStudentData() {
      if (isLoading || classroomStudents.length === 0 || !firestore) {
        setIsStudentDataLoading(!isLoading);
        return;
      }
      setIsStudentDataLoading(true);
      const studentDataMap: Record<string, Student> = {};
      const promises = classroomStudents.map(async (cs) => {
        const studentRef = doc(firestore, 'students', cs.studentId);
        const studentSnap = await getDoc(studentRef);
        if (studentSnap.exists()) {
          studentDataMap[cs.id] = studentSnap.data() as Student;
        }
      });
      await Promise.all(promises);
      setAllStudentsData(studentDataMap);
      setIsStudentDataLoading(false);
    }
    fetchAllStudentData();
  }, [classroomStudents, isLoading, firestore]);

  useEffect(() => {
    if (isLoading || isStudentDataLoading || !classroomStudents) return;

    const initialGrades: Record<string, Grade[]> = {};
   
    for (const cs of classroomStudents) {
      const studentGrades = gradeStructure.map((activity) => {
        const existingGrade = cs.grades?.find(
          (g) => g.activityId === activity.id
        );
        return (
          existingGrade || { id: uuidv4(), activityId: activity.id, score: 0 }
        );
      });
      initialGrades[cs.id] = studentGrades;
    }
    setLocalGrades(initialGrades);
  }, [classroomStudents, isLoading, isStudentDataLoading, gradeStructure, allStudentsData]);

  const { studentGroups, ungroupedStudents } = useMemo(() => {
     if (!groups || !classroomStudents) {
      return { studentGroups: [], ungroupedStudents: [] };
    }
    
    const allCsIdsInGroups = new Set<string>();
    
    const studentGroups = groups.map(group => {
      const members = classroomStudents
        .filter(cs => cs.groupId === group.id)
        .map(cs => cs.id)
        .sort((a, b) => (allStudentsData[a]?.name || '').localeCompare(allStudentsData[b]?.name || ''));

      members.forEach(id => allCsIdsInGroups.add(id));
      return { ...group, members };
    });

    const ungroupedStudents = classroomStudents
      .filter(cs => !allCsIdsInGroups.has(cs.id))
      .map(cs => cs.id)
      .sort((a,b) => (allStudentsData[a]?.name || '').localeCompare(allStudentsData[b]?.name || ''));

    return { studentGroups, ungroupedStudents };

  }, [groups, classroomStudents, allStudentsData]);


  const debouncedSaveChanges = useCallback(
    debounce(async (gradesToSave: Record<string, Grade[]>) => {
      if (!user || !firestore || Object.keys(gradesToSave).length === 0) return;

      setIsSaving(true);

      try {
        for (const [csId, grades] of Object.entries(gradesToSave)) {
          const studentRef = doc(
            firestore,
            `professors/${user.uid}/courses/${courseId}/classrooms/${classroomId}/classroomStudents/${csId}`
          );
          updateDocumentNonBlocking(studentRef, { grades });
        }
        toast({
          title: 'Notas Salvas!',
          description: 'As alterações foram salvas com sucesso.',
        });
      } catch (error) {
        console.error('Error saving grades:', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao Salvar',
          description: 'Não foi possível salvar as notas.',
        });
      } finally {
        setIsSaving(false);
      }
    }, 1500),
    [user, firestore, courseId, classroomId, toast]
  );

  useEffect(() => {
    if (Object.keys(localGrades).length > 0 && classroomStudents.length > 0) {
      debouncedSaveChanges(localGrades);
    }
    return () => debouncedSaveChanges.cancel();
  }, [localGrades, classroomStudents, debouncedSaveChanges]);

  const handleGradeChange = (
    studentOrGroupId: string,
    activityId: string,
    newScore: number,
    isGroup: boolean
  ) => {
    setLocalGrades((prev) => {
      const newGrades = { ...prev };
      
      const studentIdsToUpdate: string[] = isGroup
        ? studentGroups.find(g => g.id === studentOrGroupId)?.members || []
        : [studentOrGroupId];

      studentIdsToUpdate?.forEach((studentId) => {
        const studentGrades = newGrades[studentId]
          ? [...newGrades[studentId]]
          : [];
        const gradeIndex = studentGrades.findIndex(
          (g) => g.activityId === activityId
        );
        
        const activity = gradeStructure.find(a => a.id === activityId);
        const score = Math.max(0, Math.min(activity?.maxScore ?? 10, newScore));

        if (gradeIndex > -1) {
          studentGrades[gradeIndex] = {
            ...studentGrades[gradeIndex],
            score: score,
          };
        } else {
          studentGrades.push({ id: uuidv4(), activityId, score: score });
        }
        newGrades[studentId] = studentGrades;
      });

      return newGrades;
    });
  };

  const handleCreateGroup = async () => {
    if (!user || !firestore) return;
    if (selectedStudents.length < 1) {
      toast({
        variant: 'destructive',
        title: 'Seleção Inválida',
        description: 'Selecione pelo menos 1 aluno para criar um grupo.',
      });
      return;
    }

    const groupName = `Grupo ${groups ? groups.length + 1 : 1}`;
    const groupsCollectionRef = collection(firestore, `professors/${user.uid}/courses/${courseId}/classrooms/${classroomId}/groups`);
    
    try {
      const newGroupRef = await addDoc(groupsCollectionRef, { name: groupName, classroomId });
      const newGroupId = newGroupRef.id;

      const batch = writeBatch(firestore);
      selectedStudents.forEach((csId) => {
        const studentRef = doc(
          firestore, `professors/${user.uid}/courses/${courseId}/classrooms/${classroomId}/classroomStudents/${csId}`
        );
        batch.update(studentRef, { groupId: newGroupId });
      });

      await batch.commit();
      
      setSelectedStudents([]);
      toast({ title: 'Grupo Criado!', description: `O grupo "${groupName}" foi criado com sucesso.` });

    } catch(err) {
      console.error('Error creating group:', err);
      toast({ variant: 'destructive', title: 'Erro ao Criar Grupo' });
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!user || !firestore) return;
    const batch = writeBatch(firestore);
    
    // Find students in the group to ungroup them
    const studentsInGroup = classroomStudents.filter(cs => cs.groupId === groupId);
    studentsInGroup.forEach((cs) => {
      const studentRef = doc(firestore, `professors/${user.uid}/courses/${courseId}/classrooms/${classroomId}/classroomStudents/${cs.id}`);
      batch.update(studentRef, { groupId: null });
    });

    // Delete the group document
    const groupRef = doc(firestore, `professors/${user.uid}/courses/${courseId}/classrooms/${classroomId}/groups/${groupId}`);
    batch.delete(groupRef);

    try {
      await batch.commit()
      toast({ title: 'Grupo Excluído!' });
    } catch(err) {
      console.error('Error deleting group:', err);
      toast({ variant: 'destructive', title: 'Erro ao Excluir Grupo' });
    }
  };

  const handleRemoveStudentFromGroup = async (csId: string) => {
    if (!user || !firestore) return;
    const studentRef = doc(firestore, `professors/${user.uid}/courses/${courseId}/classrooms/${classroomId}/classroomStudents/${csId}`);
    updateDocumentNonBlocking(studentRef, { groupId: null });
  };
  
  const handleAddStudentToGroup = (groupId: string, csId: string) => {
     if (!user || !firestore) return;
    const studentRef = doc(firestore, `professors/${user.uid}/courses/${courseId}/classrooms/${classroomId}/classroomStudents/${csId}`);
    updateDocumentNonBlocking(studentRef, { groupId: groupId });
  }

  const handleGroupNameChange = debounce((groupId: string, newName: string) => {
    if (!user || !firestore) return;
    const groupRef = doc(firestore, `professors/${user.uid}/courses/${courseId}/classrooms/${classroomId}/groups/${groupId}`);
    updateDocumentNonBlocking(groupRef, { name: newName });
  }, 500);

  const n1Activities = gradeStructure.filter((g) => g.group === 'N1');
  const n2Activities = gradeStructure.filter((g) => g.group === 'N2');
  const modularActivities = gradeStructure.filter((g) =>
    ['ST1', 'ST2', 'Desafio'].includes(g.group)
  );

  const calculateTotals = (grades: Grade[]) => {
    const n1Total = Math.min(
      10,
      n1Activities.reduce((acc, activity) => {
        const grade = grades.find((g) => g.activityId === activity.id);
        return acc + (grade?.score || 0);
      }, 0)
    );

    const n2Total = Math.min(
      10,
      n2Activities.reduce((acc, activity) => {
        const grade = grades.find((g) => g.activityId === activity.id);
        return acc + (grade?.score || 0);
      }, 0)
    );

    const finalGrade = (n1Total + n2Total) / 2;

    const modularTotals = modularActivities.map((activity) => {
      const grade = grades.find((g) => g.activityId === activity.id);
      return { name: activity.name, score: grade?.score || 0 };
    });

    return { n1Total, n2Total, finalGrade, modularTotals };
  };

  const filteredGroups = useMemo(() => {
    if (!filter) return studentGroups;
    const lowerCaseFilter = filter.toLowerCase();
    return studentGroups.filter((group) => {
      return group.members.some((csId) =>
        allStudentsData[csId]?.name.toLowerCase().includes(lowerCaseFilter)
      ) || group.name.toLowerCase().includes(lowerCaseFilter)
    });
  }, [filter, studentGroups, allStudentsData]);

  const filteredUngroupedStudents = useMemo(() => {
    if (!filter) return ungroupedStudents;
    const lowerCaseFilter = filter.toLowerCase();
    return ungroupedStudents.filter((csId) =>
      allStudentsData[csId]?.name.toLowerCase().includes(lowerCaseFilter)
    );
  }, [filter, ungroupedStudents, allStudentsData]);

    const renderGradeInputs = (studentId: string, isGroup: boolean) => {
    const grades = localGrades[studentId] || [];
    const getGrade = (activityId: string) => grades.find((g) => g.activityId === activityId)?.score ?? 0;

    return (
      <div className="grid grid-cols-2 gap-4 mt-4">
        {gradeStructure.map(activity => (
          <div key={activity.id} className="space-y-2">
            <Label htmlFor={`${studentId}-${activity.id}`}>
              {activity.name} <span className="text-muted-foreground">({activity.maxScore.toFixed(1)})</span>
            </Label>
            <Input
              id={`${studentId}-${activity.id}`}
              type="number"
              step="0.5"
              min="0"
              max={activity.maxScore}
              value={getGrade(activity.id)}
              onChange={(e) => handleGradeChange(studentId, isGroup ? studentId : studentId, parseFloat(e.target.value) || 0, isGroup)}
              className="w-full"
              disabled={isSaving}
            />
          </div>
        ))}
      </div>
    );
  };
  
    const renderTotals = (studentId: string) => {
        const grades = localGrades[studentId] || [];
        if (!grades) return null;
        const { n1Total, n2Total, finalGrade, modularTotals } = calculateTotals(grades);
        const isModular = modularActivities.length > 0;

        return (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2">Totais</h4>
                <div className={`grid ${isModular ? 'grid-cols-1' : 'grid-cols-3'} gap-2 text-center`}>
                    {isModular ? (
                        modularTotals.map((mt, index) => (
                             <div key={index}>
                                <p className="text-sm text-muted-foreground">{mt.name}</p>
                                <p className="font-bold text-lg">{mt.score.toFixed(1)}</p>
                            </div>
                        ))
                    ) : (
                        <>
                            <div>
                                <p className="text-sm text-muted-foreground">Total N1</p>
                                <p className="font-bold text-lg">{n1Total.toFixed(1)}</p>
                            </div>
                             <div>
                                <p className="text-sm text-muted-foreground">Total N2</p>
                                <p className="font-bold text-lg">{n2Total.toFixed(1)}</p>
                            </div>
                             <div>
                                <p className="text-sm text-muted-foreground">Nota Final</p>
                                <p className="font-bold text-lg text-primary">{finalGrade.toFixed(1)}</p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        )
    };

  if (isLoading || isStudentDataLoading || isLoadingGroups) {
      return <Skeleton className="h-96 w-full" />
  }

  if (gradeStructure.length === 0) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        Nenhuma atividade avaliativa foi definida para esta turma. Vá para a aba
        "Atividades" para configurar um preset.
      </div>
    );
  }
  
  const noStudentsAfterFilter = filteredGroups.length === 0 && filteredUngroupedStudents.length === 0;

  const renderDesktopView = () => (
     <div className="w-full overflow-x-auto rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 z-20 bg-background/95 backdrop-blur">
            <TableRow>
              <TableHead className="sticky left-0 bg-inherit z-10 w-[250px] min-w-[250px]">
                Aluno / Grupo
              </TableHead>
              {gradeStructure.map((activity) => (
                <TableHead key={activity.id} className="min-w-[150px] text-center">
                  {activity.name} ({activity.maxScore?.toFixed(1)})
                </TableHead>
              ))}
               <TableHead className="text-center min-w-[100px]">Total N1</TableHead>
               <TableHead className="text-center min-w-[100px]">Total N2</TableHead>
               <TableHead className="text-center min-w-[100px]">Nota Final</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classroomStudents.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={gradeStructure.length + 4}
                  className="h-24 text-center"
                >
                  Nenhum aluno para exibir. Adicione alunos na aba "Alunos".
                </TableCell>
              </TableRow>
            ) : noStudentsAfterFilter ? (
                 <TableRow>
                    <TableCell
                        colSpan={gradeStructure.length + 4}
                        className="h-24 text-center"
                    >
                        Nenhum resultado encontrado para "{filter}".
                    </TableCell>
                </TableRow>
            ) : (
              <>
                {filteredGroups.map((group) => {
                    const firstStudentId = group.members[0];
                    if (!firstStudentId) return null;
                    const grades = localGrades[firstStudentId] || [];
                    const { n1Total, n2Total, finalGrade } = calculateTotals(grades);

                    return (
                    <React.Fragment key={`group-desktop-${group.id}`}>
                        <TableRow className="bg-muted/80 hover:bg-muted/80">
                            <TableCell className="sticky left-0 bg-inherit z-10 font-semibold">
                               <div className="flex items-center justify-between">
                                  <Input 
                                    defaultValue={group.name}
                                    onChange={(e) => handleGroupNameChange(group.id, e.target.value)}
                                    className="h-8 border-0 bg-transparent font-semibold p-0"
                                  />
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteGroup(group.id)}>
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                            </TableCell>
                            {gradeStructure.map((activity) => (
                                <TableCell key={activity.id}>
                                    <Input
                                      type="number"
                                      step="0.5"
                                      min="0"
                                      max={activity.maxScore}
                                      value={grades.find(g => g.activityId === activity.id)?.score ?? 0}
                                      onChange={(e) => handleGradeChange(group.id, activity.id, parseFloat(e.target.value) || 0, true)}
                                      className="w-24 mx-auto text-center"
                                      disabled={isSaving}
                                    />
                                </TableCell>
                            ))}
                            <TableCell className="font-semibold text-center">{n1Total.toFixed(1)}</TableCell>
                            <TableCell className="font-semibold text-center">{n2Total.toFixed(1)}</TableCell>
                            <TableCell className="font-bold text-primary text-center">{finalGrade.toFixed(1)}</TableCell>
                        </TableRow>
                        {group.members.map(csId => {
                           const student = allStudentsData[csId];
                           const studentGrades = localGrades[csId] || [];
                           const { n1Total, n2Total, finalGrade } = calculateTotals(studentGrades);
                           return(
                            <TableRow key={csId} className="border-l-4 border-primary/50 bg-background hover:bg-muted/30">
                               <TableCell className="sticky left-0 bg-inherit z-10 pl-4">
                                    <div className="flex items-center justify-between">
                                      <StudentRowDisplay student={student} />
                                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-50 hover:opacity-100" onClick={() => handleRemoveStudentFromGroup(csId)}>
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                               </TableCell>
                               {gradeStructure.map((activity) => (
                                    <TableCell key={activity.id} className="text-center text-muted-foreground">
                                        {studentGrades.find(g => g.activityId === activity.id)?.score.toFixed(1) ?? '0.0'}
                                    </TableCell>
                                ))}
                               <TableCell className="font-semibold text-center text-muted-foreground">{n1Total.toFixed(1)}</TableCell>
                               <TableCell className="font-semibold text-center text-muted-foreground">{n2Total.toFixed(1)}</TableCell>
                               <TableCell className="font-bold text-primary/80 text-center">{finalGrade.toFixed(1)}</TableCell>
                            </TableRow>
                           )
                        })}
                        <TableRow>
                          <TableCell className="sticky left-0 bg-inherit z-10 pl-8 py-1">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="h-7">
                                  <PlusCircle className="mr-2 h-3 w-3" /> Adicionar Aluno
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="p-0">
                                <div className="flex flex-col max-h-60 overflow-y-auto">
                                  {ungroupedStudents.length > 0 ? ungroupedStudents.map(csId => (
                                    <button 
                                      key={csId} 
                                      onClick={() => handleAddStudentToGroup(group.id, csId)}
                                      className="text-left text-sm p-2 hover:bg-accent"
                                    >
                                      {allStudentsData[csId]?.name || 'Aluno sem nome'}
                                    </button>
                                  )) : <p className="p-2 text-sm text-muted-foreground">Nenhum aluno disponível.</p>}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </TableCell>
                          <TableCell colSpan={gradeStructure.length + 3}></TableCell>
                        </TableRow>
                    </React.Fragment>
                    )
                })}
                {filteredUngroupedStudents.map((csId) => {
                     const student = allStudentsData[csId];
                     if (!student) return null;
                     const grades = localGrades[csId] || [];
                     const { n1Total, n2Total, finalGrade } = calculateTotals(grades);
                    return (
                        <TableRow key={csId}>
                            <TableCell className="sticky left-0 bg-background z-10 w-[250px]">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                    checked={selectedStudents.includes(csId)}
                                    onCheckedChange={(checked) => {
                                        setSelectedStudents((prev) =>
                                        checked
                                            ? [...prev, csId]
                                            : prev.filter((id) => id !== csId)
                                        );
                                    }}
                                    />
                                    <StudentRowDisplay student={student} />
                                </div>
                            </TableCell>
                             {gradeStructure.map((activity) => (
                                <TableCell key={activity.id}>
                                    <Input
                                      type="number"
                                      step="0.5"
                                      min="0"
                                      max={activity.maxScore}
                                      value={grades.find(g => g.activityId === activity.id)?.score ?? 0}
                                      onChange={(e) => handleGradeChange(csId, activity.id, parseFloat(e.target.value) || 0, false)}
                                      className="w-24 mx-auto text-center"
                                      disabled={isSaving}
                                    />
                                </TableCell>
                            ))}
                            <TableCell className="font-semibold text-center">{n1Total.toFixed(1)}</TableCell>
                            <TableCell className="font-semibold text-center">{n2Total.toFixed(1)}</TableCell>
                            <TableCell className="font-bold text-primary text-center">{finalGrade.toFixed(1)}</TableCell>
                        </TableRow>
                    )
                })}
              </>
            )}
          </TableBody>
        </Table>
      </div>
  );

  const renderMobileView = () => (
    <div className="space-y-4">
        {classroomStudents.length === 0 ? (
             <div className="py-10 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                Nenhum aluno para exibir.
            </div>
        ) : noStudentsAfterFilter ? (
             <div className="py-10 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                Nenhum resultado encontrado para "{filter}".
            </div>
        ) : (
            <>
              {/* Mobile Groups */}
              {filteredGroups.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Grupos</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <Accordion type="multiple" className="w-full">
                       {filteredGroups.map((group) => {
                         const firstStudentId = group.members[0];
                         if (!firstStudentId) return null;
                         return (
                           <AccordionItem value={group.id} key={`group-mobile-${group.id}`}>
                             <AccordionTrigger>
                               <div className="flex items-center justify-between w-full pr-4">
                                  <Input 
                                    defaultValue={group.name}
                                    onChange={(e) => handleGroupNameChange(group.id, e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="h-8 border-0 bg-transparent font-semibold p-0 text-base"
                                  />
                                 <Badge variant="secondary">{group.members.length} membros</Badge>
                               </div>
                             </AccordionTrigger>
                             <AccordionContent>
                                {renderGradeInputs(group.id, true)}
                                {renderTotals(firstStudentId)}
                                <div className="mt-4 space-y-2">
                                   <h4 className="font-semibold text-sm">Membros</h4>
                                   {group.members.map(csId => (
                                     <div key={csId} className="flex items-center justify-between gap-2 p-2 rounded-md bg-background">
                                       <StudentRowDisplay student={allStudentsData[csId]} />
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveStudentFromGroup(csId)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                     </div>
                                   ))}
                                </div>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="w-full mt-4">
                                        <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Membro
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="p-0">
                                    <div className="flex flex-col max-h-60 overflow-y-auto">
                                      {ungroupedStudents.length > 0 ? ungroupedStudents.map(csId => (
                                        <button 
                                          key={csId} 
                                          onClick={() => handleAddStudentToGroup(group.id, csId)}
                                          className="text-left text-sm p-2 hover:bg-accent"
                                        >
                                          {allStudentsData[csId]?.name || 'Aluno sem nome'}
                                        </button>
                                      )) : <p className="p-2 text-sm text-muted-foreground">Nenhum aluno disponível.</p>}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                                <Button variant="destructive" size="sm" onClick={() => handleDeleteGroup(group.id)} className="w-full mt-2">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Excluir Grupo
                                </Button>
                             </AccordionContent>
                           </AccordionItem>
                         );
                       })}
                     </Accordion>
                   </CardContent>
                </Card>
              )}

             {/* Mobile Ungrouped Students */}
              {filteredUngroupedStudents.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Alunos Individuais</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="multiple" className="w-full">
                        {filteredUngroupedStudents.map((csId) => {
                            const student = allStudentsData[csId];
                            if (!student) return null;
                            return (
                                <AccordionItem value={csId} key={csId}>
                                    <AccordionTrigger>
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                className="mr-2"
                                                checked={selectedStudents.includes(csId)}
                                                onCheckedChange={(checked) => {
                                                    setSelectedStudents((prev) =>
                                                    checked
                                                        ? [...prev, csId]
                                                        : prev.filter((id) => id !== csId)
                                                    );
                                                }}
                                                onClick={(e) => e.stopPropagation()} // Prevent accordion from toggling
                                            />
                                            <StudentRowDisplay student={student} />
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        {renderGradeInputs(csId, false)}
                                        {renderTotals(csId)}
                                    </AccordionContent>
                                </AccordionItem>
                            )
                        })}
                        </Accordion>
                    </CardContent>
                </Card>
              )}
            </>
        )}
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="space-y-4 rounded-lg border p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1 flex-grow">
              <h3 className="text-lg font-semibold">Lançamento de Notas</h3>
              <p className="text-sm text-muted-foreground">
                Selecione alunos individuais e clique em "Agrupar" para criar um novo grupo.
              </p>
            </div>
            <div className="flex items-center gap-2 self-end md:self-center">
              <Button
                onClick={handleCreateGroup}
                disabled={isSaving || selectedStudents.length === 0}
              >
                <Users className="mr-2 h-4 w-4" />
                Agrupar Selecionados
              </Button>
              {isSaving && (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              )}
            </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filtrar por nome do aluno ou grupo..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      {isMobile === undefined ? (
        <Skeleton className="w-full h-96" />
      ) : isMobile ? (
        renderMobileView()
      ) : (
        renderDesktopView()
      )}

    </div>
  );
}
