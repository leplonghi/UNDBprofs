'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function ClassDetailPage({ params: { id: courseId, turmaId: classroomId } }: { params: { id: string, turmaId: string } }) {
    const { user } = useUser();
    const firestore = useFirestore();

    const classroomRef = useMemoFirebase(() => {
        if (!user || !firestore || !courseId || !classroomId) return null;
        return doc(firestore, `professors/${user.uid}/courses/${courseId}/classrooms/${classroomId}`);
    }, [user, firestore, courseId, classroomId]);

    const { data: classroom, isLoading } = useDoc(classroomRef);
    
    if(isLoading) {
        return (
            <div className="flex flex-col gap-6">
                <Skeleton className="h-8 w-1/2" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-1/3" />
                        <Skeleton className="h-4 w-full" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-10 w-1/4" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-bold text-primary">Gerenciar Turma: {classroom?.name}</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Detalhes da Turma</CardTitle>
                    <CardDescription>
                        Informações sobre a turma específica.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {classroom ? (
                        <div className="space-y-2">
                           <p><strong>Semestre:</strong> {classroom.semester}</p>
                           <p><strong>Carga Horária:</strong> {classroom.workload}</p>
                           <p><strong>Tipo:</strong> {classroom.classType}</p>
                        </div>
                    ): (
                        <p>Turma não encontrada.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
