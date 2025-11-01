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
  useMemoFirebase,
  updateDocumentNonBlocking,
} from '@/firebase';
import { doc, writeBatch, getDoc } from 'firebase/firestore';
import type { ClassroomStudent, Student, Grade, Activity } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { Skeleton } from '../ui/skeleton';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { debounce } from 'lodash';
import { Loader2, Users, Trash2, Search } from 'lucide-react';

function StudentRow({ student }: { student: Student }) {
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
  const firestore = useFirestore();
  const { user } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const [localGrades, setLocalGrades] = useState<Record<string, Grade[]>>({});
  const [studentGroups, setStudentGroups] = useState<string[][]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [ungroupedStudents, setUngroupedStudents] = useState<string[]>([]);
  const [allStudentsData, setAllStudentsData] = useState<Record<string, Student>>({});
  const [isStudentDataLoading, setIsStudentDataLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const gradeStructure = useMemo(
    () => activities.filter((a) => a.active),
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
    const allStudentIds = new Set<string>();
    const groupedStudentIds = new Set<string>();

    for (const cs of classroomStudents) {
      allStudentIds.add(cs.id);

      // Ensure student has a grade for each active activity
      const studentGrades = gradeStructure.map((activity) => {
        const existingGrade = cs.grades?.find(
          (g) => g.activityId === activity.id
        );
        return (
          existingGrade || { id: uuidv4(), activityId: activity.id, score: 0 }
        );
      });
      initialGrades[cs.id] = studentGrades;

      if (cs.groupId) {
        groupedStudentIds.add(cs.id);
      }
    }

    setLocalGrades(initialGrades);

    const groups = classroomStudents.reduce((acc, cs) => {
      if (cs.groupId) {
        if (!acc[cs.groupId]) {
          acc[cs.groupId] = [];
        }
        acc[cs.groupId].push(cs.id);
      }
      return acc;
    }, {} as Record<string, string[]>);

    setStudentGroups(Object.values(groups));
    const ungrouped = Array.from(allStudentIds).filter(
      (id) => !groupedStudentIds.has(id)
    );
    setUngroupedStudents(ungrouped);
  }, [classroomStudents, isLoading, isStudentDataLoading, gradeStructure]);

  const debouncedSaveChanges = useCallback(
    debounce(async (gradesToSave: Record<string, Grade[]>) => {
      if (!user || !firestore || Object.keys(gradesToSave).length === 0) return;

      setIsSaving(true);

      try {
        // Use individual non-blocking updates
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
    // Prevent saving on initial load
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
        ? studentGroups.find((g) => g.includes(studentOrGroupId)) || []
        : [studentOrGroupId];

      studentIdsToUpdate?.forEach((studentId) => {
        const studentGrades = newGrades[studentId]
          ? [...newGrades[studentId]]
          : [];
        const gradeIndex = studentGrades.findIndex(
          (g) => g.activityId === activityId
        );
        if (gradeIndex > -1) {
          studentGrades[gradeIndex] = {
            ...studentGrades[gradeIndex],
            score: newScore,
          };
        } else {
          studentGrades.push({ id: uuidv4(), activityId, score: newScore });
        }
        newGrades[studentId] = studentGrades;
      });

      return newGrades;
    });
  };

  const handleCreateGroup = () => {
    if (!user || !firestore) return;
    if (selectedStudents.length < 1) {
      // Can group even 1 person
      toast({
        variant: 'destructive',
        title: 'Seleção Inválida',
        description: 'Selecione pelo menos 1 aluno para criar um grupo.',
      });
      return;
    }

    const newGroupId = uuidv4();
    const batch = writeBatch(firestore);
    selectedStudents.forEach((csId) => {
      const studentRef = doc(
        firestore,
        `professors/${user.uid}/courses/${courseId}/classrooms/${classroomId}/classroomStudents/${csId}`
      );
      batch.update(studentRef, { groupId: newGroupId });
    });

    batch
      .commit()
      .then(() => {
        setStudentGroups((prev) => [...prev, selectedStudents]);
        setUngroupedStudents((prev) =>
          prev.filter((id) => !selectedStudents.includes(id))
        );
        setSelectedStudents([]);
        toast({ title: 'Grupo Criado!', description: 'O grupo foi criado com sucesso.' });
      })
      .catch((err) => {
        console.error('Error creating group:', err);
        toast({ variant: 'destructive', title: 'Erro ao Criar Grupo' });
      });
  };

  const handleUngroup = (group: string[]) => {
    if (!user || !firestore) return;
    const batch = writeBatch(firestore);
    group.forEach((csId) => {
      const studentRef = doc(
        firestore,
        `professors/${user.uid}/courses/${courseId}/classrooms/${classroomId}/classroomStudents/${csId}`
      );
      batch.update(studentRef, { groupId: null });
    });

    batch
      .commit()
      .then(() => {
        setStudentGroups((prev) => prev.filter((g) => g !== group));
        setUngroupedStudents((prev) => [...prev, ...group]);
        toast({ title: 'Grupo Desfeito!' });
      })
      .catch((err) => {
        console.error('Error ungrouping:', err);
        toast({ variant: 'destructive', title: 'Erro ao Desfazer Grupo' });
      });
  };

  const n1Activities = gradeStructure.filter((g) => g.group === 'N1');
  const n2Activities = gradeStructure.filter((g) => g.group === 'N2');
  const modularActivities = gradeStructure.filter((g) =>
    g.group?.startsWith('ST')
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
    return studentGroups.filter((group, index) => {
      const groupName = `grupo ${index + 1}`;
      if (groupName.includes(lowerCaseFilter)) return true;

      return group.some((csId) =>
        allStudentsData[csId]?.name.toLowerCase().includes(lowerCaseFilter)
      );
    });
  }, [filter, studentGroups, allStudentsData]);

  const filteredUngroupedStudents = useMemo(() => {
    if (!filter) return ungroupedStudents;
    const lowerCaseFilter = filter.toLowerCase();
    return ungroupedStudents.filter((csId) =>
      allStudentsData[csId]?.name.toLowerCase().includes(lowerCaseFilter)
    );
  }, [filter, ungroupedStudents, allStudentsData]);

  const renderGradeRow = (
    studentId: string,
    isGroup: boolean,
    isGroupMember = false
  ) => {
    const student = allStudentsData[studentId];
    if (!student) return null;
    const grades = localGrades[studentId] || [];

    const getGrade = (activityId: string) =>
      grades.find((g) => g.activityId === activityId)?.score ?? 0;

    const { n1Total, n2Total, finalGrade, modularTotals } =
      calculateTotals(grades);

    if (isGroupMember) {
      return (
        <TableRow key={studentId} className="border-l-2 border-primary">
          <TableCell className="sticky left-0 bg-background z-10 pl-8">
            <StudentRow student={student} />
          </TableCell>
          <TableCell
            colSpan={gradeStructure.length + 3}
            className="text-center text-muted-foreground"
          >
            As notas deste aluno são sincronizadas com as do grupo.
          </TableCell>
        </TableRow>
      );
    }

    return (
      <TableRow key={studentId}>
        <TableCell className="sticky left-0 bg-background z-10 w-[250px]">
          <div className="flex items-center gap-2">
            {!isGroup && (
              <Checkbox
                checked={selectedStudents.includes(studentId)}
                onCheckedChange={(checked) => {
                  setSelectedStudents((prev) =>
                    checked
                      ? [...prev, studentId]
                      : prev.filter((id) => id !== studentId)
                  );
                }}
              />
            )}
            <StudentRow student={student} />
          </div>
        </TableCell>
        {gradeStructure.map((activity) => (
          <TableCell key={activity.id}>
            <Input
              type="number"
              step="0.5"
              min="0"
              max={activity.maxScore}
              defaultValue={getGrade(activity.id)}
              onChange={(e) =>
                handleGradeChange(
                  studentId,
                  activity.id,
                  parseFloat(e.target.value) || 0,
                  isGroup
                )
              }
              className="w-24"
              disabled={isSaving}
            />
          </TableCell>
        ))}
        {n1Activities.length > 0 && (
          <TableCell className="font-semibold text-center">
            {n1Total.toFixed(1)}
          </TableCell>
        )}
        {n2Activities.length > 0 && (
          <TableCell className="font-semibold text-center">
            {n2Total.toFixed(1)}
          </TableCell>
        )}
        {(n1Activities.length > 0 || n2Activities.length > 0) && (
          <TableCell className="font-bold text-primary text-center">
            {finalGrade.toFixed(1)}
          </TableCell>
        )}
        {modularTotals.map((mt) => (
          <TableCell key={mt.name} className="font-semibold text-center">
            {mt.score.toFixed(1)}
          </TableCell>
        ))}
      </TableRow>
    );
  };

  const renderGroupRow = (group: string[], groupIndex: number) => {
    const firstStudentId = group[0];
    if (!firstStudentId) return null;

    return (
      <React.Fragment key={`group-${groupIndex}`}>
        <TableRow className="bg-muted/50 hover:bg-muted/50">
          <TableCell
            className="sticky left-0 bg-muted/50 z-10 font-semibold"
            colSpan={1}
          >
            <div className="flex items-center justify-between">
              <span>Grupo {groupIndex + 1}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleUngroup(group)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </TableCell>
          <TableCell colSpan={gradeStructure.length + 3}></TableCell>
        </TableRow>
        {renderGradeRow(firstStudentId, true)}
        {group.slice(1).map((csId) => renderGradeRow(csId, false, true))}
      </React.Fragment>
    );
  };

  if (isLoading || isStudentDataLoading) {
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1 flex-grow">
          <h3 className="text-lg font-semibold">Lançamento de Notas</h3>
          <p className="text-sm text-muted-foreground">
            Crie grupos, edite as notas e filtre. As alterações são salvas
            automaticamente.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
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
          placeholder="Filtrar por nome ou grupo..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="w-full overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-background z-10 w-[250px] min-w-[250px]">
                Aluno
              </TableHead>
              {n1Activities.length > 0 && (
                <TableHead
                  colSpan={n1Activities.length}
                  className="text-center bg-muted/30"
                >
                  N1
                </TableHead>
              )}
              {n2Activities.length > 0 && (
                <TableHead
                  colSpan={n2Activities.length}
                  className="text-center bg-muted/30"
                >
                  N2
                </TableHead>
              )}
              {modularActivities.length > 0 && (
                <TableHead
                  colSpan={modularActivities.length}
                  className="text-center bg-muted/30"
                >
                  Avaliações Modulares
                </TableHead>
              )}

              {(n1Activities.length > 0 || n2Activities.length > 0) && (
                <TableHead colSpan={3} className="text-center">
                  Totais
                </TableHead>
              )}
            </TableRow>
            <TableRow>
              <TableHead className="sticky left-0 bg-background z-10"></TableHead>
              {gradeStructure.map((activity) => (
                <TableHead key={activity.id} className="min-w-[150px]">
                  {activity.name} ({activity.maxScore?.toFixed(1)})
                </TableHead>
              ))}
              {n1Activities.length > 0 && (
                <TableHead className="text-center">Total N1</TableHead>
              )}
              {n2Activities.length > 0 && (
                <TableHead className="text-center">Total N2</TableHead>
              )}
              {(n1Activities.length > 0 || n2Activities.length > 0) && (
                <TableHead className="text-center">Nota Final</TableHead>
              )}
              {modularActivities.length > 0 &&
                modularActivities.map((act) => (
                  <TableHead
                    key={act.id}
                    className="text-center min-w-[150px]"
                  >
                    {act.name} Total
                  </TableHead>
                ))}
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
                {filteredGroups.map((group, index) =>
                  renderGroupRow(group, index)
                )}
                {filteredUngroupedStudents.map((csId) =>
                  renderGradeRow(csId, false)
                )}
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
