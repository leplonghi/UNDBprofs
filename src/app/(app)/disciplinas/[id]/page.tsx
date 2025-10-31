'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { id: courseId } = params;

  const courseRef = useMemoFirebase(() => {
    if (!user || !firestore || !courseId) return null;
    return doc(firestore, `professors/${user.uid}/courses/${courseId}`);
  }, [user, firestore, courseId]);

  const { data: course, isLoading: isCourseLoading } = useDoc(courseRef);

  const classesRef = useMemoFirebase(() => {
    if (!user || !firestore || !courseId) return null;
    return collection(firestore, `professors/${user.uid}/courses/${courseId}/classrooms`);
  }, [user, firestore, courseId]);

  const { data: classes, isLoading: areClassesLoading } = useCollection(classesRef);

  if (isCourseLoading) {
    return (
        <div className="flex flex-col gap-6">
            <Skeleton className="h-8 w-1/2" />
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Skeleton className="h-6 w-24 mb-2" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                    <div>
                        <Skeleton className="h-6 w-24 mb-2" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                  <Skeleton className="h-8 w-1/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-12 w-full" />
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Detalhes da Disciplina</h1>
      </div>

      {course ? (
         <Card>
            <CardHeader>
                <CardTitle>{course.name} ({course.code})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h3 className="font-semibold">Ementa</h3>
                    <p className="text-muted-foreground">{course.syllabus}</p>
                </div>
                <div>
                    <h3 className="font-semibold">Objetivos</h3>
                    <p className="text-muted-foreground">{course.objectives}</p>
                </div>
            </CardContent>
        </Card>
      ) : (
          <Card>
              <CardContent><p>Disciplina não encontrada.</p></CardContent>
          </Card>
      )}


      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Turmas</CardTitle>
            <Button variant="outline" size="sm" asChild>
                <Link href={`/disciplinas/${courseId}/turmas/nova`}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nova Turma
                </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {areClassesLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : classes && classes.length > 0 ? (
            <ul className="space-y-2">
                {classes.map(c => (
                    <li key={c.id} className="flex items-center justify-between rounded-md border p-3">
                        <div>
                            <p className="font-medium">{c.name}</p>
                            <p className="text-sm text-muted-foreground">{c.semester} - {c.workload}</p>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={`/disciplinas/${courseId}/turmas/${c.id}`}>
                                Gerenciar
                            </Link>
                        </Button>
                    </li>
                ))}
            </ul>
          ) : (
            <p>Nenhuma turma cadastrada para esta disciplina.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
