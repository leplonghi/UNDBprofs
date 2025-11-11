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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  useFirestore,
  useUser,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { doc, writeBatch, getDocs, collection, addDoc, deleteDoc, query as firestoreQuery, where, updateDoc } from 'firebase/firestore';
import type { ClassroomStudent, Student, Grade, Activity, Group } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { Skeleton } from '../ui/skeleton';
import { Avatar, AvatarFallback } from '../ui/avatar';
import debounce from 'lodash.debounce';
import { Loader2, Users, Trash2, Search, X, PlusCircle, Download, Save } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { cn } from '@/lib/utils';

function StudentRowDisplay({ student }: { student: Student }) {
  if (!student) return null;

  return (
    <div className="flex items-center gap-3">
      <span className="font-medium max-w-[150px] truncate">
        {student.name}
      </span>
    </div>
  );
}

const groupColors = [
    'bg-sky-50 dark:bg-sky-900/20',
    'bg-emerald-50 dark:bg-emerald-900/20',
    'bg-amber-50 dark:bg-amber-900/20',
    'bg-rose-50 dark:bg-rose-900/20',
    'bg-violet-50 dark:bg-violet-900/20',
];

export function StudentGroups({
  courseId,
  classroomId,
  classroomStudents: initialClassroomStudents,
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
  const [hasChanges, setHasChanges] = useState(false);
  
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [allStudentsData, setAllStudentsData] = useState<Record<string, Student>>({});
  const [isStudentDataLoading, setIsStudentDataLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState<'groups' | 'alphabetical'>('groups');

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
      if (isLoading || initialClassroomStudents.length === 0 || !firestore) {
        setIsStudentDataLoading(!isLoading);
        return;
      }
      setIsStudentDataLoading(true);
      const studentIds = initialClassroomStudents.map(cs => cs.studentId);
      
      const studentPromises = [];
      // Firestore 'in' query limit is 30
      for (let i = 0; i < studentIds.length; i += 30) {
          const batchIds = studentIds.slice(i, i + 30);
          if (batchIds.length > 0) {
            const studentQuery = firestoreQuery(collection(firestore, 'students'), where('id', 'in', batchIds));
            studentPromises.push(getDocs(studentQuery));
          }
      }

      const studentSnapshots = await Promise.all(studentPromises);
      const studentDocs = studentSnapshots.flatMap(snap => snap.docs);

      const studentDataById: Record<string, Student> = {};
      studentDocs.forEach(doc => {
          studentDataById[doc.id] = doc.data() as Student;
      });
      
      setAllStudentsData(studentDataById);
      setIsStudentDataLoading(false);
    }
    fetchAllStudentData();
  }, [initialClassroomStudents, isLoading, firestore]);

  const classroomStudents = useMemo(() => {
    if (Object.keys(allStudentsData).length === 0) return initialClassroomStudents;
    return initialClassroomStudents.filter(cs => {
        const studentData = allStudentsData[cs.studentId];
        return studentData && !studentData.email.endsWith('@undb.edu.br');
    })
  }, [initialClassroomStudents, allStudentsData]);


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
    setHasChanges(false); // Reset changes when data reloads
  }, [classroomStudents, isLoading, isStudentDataLoading, gradeStructure]);

  const { studentGroups, ungroupedStudents } = useMemo(() => {
     if (!groups || !classroomStudents) {
      return { studentGroups: [], ungroupedStudents: [] };
    }
    
    const allCsIdsInGroups = new Set<string>();
    
    const studentGroups = groups.map(group => {
      const members = classroomStudents
        .filter(cs => cs.groupId === group.id)
        .sort((a, b) => (allStudentsData[a.studentId]?.name || '').localeCompare(allStudentsData[b.studentId]?.name || ''));

      members.forEach(cs => allCsIdsInGroups.add(cs.id));
      return { ...group, members: members.map(m => m.id) };
    }).sort((a,b) => a.name.localeCompare(b.name));

    const ungroupedStudents = classroomStudents
      .filter(cs => !allCsIdsInGroups.has(cs.id))
      .map(cs => cs.id)
      .sort((a,b) => (allStudentsData[classroomStudents.find(cs => cs.id === a)?.studentId || '']?.name || '').localeCompare(allStudentsData[classroomStudents.find(cs => cs.id === b)?.studentId || '']?.name || ''));

    return { studentGroups, ungroupedStudents };

  }, [groups, classroomStudents, allStudentsData]);

   const groupColorMap = useMemo(() => {
    if (!studentGroups) return {};
    const map: Record<string, number> = {};
    studentGroups.forEach((group, index) => {
        map[group.id] = index;
    });
    return map;
  }, [studentGroups]);
  
  const alphabeticallySortedStudents = useMemo(() => {
    if (!classroomStudents || Object.keys(allStudentsData).length === 0) return [];
    return [...classroomStudents].sort((a, b) => {
        const studentA = allStudentsData[a.studentId];
        const studentB = allStudentsData[b.studentId];
        const nameA = studentA?.name || '';
        const nameB = studentB?.name || '';
        return nameA.localeCompare(nameB);
    });
  }, [classroomStudents, allStudentsData]);


  const handleSaveAllGrades = useCallback(async () => {
    if (!user || !firestore || Object.keys(localGrades).length === 0 || !hasChanges) return;
  
    setIsSaving(true);
    const batch = writeBatch(firestore);
  
    try {
      for (const [csId, grades] of Object.entries(localGrades)) {
        const studentRef = doc(
          firestore,
          `professors/${user.uid}/courses/${courseId}/classrooms/${classroomId}/classroomStudents/${csId}`
        );
        batch.update(studentRef, { grades });
      }
      
      await batch.commit();
  
      toast({
        title: 'Notas Salvas!',
        description: 'Todas as alterações foram salvas com sucesso.',
      });
      setHasChanges(false);
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
  }, [user, firestore, localGrades, courseId, classroomId, toast, hasChanges]);


  const handleGradeChange = (
    studentOrGroupId: string,
    activityId: string,
    newScore: number,
    isGroup: boolean
  ) => {
    const activity = gradeStructure.find(a => a.id === activityId);
    if (!activity) return;
    
    const score = Math.max(0, Math.min(activity.maxScore, newScore));

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
    setHasChanges(true);
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
    
    const studentsInGroup = classroomStudents.filter(cs => cs.groupId === groupId);
    studentsInGroup.forEach((cs) => {
      const studentRef = doc(firestore, `professors/${user.uid}/courses/${courseId}/classrooms/${classroomId}/classroomStudents/${cs.id}`);
      batch.update(studentRef, { groupId: null });
    });

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
    await updateDoc(studentRef, { groupId: null });
  };
  
  const handleAddStudentToGroup = async (groupId: string, csId: string) => {
     if (!user || !firestore) return;
    const studentRef = doc(firestore, `professors/${user.uid}/courses/${courseId}/classrooms/${classroomId}/classroomStudents/${csId}`);
    await updateDoc(studentRef, { groupId: groupId });
  }

  const handleGroupNameChange = debounce(async (groupId: string, newName: string) => {
    if (!user || !firestore) return;
    const groupRef = doc(firestore, `professors/${user.uid}/courses/${courseId}/classrooms/${classroomId}/groups/${groupId}`);
    await updateDoc(groupRef, { name: newName });
  }, 500);

  const n1Activities = gradeStructure.filter((g) => g.group === 'N1');
  const n2Activities = gradeStructure.filter((g) => g.group === 'N2');
  const modularActivities = gradeStructure.filter((g) =>
    ['ST1', 'ST2', 'Desafio'].includes(g.group)
  );

  const calculateTotals = (grades: Grade[]) => {
    if (!grades) return { n1Total: 0, n2Total: 0, finalGrade: 0, modularTotals: []};

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

  const getExportData = () => {
    const data = classroomStudents.map(cs => {
        const studentInfo = allStudentsData[cs.studentId];
        if (!studentInfo) return null;

        const grades = localGrades[cs.id] || [];
        const totals = calculateTotals(grades);

        const row: Record<string, string | number> = {
            'Nome': studentInfo.name,
            'Email': studentInfo.email,
            'Matrícula': studentInfo.registrationId || 'N/A'
        };

        gradeStructure.forEach(activity => {
            const grade = grades.find(g => g.activityId === activity.id);
            row[activity.name] = grade?.score.toFixed(1) ?? '0.0';
        });

        if (modularActivities.length > 0) {
            totals.modularTotals.forEach(mt => {
                row[`Total ${mt.name}`] = mt.score.toFixed(1);
            });
        } else {
            row['Total N1'] = totals.n1Total.toFixed(1);
            row['Total N2'] = totals.n2Total.toFixed(1);
            row['Nota Final'] = totals.finalGrade.toFixed(1);
        }
        return row;
    }).filter(Boolean);

    // @ts-ignore
    const headers = data.length > 0 ? Object.keys(data[0]) : [];
    // @ts-ignore
    const body = data.map(row => Object.values(row));
    
    return { headers, body };
};

  const exportToCSV = () => {
      const { headers, body } = getExportData();
      if (headers.length === 0) {
          toast({ variant: 'destructive', title: 'Nenhum dado para exportar.' });
          return;
      }
      
      const csvContent = [
          headers.join(','),
          ...body.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', 'notas.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: 'Exportação CSV iniciada.' });
  };

  const exportToPDF = () => {
      const { headers, body } = getExportData();
       if (headers.length === 0) {
          toast({ variant: 'destructive', title: 'Nenhum dado para exportar.' });
          return;
      }

      const doc = new jsPDF({ orientation: 'landscape' });

      autoTable(doc, {
          head: [headers],
          body: body,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [79, 53, 150] } // Primary color
      });

      doc.save('notas.pdf');
      toast({ title: 'Exportação PDF iniciada.' });
  };

  const filteredData = useMemo(() => {
    const lowerCaseFilter = filter.toLowerCase();
    
    if (sortBy === 'alphabetical') {
        return alphabeticallySortedStudents.filter(cs => 
            allStudentsData[cs.studentId]?.name.toLowerCase().includes(lowerCaseFilter)
        );
    }
    
    // Sort by groups
    const filteredGroups = studentGroups
      .map(group => {
        const filteredMembers = group.members.filter(csId => allStudentsData[classroomStudents.find(cs => cs.id === csId)?.studentId || '']?.name.toLowerCase().includes(lowerCaseFilter));
        // Show group if name matches OR if any member matches
        if (group.name.toLowerCase().includes(lowerCaseFilter) || filteredMembers.length > 0) {
          // If group name doesn't match, only show filtered members
          if (!group.name.toLowerCase().includes(lowerCaseFilter)) {
            return { ...group, members: filteredMembers };
          }
          // If group name matches, show all members
          return group;
        }
        return null;
      })
      .filter((g): g is Group & { members: string[] } => g !== null);


    const filteredUngrouped = ungroupedStudents.filter(csId => 
        allStudentsData[classroomStudents.find(cs => cs.id === csId)?.studentId || '']?.name.toLowerCase().includes(lowerCaseFilter)
    );

    return { groups: filteredGroups, ungrouped: filteredUngrouped };

  }, [filter, sortBy, studentGroups, ungroupedStudents, alphabeticallySortedStudents, allStudentsData, classroomStudents]);

    const renderGradeInputs = (studentOrGroupId: string, isGroup: boolean) => {
    const studentIdForGrades = isGroup 
        ? studentGroups.find(g => g.id === studentOrGroupId)?.members[0] 
        : studentOrGroupId;

    if (!studentIdForGrades) return null;

    const grades = localGrades[studentIdForGrades] || [];
    const getGrade = (activityId: string) => grades.find((g) => g.activityId === activityId)?.score ?? 0;

    return (
      <div className="grid grid-cols-2 gap-4 mt-4">
        {gradeStructure.map(activity => (
          <div key={activity.id} className="space-y-2">
            <Label htmlFor={`${studentOrGroupId}-${activity.id}`}>
              {activity.name} <span className="text-muted-foreground">({activity.maxScore.toFixed(1)})</span>
            </Label>
            <Input
              id={`${studentOrGroupId}-${activity.id}`}
              type="number"
              step="0.5"
              min="0"
              max={activity.maxScore}
              value={getGrade(activity.id)}
              onChange={(e) => {
                const newScore = parseFloat(e.target.value) || 0;
                handleGradeChange(studentOrGroupId, activity.id, newScore, isGroup)
              }}
              onBlur={(e) => {
                const newScore = parseFloat(e.target.value) || 0;
                const score = Math.max(0, Math.min(activity.maxScore, newScore));
                 if (newScore !== score) {
                    e.target.value = String(score);
                }
              }}
              className="w-full"
            />
          </div>
        ))}
      </div>
    );
  };
  
    const renderTotals = (studentId: string) => {
        const grades = localGrades[studentId] || [];
        if (!grades || grades.length === 0) return null;
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
        Nenhuma atividade avaliativa foi definida para esta turma.
      </div>
    );
  }
  
  const noStudentsAfterFilter = Array.isArray(filteredData) ? filteredData.length === 0 : (filteredData.groups.length === 0 && filteredData.ungrouped.length === 0);

  const renderGroupView = () => (
     <>
        {(filteredData as { groups: (Group & {members: string[]})[], ungrouped: string[] }).groups.map((group, groupIndex) => {
            const firstStudentId = group.members[0];
            if (!firstStudentId) return null;
            const grades = localGrades[firstStudentId] || [];
            const { n1Total, n2Total, finalGrade } = calculateTotals(grades);
            const colorClass = groupColors[groupIndex % groupColors.length];

            return (
            <React.Fragment key={`group-desktop-${group.id}`}>
                <TableRow className={cn(colorClass, 'font-semibold')}>
                    <TableCell className={cn("sticky left-0 z-10 font-semibold", colorClass)}>
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
                              onChange={(e) => {
                                const newScore = parseFloat(e.target.value) || 0;
                                handleGradeChange(group.id, activity.id, newScore, true);
                              }}
                              onBlur={(e) => {
                                const newScore = parseFloat(e.target.value) || 0;
                                const score = Math.max(0, Math.min(activity.maxScore, newScore));
                                if (newScore !== score) {
                                    e.target.value = String(score);
                                }
                              }}
                              className="w-20 mx-auto text-center"
                            />
                        </TableCell>
                    ))}
                    <TableCell className="font-semibold text-center">{n1Total.toFixed(1)}</TableCell>
                    <TableCell className="font-semibold text-center">{n2Total.toFixed(1)}</TableCell>
                    <TableCell className="font-bold text-primary text-center">{finalGrade.toFixed(1)}</TableCell>
                </TableRow>
                {group.members.map(csId => {
                   const student = allStudentsData[classroomStudents.find(cs => cs.id === csId)?.studentId || ''];
                   const studentGrades = localGrades[csId] || [];
                   const { n1Total, n2Total, finalGrade } = calculateTotals(studentGrades);
                   return(
                    <TableRow key={csId} className={cn(colorClass, "bg-opacity-50")}>
                       <TableCell className={cn("sticky left-0 z-10 pl-8", colorClass)}>
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
                <TableRow className={cn(colorClass)}>
                  <TableCell className={cn("sticky left-0 z-10 pl-8 py-1", colorClass)}>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 bg-background">
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
                              {allStudentsData[classroomStudents.find(cs => cs.id === csId)?.studentId || '']?.name || 'Aluno sem nome'}
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
        {(filteredData as { groups: Group[], ungrouped: string[] }).ungrouped.map((csId) => {
             const student = allStudentsData[classroomStudents.find(cs => cs.id === csId)?.studentId || ''];
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
                               onBlur={(e) => {
                                const newScore = parseFloat(e.target.value) || 0;
                                const score = Math.max(0, Math.min(activity.maxScore, newScore));
                                if (newScore !== score) {
                                    e.target.value = String(score);
                                }
                              }}
                              className="w-20 mx-auto text-center"
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
  );

  const renderAlphabeticalView = () => (
    <>
      {(filteredData as ClassroomStudent[]).map((cs) => {
        const student = allStudentsData[cs.studentId];
        if (!student) return null;
        const grades = localGrades[cs.id] || [];
        const { n1Total, n2Total, finalGrade } = calculateTotals(grades);

        const groupIndex = cs.groupId ? groupColorMap[cs.groupId] : -1;
        const colorClass = groupIndex !== -1 ? groupColors[groupIndex % groupColors.length] : '';

        return (
          <TableRow key={cs.id} className={cn(colorClass)}>
            <TableCell className={cn("sticky left-0 z-10 w-[250px]", colorClass ? colorClass : 'bg-background')}>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedStudents.includes(cs.id)}
                  onCheckedChange={(checked) => {
                    setSelectedStudents((prev) =>
                      checked
                        ? [...prev, cs.id]
                        : prev.filter((id) => id !== cs.id)
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
                  onChange={(e) => handleGradeChange(cs.id, activity.id, parseFloat(e.target.value) || 0, false)}
                  onBlur={(e) => {
                    const newScore = parseFloat(e.target.value) || 0;
                    const score = Math.max(0, Math.min(activity.maxScore, newScore));
                    if (newScore !== score) {
                        e.target.value = String(score);
                    }
                  }}
                  className="w-20 mx-auto text-center"
                />
              </TableCell>
            ))}
            <TableCell className="font-semibold text-center">{n1Total.toFixed(1)}</TableCell>
            <TableCell className="font-semibold text-center">{n2Total.toFixed(1)}</TableCell>
            <TableCell className="font-bold text-primary text-center">{finalGrade.toFixed(1)}</TableCell>
          </TableRow>
        );
      })}
    </>
  );


  const renderDesktopView = () => (
     <div className="w-full overflow-x-auto rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 z-20 bg-background/95 backdrop-blur">
            <TableRow>
              <TableHead className="sticky left-0 bg-inherit z-10 w-[250px] min-w-[250px]">
                Aluno / Grupo
              </TableHead>
              {gradeStructure.map((activity) => (
                <TableHead key={activity.id} className="min-w-[120px] text-center">
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
              sortBy === 'groups' ? renderGroupView() : renderAlphabeticalView()
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
            <Accordion type="multiple" className="w-full">
              {(filteredData as ClassroomStudent[]).map((cs) => {
                const student = allStudentsData[cs.studentId];
                if (!student) return null;
                return (
                  <AccordionItem value={cs.id} key={cs.id}>
                    <AccordionTrigger>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                className="mr-2"
                                checked={selectedStudents.includes(cs.id)}
                                onCheckedChange={(checked) => {
                                    setSelectedStudents((prev) =>
                                    checked
                                        ? [...prev, cs.id]
                                        : prev.filter((id) => id !== cs.id)
                                    );
                                }}
                                onClick={(e) => e.stopPropagation()}
                            />
                            <StudentRowDisplay student={student} />
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        {renderGradeInputs(cs.id, false)}
                        {renderTotals(cs.id)}
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
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
                Selecione alunos e clique em "Agrupar" para criar um novo grupo. Clique em "Salvar Notas" para persistir as alterações.
              </p>
            </div>
            <div className="flex items-center gap-2 self-end md:self-center">
              <Button
                onClick={handleCreateGroup}
                disabled={selectedStudents.length === 0}
              >
                <Users className="mr-2 h-4 w-4" />
                Agrupar
              </Button>
              <Button onClick={handleSaveAllGrades} disabled={!hasChanges || isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                 Salvar Notas
              </Button>
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Exportar
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onSelect={exportToCSV}>Exportar para CSV</DropdownMenuItem>
                    <DropdownMenuItem onSelect={exportToPDF}>Exportar para PDF</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtrar por nome do aluno ou grupo..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
                <Label>Organizar por:</Label>
                <RadioGroup defaultValue="groups" onValueChange={(value) => setSortBy(value as any)} className="flex items-center">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="groups" id="r-groups" />
                        <Label htmlFor="r-groups">Grupos</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="alphabetical" id="r-alpha" />
                        <Label htmlFor="r-alpha">Alfabética</Label>
                    </div>
                </RadioGroup>
            </div>
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
