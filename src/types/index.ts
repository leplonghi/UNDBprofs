export interface Grade {
    id: string;
    description: string;
    score: number;
    maxScore?: number;
    group?: 'N1' | 'N2';
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
  classSchedule: { date: string; content: string; activity: string }[];
}

export interface Student {
    id: string;
    name: string;
    email: string;
    registrationId?: string | null;
}

export interface ClassroomStudent {
    id: string;
    classroomId: string;
    studentId: string;
    grades?: Grade[];
}

export interface ExtractedStudent {
    name: string;
    email: string;
    registrationId?: string;
    confidence: number;
}
