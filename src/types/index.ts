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
