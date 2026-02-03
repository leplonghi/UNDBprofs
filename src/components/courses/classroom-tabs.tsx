'use client';
import React, { useMemo } from 'react';
import {
  useUser,
  useFirestore,
  useMemoFirebase,
  useCollection,
} from '@/firebase';
import type { Classroom, ClassroomStudent, Activity, Document } from '@/types';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  PlusCircle, 
  FileText, 
  ExternalLink, 
  GraduationCap, 
  BarChart3, 
  Settings2, 
  Library,
  Info
} from 'lucide-react';
import { StudentUploadDialog } from '@/components/courses/student-upload-dialog';
import { ClassroomStudentsTable } from '@/components/courses/classroom-students-table';
import { StudentGroups } from '@/components/courses/student-groups';
import { Badge } from '@/components/ui/badge';
import { ClassAnalytics } from './class-analytics';
import { ActivitySettings } from './activity-settings';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/card';
import { AddDocumentDialog } from '../documents/add-document-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

function ResourcesTab({ courseId }: { courseId: string }) {
    const [isAddOpen, setIsAddOpen] = React.useState(false);
    const { user } = useUser();
    const firestore = useFirestore();

    const documentsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, `professors/${user.uid}/documents`),
            where('course', '==', courseId)
        );
    }, [user, firestore, courseId]);

    const { data: documents, isLoading } = useCollection<Document>(documentsQuery);

  return (
    <>
      <AddDocumentDialog isOpen={isAddOpen} onOpenChange={setIsAddOpen} courseId={courseId} />
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="flex flex-row items-center justify-between px-0">
          <div>
            <CardTitle className="text-xl">Biblioteca da Disciplina</CardTitle>
            <CardDescription>Links, materiais de apoio e referências salvas para esta turma.</CardDescription>
          </div>
          <Button variant="outline" onClick={() => setIsAddOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Link
          </Button>
        </CardHeader>
        <CardContent className="px-0">
            {isLoading ? (
                <Skeleton className="h-40 w-full mt-4" />
            ) : !documents || documents.length === 0 ? (
                 <div className="mt-4 border-2 border-dashed rounded-xl p-12 text-center text-muted-foreground bg-muted/20">
                    <Library className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="font-medium">Nenhum recurso compartilhado</p>
                    <p className="text-sm">Comece adicionando links para aulas ou materiais complementares.</p>
                </div>
            ) : (
                <div className="mt-4 rounded-xl border bg-background shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead>Material</TableHead>
                                <TableHead className="w-[150px]">Tipo</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {documents.map(doc => (
                                <TableRow key={doc.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-medium">
                                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-primary transition-colors">
                                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                                {doc.uploadType === 'link' ? <ExternalLink className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                                            </div>
                                            {doc.name}
                                        </a>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="capitalize px-3 py-1 rounded-full">{doc.documentType}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </CardContent>
      </Card>
    </>
  );
}

function ClassroomHeader({ classroom, studentCount }: { classroom: Classroom, studentCount: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-primary/5 border-primary/10 shadow-sm">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary">
                        <Users className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total de Alunos</p>
                        <p className="text-2xl font-bold">{studentCount}</p>
                    </div>
                </CardContent>
            </Card>
            <Card className="bg-accent/5 border-accent/10 shadow-sm">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-accent/10 text-accent-foreground">
                        <Info className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo de Turma</p>
                        <p className="text-2xl font-bold">{classroom.classType}</p>
                    </div>
                </CardContent>
            </Card>
            <Card className="bg-muted/5 border-muted/10 shadow-sm">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-muted/20 text-muted-foreground">
                        <GraduationCap className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Semestre Vigente</p>
                        <p className="text-2xl font-bold">{classroom.semester}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}


export function ClassroomTabs({
  courseId,
  courseCode,
}: {
  courseId: string;
  courseCode: string;
}) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isStudentUploadOpen, setIsStudentUploadOpen] = React.useState(false);

  const classroomQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(
        firestore,
        `professors/${user.uid}/courses/${courseId}/classrooms`
      )
    );
  }, [user, firestore, courseId]);

  const { data: classrooms, isLoading: isLoadingClassrooms } =
    useCollection<Classroom>(classroomQuery);

  const classroom = classrooms?.[0];
  const classroomId = classroom?.id;

  const studentsQuery = useMemoFirebase(() => {
    if (!user || !firestore || !classroomId) return null;
    return collection(
      firestore,
      `professors/${user.uid}/courses/${courseId}/classrooms/${classroomId}/classroomStudents`
    );
  }, [user, firestore, courseId, classroomId]);

  const { data: classroomStudents, isLoading: isLoadingStudents } =
    useCollection<ClassroomStudent>(studentsQuery);

  if (isLoadingClassrooms) {
    return <Skeleton className="h-60 w-full" />;
  }

  if (!classroom) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Configuração Pendente</CardTitle>
          <CardDescription>Não há nenhuma turma associada a esta disciplina.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6 text-sm">Uma turma é necessária para gerenciar alunos, notas e cronogramas. Você pode criar uma automaticamente ao importar um Plano de Ensino ou adicionar uma manualmente.</p>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Criar Turma Manualmente
          </Button>
        </CardContent>
      </Card>
    );
  }

  const activities: Activity[] = classroom.activities || [];

  return (
    <>
      <StudentUploadDialog
        isOpen={isStudentUploadOpen}
        onOpenChange={setIsStudentUploadOpen}
        classroomId={classroom.id}
        courseId={courseId}
      />
      <div className="flex flex-col gap-2">
        
        <ClassroomHeader 
            classroom={classroom} 
            studentCount={classroomStudents?.length || 0} 
        />

        <Tabs defaultValue="grades" className="w-full">
           <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 h-auto p-1 bg-muted/50 rounded-xl mb-6">
            <TabsTrigger value="grades" className="rounded-lg py-2.5 data-[state=active]:shadow-sm">
                <GraduationCap className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Diário de Notas</span>
                <span className="sm:hidden">Notas</span>
            </TabsTrigger>
            <TabsTrigger value="students" className="rounded-lg py-2.5 data-[state=active]:shadow-sm">
                <Users className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Alunos</span>
                <span className="sm:hidden">Alunos</span>
            </TabsTrigger>
            <TabsTrigger value="resources" className="rounded-lg py-2.5 data-[state=active]:shadow-sm">
                <Library className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Recursos</span>
                <span className="sm:hidden">Links</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-lg py-2.5 data-[state=active]:shadow-sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Análise</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg py-2.5 data-[state=active]:shadow-sm">
                <Settings2 className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Configurar</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="grades" className="mt-0 outline-none">
            <StudentGroups
              courseId={courseId}
              classroomId={classroom.id}
              classroomStudents={classroomStudents ?? []}
              isLoading={isLoadingStudents}
              activities={activities}
            />
          </TabsContent>

          <TabsContent value="students" className="mt-0 outline-none">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Gestão de Estudantes</h3>
              <Button onClick={() => setIsStudentUploadOpen(true)} size="sm">
                <Users className="mr-2 h-4 w-4" />
                Adicionar Alunos
              </Button>
            </div>
            <ClassroomStudentsTable
              courseId={courseId}
              classroomId={classroom.id}
              classroomStudents={classroomStudents ?? []}
              isLoading={isLoadingStudents}
            />
          </TabsContent>

          <TabsContent value="resources" className="mt-0 outline-none">
            <ResourcesTab courseId={courseId} />
          </TabsContent>

          <TabsContent value="analytics" className="mt-0 outline-none">
             <ClassAnalytics
              classroomStudents={classroomStudents ?? []}
              isLoading={isLoadingStudents}
              activities={activities}
            />
          </TabsContent>

          <TabsContent value="settings" className="mt-0 outline-none">
             <ActivitySettings
                courseId={courseId}
                classroomId={classroom.id}
                activities={activities}
                classType={classroom.classType}
             />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
