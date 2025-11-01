'use client';
import React, { useState, useTransition } from 'react';
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
import { createActivitiesFromPreset, integraPreset, modularPreset } from '@/lib/presets';

interface ActivitySettingsProps {
  courseId: string;
  classroomId: string;
  activities: Activity[];
  classType: ClassType;
}

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
      const newActivities = createActivitiesFromPreset(presetType);

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

  const handleApplyPresetClick = (presetType: ClassType) => {
    if (activities && activities.length > 0) {
        setShowConfirm(presetType);
    } else {
        applyPreset(presetType);
    }
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
          Gerencie a estrutura de avaliação da sua turma. Use os presets para começar rapidamente.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex items-center gap-2'>
            <Button onClick={() => handleApplyPresetClick('Integradora')} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Aplicar Preset Integradora
            </Button>
            <Button onClick={() => handleApplyPresetClick('Modular')} disabled={isPending} variant="secondary">
                 {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Aplicar Preset Modular
            </Button>
        </div>

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
              Nenhuma atividade avaliativa definida.
            </h3>
            <p className="text-sm text-muted-foreground">
              Aplique um dos presets acima para gerar a estrutura de avaliação para esta turma.
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
            <AlertDialogTitle>Reaplicar o preset?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá sobrescrever a estrutura de atividades atual. As notas já lançadas podem ser perdidas. Deseja continuar?
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
              Confirmar e Reaplicar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
