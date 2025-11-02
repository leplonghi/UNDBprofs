'use client';

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

export interface Bibliography {
    basic: string;
    complementary: string;
    recommended: string;
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
  bibliography: Bibliography;
  semester?: string;
}

export interface ClassScheduleItem {
    date: string;
    type: string;
    topic: string;
    content: string;
    activity: string;
    location: string;
}

export interface Classroom {
  id: string;
  courseId: string;
  name: string;
  semester: string;
  workload: string;
  classType: ClassType;
  classSchedule: ClassScheduleItem[];
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

export interface Group {
    id: string;
    name: string;
    classroomId: string;
}


export interface ExtractedStudent {
    name: string;
    email: string;
    registrationId?: string;
    confidence: number;
}

export interface AcademicEvent {
    id: string;
    professorId: string;
    courseId: string;
    name: string;
    dateTime: string; // ISO 8601 format
    description: string;
}
