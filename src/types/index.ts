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

export interface Competency {
    competency: string;
    ch?: string;
    skills: {
        skill: string;
        descriptors: string;
    }[];
}

export interface LearningUnit {
    name: string;
    content: string;
}

export interface Course {
  id: string;
  professorId: string;
  name: string;
  code: string;
  syllabus: string;
  competencies: string;
  learningUnits: LearningUnit[];
  competencyMatrix: Competency[];
  thematicTree: { name: string; description: string }[];
  bibliography: Bibliography;
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
  year: string;
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

export type DocumentType = 'aula expositiva' | 'atividade em grupo' | 'avaliação' | 'projeto' | 'estudo de caso' | 'extensão' | 'guia' | 'outro';


export interface Document {
    id: string;
    professorId: string;
    authorName: string;
    course: string;
    discipline: string;
    documentType: DocumentType;
    uploadType: 'link';
    name: string;
    description: string;
    fileUrl: string;
    createdAt: string; // ISO 8601 string
    views: number;
    favorites: number;
}

export interface AcademicEvent {
    id: string;
    professorId: string;
    courseId: string;
    name: string;
    dateTime: string; // ISO 8601 format
    description: string;
    type?: 'aniversario' | 'academico';
}

export type StudentSituation = 'Aprovado' | 'Prova Final' | 'Reprovado';

export interface StudentAnalytics {
    studentId: string;
    name: string;
    finalGrade: number;
    situation: StudentSituation;
}

// Community Module Types
export type IdeaStatus = 'nova' | 'em_analise' | 'implementada';

export interface Idea {
  id: string;
  title: string;
  description: string;
  category: string;
  status: IdeaStatus;
  authorId: string;
  authorName: string;
  course: string;
  createdAt: string; // ISO 8601 string
  updatedAt: string; // ISO 8601 string
  supportCount: number;
  commentCount?: number;
}

export interface IdeaSupport {
  id?: string; // Document ID will be the userId
  supportedAt: string; // ISO 8601 string
}

export interface IdeaComment {
  id?: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string; // ISO 8601 string
}

export type ForumThreadType = 'Estúdio' | 'Turmas correlatas' | 'Tema transversal' | 'Apoio pedagógico' | 'Outro';

export interface ForumThread {
    id: string;
    title: string;
    description: string;
    type: ForumThreadType;
    participantIds: string[];
    authorId: string;
    authorName: string;
    course: string;
    createdAt: string; // ISO 8601
    lastActivityAt: string; // ISO 8601
    participantCount: number;
}

export interface ForumReply {
    id: string;
    authorId: string;
    authorName: string;
    text: string;
    createdAt: string; // ISO 8601
}
