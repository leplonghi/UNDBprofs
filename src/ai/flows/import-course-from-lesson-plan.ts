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
      'The lesson plan PDF as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // Corrected typo here
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
  prompt: `You are an expert in extracting course information from lesson plans.

  Extract the following information from the lesson plan provided as a PDF document:

  - Course Name
  - Course Code
  - Syllabus
  - Objectives
  - Workload
  - Semester

  Return the information in a structured JSON format.

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
