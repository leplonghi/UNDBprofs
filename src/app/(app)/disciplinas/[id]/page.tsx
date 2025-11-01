'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useDoc,
  useUser,
  useFirestore,
  useMemoFirebase,
  useCollection,
} from '@/firebase';
import type { Course, Classroom } from '@/types';
import { doc, collection } from 'firebase/firestore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

function CourseDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-1/2" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-6 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-20 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}

function ClassroomsList({ courseId }: { courseId: string }) {
  const { user } = useUser();
  const firestore = useFirestore();

  const classroomsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(
      firestore,
      `professors/${user.uid}/courses/${courseId}/classrooms`
    );
  }, [user, firestore, courseId]);

  const { data: classrooms, isLoading } =
    useCollection<Classroom>(classroomsQuery);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Turmas</CardTitle>
        <CardDescription>
          Todas as turmas associadas a esta disciplina.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome da Turma</TableHead>
              <TableHead>Semestre</TableHead>
              <TableHead>Carga Horária</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3}>
                  <Skeleton className="h-10 w-full" />
                </TableCell>
              </TableRow>
            ) : !classrooms || classrooms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  Nenhuma turma encontrada para esta disciplina.
                </TableCell>
              </TableRow>
            ) : (
              classrooms.map((classroom) => (
                <TableRow key={classroom.id}>
                  <TableCell className="font-medium">
                    <Link href={`#`} className="hover:underline">
                      {classroom.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{classroom.semester}</Badge>
                  </TableCell>
                  <TableCell>{classroom.workload}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function CourseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { id } = params;

  const courseDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, `professors/${user.uid}/courses/${id}`);
  }, [user, firestore, id]);

  const { data: course, isLoading } = useDoc<Course>(courseDocRef);

  if (isLoading) {
    return <CourseDetailsSkeleton />;
  }

  if (!course) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-destructive">
          Disciplina não encontrada
        </h1>
        <p className="text-muted-foreground">
          A disciplina que você está procurando não existe ou você não tem
          permissão para vê-la.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">{course.name}</h1>
        <Badge variant="outline">{course.code}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informações Gerais</CardTitle>
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
            {course.competencies && (
              <div>
                <h3 className="font-semibold">Competências</h3>
                <p className="text-muted-foreground">{course.competencies}</p>
              </div>
            )}
            {course.bibliography && (
              <div>
                <h3 className="font-semibold">Bibliografia</h3>
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {course.bibliography}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        <div className="lg:col-span-2">
          <ClassroomsList courseId={course.id} />
        </div>
      </div>
    </div>
  );
}
