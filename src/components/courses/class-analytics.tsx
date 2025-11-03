'use client';

import React, { useMemo, useState } from 'react';
import type { Activity, ClassroomStudent, Grade, Student, StudentAnalytics } from '@/types';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, getDocs, query as firestoreQuery, where } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { ChartTooltipContent, ChartTooltip, ChartContainer } from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { cn, getStudentSituation } from '@/lib/utils';


const AnalyticsSkeleton = () => (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-80" />
        <Skeleton className="h-96" />
    </div>
)

export function ClassAnalytics({
  classroomStudents,
  isLoading,
  activities,
}: {
  classroomStudents: ClassroomStudent[];
  isLoading: boolean;
  activities: Activity[];
}) {
    const firestore = useFirestore();
    const [allStudentsData, setAllStudentsData] = useState<Record<string, Student>>({});
    const [isStudentDataLoading, setIsStudentDataLoading] = useState(true);

    const gradeStructure = useMemo(
        () => activities.filter((a) => a.active).sort((a, b) => a.order - b.order),
        [activities]
    );

    const n1Activities = gradeStructure.filter((g) => g.group === 'N1');
    const n2Activities = gradeStructure.filter((g) => g.group === 'N2');
    
    const calculateFinalGrade = (grades: Grade[] = []) => {
        const n1Total = Math.min(10, n1Activities.reduce((acc, activity) => {
            const grade = grades.find((g) => g.activityId === activity.id);
            return acc + (grade?.score || 0);
        }, 0));

        const n2Total = Math.min(10, n2Activities.reduce((acc, activity) => {
            const grade = grades.find((g) => g.activityId === activity.id);
            return acc + (grade?.score || 0);
        }, 0));

        return (n1Total + n2Total) / 2;
    };
    
    React.useEffect(() => {
        async function fetchAllStudentData() {
        if (isLoading || classroomStudents.length === 0 || !firestore) {
            setIsStudentDataLoading(!isLoading);
            return;
        }
        setIsStudentDataLoading(true);
        const studentIds = classroomStudents.map(cs => cs.studentId);
        
        const studentPromises = [];
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
    }, [classroomStudents, isLoading, firestore]);

    const analyticsData: StudentAnalytics[] = useMemo(() => {
        if (isStudentDataLoading || Object.keys(allStudentsData).length === 0) return [];
        
        return classroomStudents.map(cs => {
            const studentInfo = allStudentsData[cs.studentId];
            if (!studentInfo) return null;

            const finalGrade = calculateFinalGrade(cs.grades);
            const situation = getStudentSituation(finalGrade);

            return {
                studentId: cs.studentId,
                name: studentInfo.name,
                finalGrade,
                situation,
            }
        }).filter((s): s is StudentAnalytics => s !== null);

    }, [classroomStudents, allStudentsData, isStudentDataLoading]);


    const summaryStats = useMemo(() => {
        if (analyticsData.length === 0) return { average: 0, highest: 0, lowest: 0 };
        const grades = analyticsData.map(s => s.finalGrade);
        return {
            average: grades.reduce((a, b) => a + b, 0) / grades.length,
            highest: Math.max(...grades),
            lowest: Math.min(...grades),
        }
    }, [analyticsData]);

    const gradeDistribution = useMemo(() => {
        const bins = Array.from({ length: 10 }, (_, i) => ({
            range: `${i}-${i + 1}`,
            count: 0,
          }));
        
        analyticsData.forEach(student => {
            const grade = student.finalGrade;
            if (grade >= 10) {
                bins[9].count++;
            } else {
                const binIndex = Math.floor(grade);
                if (bins[binIndex]) {
                    bins[binIndex].count++;
                }
            }
        });
        return bins;
    }, [analyticsData]);

    const situationColors = {
        Aprovado: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20',
        'Prova Final': 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20',
        Reprovado: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20',
    };

    if (isLoading || isStudentDataLoading) {
        return <AnalyticsSkeleton />;
    }

    if (analyticsData.length === 0) {
        return (
            <div className="py-10 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                <p>Nenhum aluno ou nota para analisar.</p>
                <p className="text-sm">Adicione alunos e lance as notas para ver as métricas da turma.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Resumo da Turma</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                    <Card className="p-4">
                        <p className="text-sm font-medium text-muted-foreground">Média Geral</p>
                        <p className="text-3xl font-bold">{summaryStats.average.toFixed(1)}</p>
                    </Card>
                    <Card className="p-4">
                        <p className="text-sm font-medium text-muted-foreground">Maior Nota</p>
                        <p className="text-3xl font-bold">{summaryStats.highest.toFixed(1)}</p>
                    </Card>
                    <Card className="p-4">
                        <p className="text-sm font-medium text-muted-foreground">Menor Nota</p>
                        <p className="text-3xl font-bold">{summaryStats.lowest.toFixed(1)}</p>
                    </Card>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Distribuição de Notas Finais</CardTitle>
                    <CardDescription>
                        Como as notas finais dos alunos estão distribuídas.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <ChartContainer config={{ count: { label: 'Alunos', color: 'hsl(var(--primary))' } }} className="h-[250px] w-full">
                        <BarChart data={gradeDistribution} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="range" tickLine={false} axisLine={false} tickMargin={8} />
                            <YAxis allowDecimals={false} />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                            <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Desempenho dos Alunos</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border max-h-96 overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Aluno</TableHead>
                                    <TableHead className="text-center">Nota Final</TableHead>
                                    <TableHead className="text-right">Situação</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {analyticsData.sort((a,b) => b.finalGrade - a.finalGrade).map(student => (
                                    <TableRow key={student.studentId}>
                                        <TableCell className="font-medium">{student.name}</TableCell>
                                        <TableCell className="text-center font-mono">{student.finalGrade.toFixed(1)}</TableCell>
                                        <TableCell className="text-right">
                                            <Badge className={cn("font-semibold", situationColors[student.situation])}>
                                                {student.situation}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
