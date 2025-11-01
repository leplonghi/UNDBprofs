'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, ChevronsRight, ArrowLeft } from 'lucide-react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Course } from '@/types';

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.id as string;
  const { user } = useUser();
  const firestore = useFirestore();

  const courseRef = useMemoFirebase(() => {
    if (!user || !firestore || !courseId) return null;
    return doc(firestore, `professors/${user.uid}/courses/${courseId}`);
  }, [user, firestore, courseId]);

  const { data: course, isLoading: isCourseLoading } = useDoc<Course>(courseRef);

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
        <div className='flex items-center gap-4'>
            <Button variant="outline" size="icon" asChild>
                <Link href="/disciplinas">
                    <ArrowLeft className="h-4 w-4" />
                    <span className='sr-only'>Voltar</span>
                </Link>
            </Button>
            <h1 className="text-2xl font-bold text-primary">Detalhes da Disciplina</h1>
        </div>
      </div>

      {course ? (
         <Card>
            <CardHeader>
                <CardTitle>{course.name} ({course.code})</CardTitle>
                 <CardDescription>
                    Esta é a visualização geral da disciplina. As turmas, horários e cronogramas são gerenciados individualmente.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="font-semibold text-lg mb-2">Ementa</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{course.syllabus}</p>
                </div>
                <div>
                    <h3 className="font-semibold text-lg mb-2">Objetivos</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{course.objectives}</p>
                </div>
                <div>
                    <h3 className="font-semibold text-lg mb-2">Competências</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{course.competencies}</p>
                </div>
                
                {course.thematicTree && course.thematicTree.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Árvore Temática</h3>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 overflow-x-auto pb-4">
                      {course.thematicTree.map((step: any, index: number) => (
                        <React.Fragment key={index}>
                          <div className="flex flex-col items-center text-center">
                            <div className="bg-card border rounded-lg shadow-sm p-4 w-48 min-h-[100px] flex flex-col justify-center">
                                <h4 className="font-semibold">{step.name}</h4>
                                <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                            </div>
                          </div>
                          {index < course.thematicTree.length - 1 && (
                            <ChevronsRight className="h-8 w-8 text-muted-foreground hidden md:block" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
                
                {course.bibliography && (
                    <div>
                        <h3 className="font-semibold text-lg mb-2">Bibliografia</h3>
                        <div className="text-muted-foreground space-y-2 whitespace-pre-wrap">
                           {course.bibliography.split('\n').filter((item: string) => item.trim() !== '').map((item: string, index: number) => (
                                <p key={index}>{item}</p>
                            ))}
                        </div>
                    </div>
                )}
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
