'use client';
import React from 'react';
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
import { Users, Link, PlusCircle, FileText, ExternalLink } from 'lucide-react';
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
            collection(firestore, 'documents'),
            where('professorId', '==', user.uid),
            where('course', '==', courseId)
        );
    }, [user, firestore, courseId]);

    const { data: documents, isLoading } = useCollection<Document>(documentsQuery);

  return (
    <>
      <AddDocumentDialog isOpen={isAddOpen} onOpenChange={setIsAddOpen} />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Documentos e Links</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setIsAddOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </CardHeader>
        <CardContent>
          <CardDescription>
            Adicione links para avaliações, trabalhos, leituras e outros materiais importantes para a turma.
          </CardDescription>
            {isLoading ? (
                <Skeleton className="h-40 w-full mt-4" />
            ) : !documents || documents.length === 0 ? (
                 <div className="mt-4 border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                    <p>Nenhum documento adicionado para esta disciplina.</p>
                </div>
            ) : (
                <div className="mt-4 rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Tipo</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {documents.map(doc => (
                                <TableRow key={doc.id}>
                                    <TableCell className="font-medium">
                                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline">
                                            {doc.uploadType === 'link' ? <ExternalLink className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                                            {doc.name}
                                        </a>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="capitalize">{doc.documentType}</Badge>
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
      <Card>
        <CardHeader>
          <CardTitle>Nenhuma Turma Encontrada</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Não há nenhuma turma associada a esta disciplina. Você pode criar uma manualmente ou importar um plano de ensino para gerar uma automaticamente.</p>
          <Button className="mt-4">Criar Turma Manualmente</Button>
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
      <div className="flex flex-col gap-6">
        <Tabs defaultValue="students" className="w-full">
           <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 h-auto">
            <TabsTrigger value="students">Alunos</TabsTrigger>
            <TabsTrigger value="grades">Lançamento de Notas</TabsTrigger>
            <TabsTrigger value="resources">Recursos</TabsTrigger>
            <TabsTrigger value="analytics">Análise da Turma</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="mt-6">
            <div className="flex justify-end mb-4">
              <Button onClick={() => setIsStudentUploadOpen(true)}>
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

          <TabsContent value="grades" className="mt-6">
            <StudentGroups
              courseId={courseId}
              classroomId={classroom.id}
              classroomStudents={classroomStudents ?? []}
              isLoading={isLoadingStudents}
              activities={activities}
            />
          </TabsContent>

          <TabsContent value="resources" className="mt-6">
            <ResourcesTab courseId={courseId} />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
             <ClassAnalytics
              classroomStudents={classroomStudents ?? []}
              isLoading={isLoadingStudents}
              activities={activities}
            />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
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
