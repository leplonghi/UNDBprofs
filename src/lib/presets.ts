import type { Activity, ClassType } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export const integraPreset: Omit<Activity, 'id' | 'order' | 'active'>[] = [
  { name: 'Análise+Benchmark', maxScore: 2, group: 'N1' },
  { name: 'Solução Preliminar', maxScore: 2, group: 'N1' },
  { name: 'Entrega N1', maxScore: 6, group: 'N1' },
  { name: 'Checks', maxScore: 1, group: 'N2' },
  { name: 'Caderno Técnico', maxScore: 3, group: 'N2' },
  { name: 'Entrega N2', maxScore: 6, group: 'N2' },
];

export const modularPreset: Omit<Activity, 'id' | 'order' | 'active'>[] = [
  { name: 'ST1', maxScore: 10, group: 'ST1' },
  { name: 'Desafio 4.0 ou Case', maxScore: 10, group: 'Desafio' },
  { name: 'ST2', maxScore: 10, group: 'ST2' },
];

export function createActivitiesFromPreset(presetType: ClassType): Activity[] {
    const preset = presetType === 'Integradora' ? integraPreset : modularPreset;
    const newActivities: Activity[] = preset.map((item, index) => ({
        ...item,
        id: uuidv4(),
        order: index,
        active: true,
    }));
    return newActivities;
}
