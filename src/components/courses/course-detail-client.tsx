'use client';
import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
import {
  useDoc,
  useUser,
  useFirestore,
  useMemoFirebase,
  useCollection,
} from '@/firebase';
import type { Course, Classroom, ClassScheduleItem } from '@/types';
import { doc, collection, query } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Edit, ArrowLeft, HelpCircle } from 'lucide-react';
import { ClassroomTabs } from '@/components/courses/classroom-tabs';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { format, parseISO } from 'date-fns';
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

const thematicTreeColors = [
    'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800',
    'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800',
    'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800',
];

function CourseInformation({
  course,
  classroom,
}: {
  course: Course;
  classroom: Classroom | undefined;
}) {
  const router = useRouter();
  const { user } = useUser();

   const learningUnitsWithDetails = useMemo(() => {
    if (!course.learningUnits || !course.competencyMatrix) return [];

    return course.learningUnits.map((unit, index) => {
        const competency = course.competencyMatrix?.[index];
        const skills = competency?.skills || [];
        
        let chHabilidades = 0;
        const descritoresComCH = skills.flatMap(skill => 
            (skill.descriptors || '').split('\n').map(line => {
                const match = line.match(/\s\((\d+)h\)$/);
                const ch = match ? parseInt(match[1], 10) : 0;
                chHabilidades += ch;
                return {
                    text: match ? line.replace(match[0], '').trim() : line.trim(),
                    ch: ch > 0 ? `${ch}h` : ''
                };
            }).filter(d => d.text) // Filter out empty lines
        );
        
        return {
            unitName: unit.name,
            habilidades: competency?.competency || 'Habilidade não extraída',
            chHabilidades: competency?.ch || `${chHabilidades}h`,
            descritores: descritoresComCH,
        };
    });
  }, [course]);

  const totalCH = useMemo(() => {
    return learningUnitsWithDetails.reduce((total, unit) => {
        const chValue = parseInt(unit.chHabilidades, 10);
        return total + (isNaN(chValue) ? 0 : chValue);
    }, 0);
  }, [learningUnitsWithDetails]);


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Visualização do Plano de Ensino</CardTitle>
            <CardDescription>
              Dados extraídos e salvos do documento PDF.
            </CardDescription>
          </div>
          <Button
            variant="default"
            onClick={() => router.push(`/disciplinas/${course.id}/editar`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        
        <div className="space-y-0 rounded-lg border overflow-hidden">
             <h2 className="text-center font-bold text-lg bg-gray-200 dark:bg-gray-700 py-2">PLANO DE ENSINO</h2>
            <table className="w-full text-sm border-collapse">
                <tbody>
                    <tr className="border-b">
                        <td className="p-2" colSpan={3}><span className="font-bold">CURSO:</span> ARQUITETURA E URBANISMO</td>
                    </tr>
                    <tr className="border-b">
                        <td className="p-2 border-r w-8/12" colSpan={2}><span className="font-bold">UNIDADE CURRICULAR:</span> {course.name}</td>
                        <td className="p-2 w-4/12"><span className="font-bold">CARGA HORÁRIA:</span> {classroom?.workload}</td>
                    </tr>
                    <tr>
                        <td className="p-2 border-r w-8/12" colSpan={2}><span className="font-bold">PROFESSOR:</span> {user?.displayName}</td>
                        <td className="p-2 w-4/12"><span className="font-bold">SEMESTRE:</span> {classroom?.semester}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div>
             <h2 className="text-center font-bold text-lg bg-gray-200 dark:bg-gray-700 py-2 rounded-t-lg border border-b-0">MATRIZ DE COMPETÊNCIAS</h2>
            <div className="border p-4 space-y-4">
                 <table className="w-full text-sm border-collapse">
                    <tbody>
                        <tr className='border-b'>
                            <td className="p-2 w-1/2 border-r align-top">
                                <h3 className="font-bold mb-2">EMENTA</h3>
                                <p className="text-muted-foreground whitespace-pre-wrap">{course.syllabus}</p>
                            </td>
                            <td className="p-2 w-1/2 align-top">
                                <h3 className="font-bold mb-2">COMPETÊNCIAS</h3>
                                <p className="text-muted-foreground whitespace-pre-wrap">{course.competencies}</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div>
            <Table className="border">
                 <TableHeader className="bg-gray-200 dark:bg-gray-700">
                    <TableRow>
                        <TableHead className="w-1/4 font-bold text-foreground">UNIDADE DE APRENDIZAGEM</TableHead>
                        <TableHead className="w-1/4 font-bold text-foreground">HABILIDADES</TableHead>
                        <TableHead className="w-[80px] font-bold text-foreground text-center">CH</TableHead>
                        <TableHead className="w-2/4 font-bold text-foreground">DESCRITORES</TableHead>
                        <TableHead className="w-[80px] font-bold text-foreground text-center">CH</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {learningUnitsWithDetails.map((unit, unitIndex) => {
                        const totalRowsForUnit = unit.descritores.length > 0 ? unit.descritores.length : 1;
                        return (
                            <React.Fragment key={unitIndex}>
                                {totalRowsForUnit > 0 ? Array.from({ length: totalRowsForUnit }).map((_, descritorIndex) => (
                                    <TableRow key={`${unitIndex}-${descritorIndex}`} className={unitIndex % 2 === 0 ? '' : 'bg-muted/30'}>
                                        {descritorIndex === 0 && (
                                            <>
                                                <TableCell rowSpan={totalRowsForUnit} className="border-r align-top font-semibold">{unit.unitName}</TableCell>
                                                <TableCell rowSpan={totalRowsForUnit} className="border-r align-top whitespace-pre-wrap">{unit.habilidades}</TableCell>
                                                <TableCell rowSpan={totalRowsForUnit} className="border-r align-top text-center">{unit.chHabilidades}</TableCell>
                                            </>
                                        )}
                                        {unit.descritores.length > 0 ? (
                                            <>
                                                <TableCell className="border-r">{unit.descritores[descritorIndex].text}</TableCell>
                                                <TableCell className="text-center">{unit.descritores[descritorIndex].ch}</TableCell>
                                            </>
                                        ) : (
                                            <TableCell className="p-2 border-r align-top text-center text-muted-foreground" colSpan={2}>
                                                Nenhum descritor para esta unidade.
                                            </TableCell>
                                        )}
                                    </TableRow>
                                )) : null}
                            </React.Fragment>
                        )
                    })}
                    <TableRow className="bg-gray-200 dark:bg-gray-700 font-bold">
                        <TableCell colSpan={2} className="text-right">TOTAL CH</TableCell>
                        <TableCell className="text-center">{totalCH}H</TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-center">{totalCH}H</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
        
        {course.thematicTree && course.thematicTree.length > 0 && (
             <div className="space-y-4">
                <h3 className="font-semibold text-xl">Árvore Temática</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {course.thematicTree.map((item, index) => (
                        <Card key={index} className={cn(thematicTreeColors[index % thematicTreeColors.length])}>
                        <CardHeader>
                            <CardTitle className='text-lg'>{item.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                            {item.description}
                            </p>
                        </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )}

        {course.bibliography && (course.bibliography.basic || course.bibliography.complementary || course.bibliography.recommended) && (
          <div>
            <h3 className="font-semibold text-xl mb-4">Bibliografia</h3>
            <div className="rounded-md border">
              <table className="w-full">
                <tbody className='text-sm'>
                  {course.bibliography.basic && (
                    <tr className='border-b'>
                      <td className="w-[150px] p-2 font-medium text-muted-foreground bg-muted/50 align-top">
                        Básica
                      </td>
                      <td className='p-2'>
                        <pre className="whitespace-pre-wrap font-sans">
                          {course.bibliography.basic}
                        </pre>
                      </td>
                    </tr>
                  )}
                  {course.bibliography.complementary && (
                    <tr className='border-b'>
                      <td className="w-[150px] p-2 font-medium text-muted-foreground bg-muted/50 align-top">
                        Complementar
                      </td>
                      <td className='p-2'>
                        <pre className="whitespace-pre-wrap font-sans">
                          {course.bibliography.complementary}
                        </pre>
                      </td>
                    </tr>
                  )}
                  {course.bibliography.recommended && (
                    <tr>
                      <td className="w-[150px] p-2 font-medium text-muted-foreground bg-muted/50 align-top">
                        Recomendada
                      </td>
                      <td className='p-2'>
                        <pre className="whitespace-pre-wrap font-sans">
                          {course.bibliography.recommended}
                        </pre>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {classroom?.classSchedule && classroom.classSchedule.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <h2 className="text-center font-bold text-lg bg-gray-200 dark:bg-gray-700 py-2 border-b">CRONOGRAMA DE AULAS</h2>
            <div className="overflow-x-auto">
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead className="w-[150px]">Data</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Tópico</TableHead>
                          <TableHead>Conteúdo</TableHead>
                          <TableHead>Atividade</TableHead>
                          <TableHead>Local</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {classroom.classSchedule.map((item, index) => {
                          const dateIsValid = item.date && !isNaN(parseISO(item.date).getTime());
                          return (
                            <TableRow key={index}>
                                <TableCell className="w-[150px]">
                                    {dateIsValid ? format(parseISO(item.date), 'dd/MM/yyyy') : 'N/A'}
                                </TableCell>
                                <TableCell>{item.type}</TableCell>
                                <TableCell>{item.topic}</TableCell>
                                <TableCell className="whitespace-pre-wrap">{item.content}</TableCell>
                                <TableCell className="whitespace-pre-wrap">{item.activity}</TableCell>
                                <TableCell>{item.location}</TableCell>
                            </TableRow>
                          )
                      })}
                  </TableBody>
              </Table>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}

function DisciplineTutorial() {
    return (
        <Card className="animated-gradient-background">
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="tutorial" className="border-b-0">
                    <CardHeader className="flex-row items-start justify-between">
                         <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <HelpCircle className="h-5 w-5 text-primary" />
                                Guia Rápido da Disciplina
                            </CardTitle>
                        </div>
                        <AccordionTrigger className="text-sm font-semibold p-2 -mr-2 -mt-1 ml-4 whitespace-nowrap">
                            Mostrar/Ocultar Guia
                        </AccordionTrigger>
                    </CardHeader>
                    <AccordionContent className="px-6 pb-4">
                        <Accordion type="multiple" className="w-full space-y-2">
                             <AccordionItem value="plano-ensino" className="border rounded-md px-4 bg-background/50">
                                <AccordionTrigger className="py-3 font-semibold">1. Guia do Plano de Ensino</AccordionTrigger>
                                <AccordionContent className="pt-2 space-y-2 text-sm text-muted-foreground">
                                    <p>Esta aba contém todos os dados que foram extraídos do seu Plano de Ensino em PDF. É uma visualização fiel do documento oficial.</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li><strong>Editar Dados:</strong> Se precisar corrigir ou atualizar qualquer informação, clique no botão <span className="font-bold text-foreground">"Editar"</span>. Você será levado a um formulário onde todos os campos podem ser modificados, incluindo o cronograma detalhado de aulas.</li>
                                        <li><strong>Re-importar com IA:</strong> No modo de edição, você pode usar a opção "Re-importar com IA" para enviar um novo PDF e preencher o formulário com dados atualizados, facilitando a correção.</li>
                                    </ul>
                                </AccordionContent>
                             </AccordionItem>
                             <AccordionItem value="gerenciamento-turma" className="border rounded-md px-4 bg-background/50">
                                <AccordionTrigger className="py-3 font-semibold">2. Guia de Gerenciamento da Turma</AccordionTrigger>
                                <AccordionContent className="pt-2 space-y-4 text-sm text-muted-foreground">
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-foreground">Aba "Alunos"</h4>
                                        <p>Para adicionar alunos, clique em <span className="font-bold text-foreground">"Adicionar Alunos"</span> e escolha um método:</p>
                                        <ul className="list-disc pl-5 space-y-1">
                                            <li><strong>Importar CSV (Recomendado):</strong> Baixe a lista de participantes do UNDB Classroom e envie o arquivo CSV aqui. O sistema adicionará apenas os estudantes automaticamente.</li>
                                            <li><strong>Extrair com IA:</strong> Envie um PDF ou imagem com a lista de alunos (nome, e-mail) e a IA tentará extrair os dados para você revisar e salvar.</li>
                                        </ul>
                                    </div>
                                     <div className="space-y-2">
                                        <h4 className="font-semibold text-foreground">Aba "Lançamento de Notas"</h4>
                                        <p>Esta é a sua planilha de notas inteligente.</p>
                                        <ul className="list-disc pl-5 space-y-1">
                                            <li><strong>Lançar Notas:</strong> Digite as notas diretamente nas células. As notas <span className="font-bold text-foreground">não</span> são salvas automaticamente; clique em <span className="font-bold text-foreground">"Salvar Notas"</span>.</li>
                                            <li><strong>Criar Grupos:</strong> Marque a caixa de seleção ao lado dos alunos e clique em <span className="font-bold text-foreground">"Agrupar"</span>. Ao lançar a nota para o cabeçalho do grupo, ela será replicada para todos os membros.</li>
                                            <li><strong>Exportar:</strong> Use o botão "Exportar" para baixar a planilha de notas em formato CSV ou PDF.</li>
                                        </ul>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-foreground">Outras Abas</h4>
                                        <ul className="list-disc pl-5 space-y-1">
                                            <li><strong>Recursos:</strong> Adicione e acesse links para materiais, vídeos e documentos importantes para a disciplina.</li>
                                            <li><strong>Análise da Turma:</strong> Visualize gráficos e estatísticas sobre o desempenho dos alunos.</li>
                                            <li><strong>Configurações:</strong> Defina a estrutura de avaliação da turma aplicando os presets (Modular/Integradora) ou personalizando as atividades.</li>
                                        </ul>
                                    </div>
                                </AccordionContent>
                             </AccordionItem>
                        </Accordion>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </Card>
    );
}

export function CourseDetailClient({ courseId }: { courseId: string }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const courseDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, `professors/${user.uid}/courses/${courseId}`);
  }, [user, firestore, courseId]);

  const { data: course, isLoading: isCourseLoading } =
    useDoc<Course>(courseDocRef);

  const classroomQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(
        firestore,
        `professors/${user.uid}/courses/${courseId}/classrooms`
      )
    );
  }, [user, firestore, courseId]);

  const { data: classrooms, isLoading: areClassroomsLoading } =
    useCollection<Classroom>(classroomQuery);

  const classroom = classrooms?.[0];

  if (isCourseLoading || areClassroomsLoading) {
    return <CourseDetailsSkeleton />;
  }

  if (!course) {
    return (
      <div className="flex flex-col gap-6">
         <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold text-destructive">
            Disciplina não encontrada
            </h1>
        </div>
        <p className="text-muted-foreground">
          A disciplina que você está procurando não existe ou você não tem
          permissão para vê-la.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className='flex-grow flex items-center justify-between'>
            <h1 className="text-2xl font-bold text-primary">{course.name}</h1>
            <Badge variant="outline">{course.code}</Badge>
        </div>
      </div>
      
      <DisciplineTutorial />

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="info">Plano de Ensino</TabsTrigger>
          <TabsTrigger value="classroom">Gerenciamento da Turma</TabsTrigger>
        </TabsList>
        <TabsContent value="info" className="mt-6">
          <CourseInformation course={course} classroom={classroom} />
        </TabsContent>
        <TabsContent value="classroom" className="mt-6">
          <ClassroomTabs courseId={course.id} courseCode={course.code} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
