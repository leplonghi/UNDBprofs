export type ClassType = 'Integradora' | 'Modular';

export interface Grade {
    id: string;
    activityId: string;
    score: number;
}

export interface Activity {
    id: string;
    name: string;
    maxScore: number;
    group: 'N1' | 'N2' | 'ST1' | 'ST2' | 'Desafio' | 'Substitutiva' | 'Final';
    order: number;
    active: boolean;
}

export interface Course {
  id: string;
  professorId: string;
  name: string;
  code: string;
  syllabus: string;
  objectives: string;
  competencies: string;
  thematicTree: { name: string; description: string }[];
  bibliography: string;
}

export interface Classroom {
  id: string;
  courseId: string;
  name: string;
  semester: string;
  workload: string;
  classType: ClassType;
  classSchedule: { date: string; content: string; activity: string }[];
  activities?: Activity[];
}

export interface Student {
    id: string;
    name: string;
    email: string;
    registrationId?: string | null;
}

export interface ClassroomStudent {
    id:string;
    classroomId: string;
    studentId: string;
    grades?: Grade[];
    groupId?: string | null;
}

export interface ExtractedStudent {
    name: string;
    email: string;
    registrationId?: string;
    confidence: number;
}
