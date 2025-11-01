'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, useDoc, useMemoFirebase, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { CourseClassSchedule } from '@/components/courses/course-class-schedule';
import type { Classroom } from '@/types';


export default function ClassDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const courseId = params.id as string;
    const classroomId = params.turmaId as string;
    const { user } = useUser();
    const firestore = useFirestore();

    const [isDeleting, setIsDeleting] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);

    const classroomRef = useMemoFirebase(() => {
        if (!user || !firestore || !courseId || !classroomId) return null;
        return doc(firestore, `professors/${user.uid}/courses/${courseId}/classrooms/${classroomId}`);
    }, [user, firestore, courseId, classroomId]);

    const { data: classroom, isLoading } = useDoc<Classroom>(classroomRef);

    const handleDelete = async () => {
        if (!classroomRef) return;

        setIsDeleting(true);
        try {
            deleteDocumentNonBlocking(classroomRef);
            toast({
                title: "Turma Excluída",
                description: "A turma foi removida com sucesso.",
            });
            router.push(`/disciplinas/${courseId}`);
        } catch (error) {
            console.error("Error deleting classroom:", error);
            toast({
                variant: "destructive",
                title: "Erro ao Excluir",
                description: "Não foi possível remover a turma. Tente novamente.",
            });
            setIsDeleting(false);
        }
    };
    
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
                 <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-1/3" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-40 w-full" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <>
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

                {classroom && (
                  <Card>
                      <CardContent className="p-6">
                          <CourseClassSchedule classroom={classroom} classroomRef={classroomRef} />
                      </CardContent>
                  </Card>
                )}

                 <Card>
                    <CardHeader>
                        <CardTitle>Zona de Perigo</CardTitle>
                        <CardDescription>
                            A exclusão de uma turma é uma ação permanente e não pode ser desfeita.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="destructive" onClick={() => setIsAlertOpen(true)} disabled={isDeleting}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir Turma
                        </Button>
                    </CardContent>
                </Card>
            </div>
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente a turma 
                            <span className="font-bold"> "{classroom?.name}" </span>
                             e todos os dados associados a ela.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Excluir Permanentemente
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
