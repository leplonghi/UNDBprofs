'use server';
/**
 * @fileOverview Imports a course from a lesson plan PDF using AI.
 *
 * - importCourseFromLessonPlan - A function that handles the course import process.
 * - ImportCourseFromLessonPlanInput - The input type for the importCourseFromLessonPlan function.
 * - ImportCourseFromLessonPlanOutput - The return type for the importCourseFromLessonPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImportCourseFromLessonPlanInputSchema = z.object({
  lessonPlanDataUri: z
    .string()
    .describe(
      'The lesson plan PDF as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
});
export type ImportCourseFromLessonPlanInput = z.infer<
  typeof ImportCourseFromLessonPlanInputSchema
>;

const ImportCourseFromLessonPlanOutputSchema = z.object({
  courseName: z.string().describe('The name of the course.'),
  courseCode: z.string().describe('The code of the course.'),
  syllabus: z.string().describe('The syllabus of the course.'),
  objectives: z.string().describe('The objectives of the course.'),
  workload: z.string().describe('The workload of the course'),
  semester: z.string().describe('The semester of the course'),
  competencies: z.string().describe('The competencies of the course.'),
  thematicTree: z
    .array(
      z.object({
        name: z.string().describe('The name of the process stage.'),
        description: z
          .string()
          .describe('A brief description of the stage.'),
      })
    )
    .describe('The thematic tree or project process steps of the course.'),
  bibliography: z.string().describe('The bibliography of the course.'),
  classSchedule: z
    .array(
      z.object({
        date: z.string().describe('The date of the class (format: YYYY-MM-DD).'),
        content: z.string().describe('The content or topic of the class.'),
        activity: z.string().describe('The activity planned for the class.'),
      })
    )
    .describe('A structured list of class schedule events.'),
});
export type ImportCourseFromLessonPlanOutput = z.infer<
  typeof ImportCourseFromLessonPlanOutputSchema
>;

export async function importCourseFromLessonPlan(
  input: ImportCourseFromLessonPlanInput
): Promise<ImportCourseFromLessonPlanOutput> {
  return importCourseFromLessonPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'importCourseFromLessonPlanPrompt',
  input: {schema: ImportCourseFromLessonPlanInputSchema},
  output: {schema: ImportCourseFromLessonPlanOutputSchema},
  prompt: `
  You are an expert in academic document analysis.
  Your task is to extract key information from the provided lesson plan PDF and structure it into a JSON format.

  Identify and extract the following fields:
  - courseName
  - courseCode
  - syllabus
  - objectives
  - workload
  - semester
  - competencies
  - thematicTree
  - bibliography
  - classSchedule

  Please be as faithful as possible to the original text. Do not summarize or alter technical content.
  If a field is not present in the document, leave the corresponding JSON field empty.
  The final output must be a clean and complete JSON, ready for automatic integration into an academic system.

  Lesson Plan: {{media url=lessonPlanDataUri}}`,
});

const importCourseFromLessonPlanFlow = ai.defineFlow(
  {
    name: 'importCourseFromLessonPlanFlow',
    inputSchema: ImportCourseFromLessonPlanInputSchema,
    outputSchema: ImportCourseFromLessonPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
