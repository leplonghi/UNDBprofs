'use client';
import React, { useState, useTransition, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import type { Activity, ClassType } from '@/types';
import { Loader2 } from 'lucide-react';
import { useFirestore, useUser, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';

interface ActivitySettingsProps {
  courseId: string;
  classroomId: string;
  activities: Activity[];
  classType: ClassType;
}

const integraPreset: Omit<Activity, 'id' | 'order' | 'active'>[] = [
  { name: 'Análise+Benchmark', maxScore: 2, group: 'N1' },
  { name: 'Solução Preliminar', maxScore: 2, group: 'N1' },
  { name: 'Entrega N1', maxScore: 6, group: 'N1' },
  { name: 'Checks', maxScore: 1, group: 'N2' },
  { name: 'Caderno Técnico', maxScore: 3, group: 'N2' },
  { name: 'Entrega N2', maxScore: 6, group: 'N2' },
];

const modularPreset: Omit<Activity, 'id' | 'order' | 'active'>[] = [
  { name: 'ST1', maxScore: 10, group: 'ST1' },
  { name: 'Desafio 4.0 ou Case', maxScore: 10, group: 'Desafio' },
  { name: 'ST2', maxScore: 10, group: 'ST2' },
];

export function ActivitySettings({
  courseId,
  classroomId,
  activities,
  classType,
}: ActivitySettingsProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState<ClassType | null>(null);

  const applyPreset = (presetType: ClassType) => {
    if (!user || !firestore) return;

    startTransition(() => {
      const preset =
        presetType === 'Integradora' ? integraPreset : modularPreset;
      const newActivities: Activity[] = preset.map((item, index) => ({
        ...item,
        id: uuidv4(),
        order: index,
        active: true,
      }));

      const classroomRef = doc(
        firestore,
        `professors/${user.uid}/courses/${courseId}/classrooms/${classroomId}`
      );

      updateDocumentNonBlocking(classroomRef, { activities: newActivities });

      toast({
        title: 'Preset Aplicado!',
        description: `O preset de atividades para turma ${presetType} foi aplicado com sucesso.`,
      });
      setShowConfirm(null);
    });
  };
  
  useEffect(() => {
    if (activities.length === 0 && classType) {
        applyPreset(classType);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities, classType]);


  const handleApplyPresetClick = (presetType: ClassType) => {
    if (activities && activities.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Preset já aplicado',
        description: 'Um preset de atividades já existe para esta turma. Para reaplicar, limpe as atividades atuais.',
      });
      return;
    }
    setShowConfirm(presetType);
  };


  const handleToggleActivity = (activityId: string, isActive: boolean) => {
     if (!user || !firestore) return;

     const updatedActivities = activities.map(act => 
        act.id === activityId ? { ...act, active: isActive } : act
     );
     
     const classroomRef = doc(
        firestore,
        `professors/${user.uid}/courses/${courseId}/classrooms/${classroomId}`
      );
      
      updateDocumentNonBlocking(classroomRef, { activities: updatedActivities });
  }

  const renderPresetSummary = (presetType: ClassType) => {
    const preset = presetType === 'Integradora' ? integraPreset : modularPreset;
    return (
      <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
        {preset.map((item) => (
          <li key={item.name}>
            <span className="font-semibold">{item.name}</span> (Max:{' '}
            {item.maxScore} pts, Bloco: {item.group})
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração das Atividades Avaliativas</CardTitle>
        <CardDescription>
          A estrutura de avaliação da sua turma. O preset é aplicado automaticamente com base no tipo da turma.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities && activities.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Atividade</TableHead>
                  <TableHead>Bloco</TableHead>
                  <TableHead>Nota Máxima</TableHead>
                  <TableHead className="text-right">Ativa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.sort((a, b) => a.order - b.order).map((act) => (
                  <TableRow key={act.id}>
                    <TableCell className="font-medium">{act.name}</TableCell>
                    <TableCell><Badge variant="secondary">{act.group}</Badge></TableCell>
                    <TableCell>{act.maxScore}</TableCell>
                    <TableCell className="text-right">
                        <Switch
                            checked={act.active}
                            onCheckedChange={(checked) => handleToggleActivity(act.id, checked)}
                        />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-8 text-center">
            <h3 className="font-semibold">
              Aplicando preset de atividades...
            </h3>
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm text-muted-foreground">
              Aguarde enquanto a estrutura de avaliação para a turma do tipo "{classType}" é criada.
            </p>
          </div>
        )}
      </CardContent>

      <AlertDialog
        open={!!showConfirm}
        onOpenChange={(open) => !open && setShowConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar aplicação do preset?</AlertDialogTitle>
            <AlertDialogDescription>
              A ação a seguir criará o seguinte conjunto de atividades para
              esta turma. Esta ação não pode ser desfeita facilmente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {showConfirm && renderPresetSummary(showConfirm)}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => applyPreset(showConfirm!)}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar e Aplicar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
