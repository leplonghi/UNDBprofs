export interface Course {
  id: string;
  name: string;
  code: string;
  professorId: string;
  syllabus: string;
  objectives: string;
  competencies: string;
  thematicTree: { name: string; description: string }[];
  bibliography: string;
  classSchedule: { date: string; content: string; activity: string }[];
  workload: string;
  semester: string;
}

export interface Classroom {
    id: string;
    courseId: string;
    professorId: string;
    name: string;
    semester: string;
    workload: string;
    classType: string;
    gradingRule: string;
}
