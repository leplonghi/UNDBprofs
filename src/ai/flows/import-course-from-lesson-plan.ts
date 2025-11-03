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
      "The lesson plan PDF as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ImportCourseFromLessonPlanInput = z.infer<
  typeof ImportCourseFromLessonPlanInputSchema
>;

const CompetencySchema = z.object({
    competency: z.string().describe("The name/title of the competency."),
    skills: z.array(z.object({
        skill: z.string().describe("The name/title of the skill."),
        descriptors: z.string().describe("A comma-separated list of descriptors for the skill.")
    })).describe("The list of skills associated with the competency.")
});

const LearningUnitSchema = z.object({
    name: z.string().describe("The name of the learning unit (e.g., 'UA 1')."),
    content: z.string().describe("The content/description of the learning unit."),
});

const ImportCourseFromLessonPlanOutputSchema = z.object({
  courseName: z.string().describe('The name of the course.'),
  courseCode: z.string().describe('The code of the course.'),
  syllabus: z.string().describe('The syllabus of the course (Ementa).'),
  workload: z.string().describe('The workload of the course (Carga Horária).'),
  semester: z.string().describe('The semester of the course'),
  classType: z.enum(['Integradora', 'Modular']).describe('The type of the class, determined by analyzing the course content. Should be "Integradora" for project-based studio disciplines or "Modular" for others.'),
  competencyMatrix: z.array(CompetencySchema).describe("The competency matrix, including skills and descriptors."),
  learningUnits: z.array(LearningUnitSchema).describe("The list of learning units (Unidades de Aprendizagem)."),
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
  bibliography: z.object({
    basic: z.string().describe('The basic bibliography items.'),
    complementary: z.string().describe('The complementary bibliography items.'),
    recommended: z.string().describe('The recommended bibliography items.'),
  }).describe('The bibliography of the course, separated into basic, complementary, and recommended sections. Preserve formatting with line breaks.'),
  classSchedule: z
    .array(
      z.object({
        date: z.string().describe('The date of the class (format: YYYY-MM-DD).'),
        type: z.string().describe('The type of class (e.g., TEÓRICA, PRÁTICA, FERIADO).'),
        topic: z.string().describe('The main topic or unit (e.g., UA I, UA II).'),
        content: z.string().describe('The content or topic of the class.'),
        activity: z.string().describe('The activity planned for the class.'),
        location: z.string().describe('The location of the class (e.g., Sala de Aula, Laboratório).'),
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
  You are a highly meticulous data extraction expert for academic documents from UNDB.
  Your task is to extract all key information from the provided lesson plan PDF and structure it into a JSON format.
  You MUST be as fast and accurate as possible. Transcribe content word-for-word. Do NOT summarize or interpret. DO NOT look for a field named 'Objetivos'.

  **Analysis and Extraction Steps (Follow Precisely):**

  1.  **Extract Key Fields**: Identify and extract the following fields from the document.
      - courseName: The name of the discipline.
      - courseCode: The code of the discipline.
      - syllabus: The "Ementa". Transcribe it exactly as it appears.
      - workload: The "Carga Horária".
      - semester: The "Semestre".

  2.  **Extract Competency Matrix (Matriz de Competências)**:
      - This is a CRITICAL section. Find the table or section labeled "Matriz de Competências e Habilidades".
      - For each "Competência" in the matrix, extract its name.
      - For each "Habilidade" associated with that competency, extract its name.
      - For each "Habilidade", extract the "Descritores" associated with it. This is often a list. Combine them into a single comma-separated string.
      - Structure this into the 'competencyMatrix' array.

  3.  **Extract Learning Units (Unidades de Aprendizagem - UA)**:
      - Find the section detailing the "Unidades de Aprendizagem".
      - For each unit (e.g., "UA 1", "UA 2"), extract its 'name' and its 'content' (the description of the unit).
      - Structure this into the 'learningUnits' array.

  4.  **Extract Thematic Tree (Árvore Temática)**:
      - This section describes the project stages or thematic units.
      - For each item in the tree, extract its 'name' (the title of the stage) and 'description'.
      - If this section is not present, return an empty array.

  5.  **Extract Bibliography (Bibliografia)**:
      - This is a CRITICAL step. You MUST identify three distinct sections: "Básica", "Complementar", and "Recomendada".
      - For each section, extract the full text content, including all numbering, author names, titles, and formatting.
      - **CRITICAL**: You MUST preserve the original line breaks (\n) within each bibliography section. Do not merge lines. The output for each bibliography field must be a single string containing the full, formatted text of that section.
      - If a section (e.g., "Recomendada") is not found, its corresponding JSON field must be an empty string.

  6.  **Extract Class Schedule (Cronograma de Aulas)**:
      - Go through the class schedule table meticulously, day by day.
      - For each class entry, you MUST extract:
        - 'date': The date of the class. Standardize to YYYY-MM-DD format.
        - 'type': The type of class (e.g., TEÓRICA, PRÁTICA, FERIADO).
        - 'topic': The main topic or unit (e.g., UA I, UA II).
        - 'content': The detailed subject or content of the class. Transcribe it completely.
        - 'activity': The activity planned for that class. Transcribe it completely.
        - 'location': The location of the class (e.g., Sala de Aula, Laboratório).
      - If a day is marked as a holiday ('Feriado'), set the content to 'Feriado' and the type to 'FERIADO'.
      - If this section is not present, return an empty array.

  7.  **Determine classType (Critical Classification)**:
      - This is a mandatory field. You must analyze the document to classify the discipline.
      - **Rule 1 (Highest Priority):** If the course name (courseName) contains the word "Estúdio", you MUST classify it as **"Integradora"**.
      - **Rule 2:** If Rule 1 does not apply, analyze the document's content (syllabus, activities). If the discipline is heavily project-based, described as a "Studio", or shows a clear project development cycle (e.g., analysis, preliminary solution, final delivery), you MUST set classType to **"Integradora"**.
      - **Rule 3:** For all other traditional or theoretical disciplines, set classType to **"Modular"**.
      - You MUST provide a value for classType. Default to "Modular" ONLY if you are absolutely uncertain after applying all rules.

  **Final Output Instructions**:
  - Be extremely faithful to the original text. Do not invent, summarize, or alter any content.
  - If any field or section is not present in the document, leave the corresponding JSON field as an empty string or an empty array for lists.
  - The final output must be a clean, complete, and perfectly structured JSON, ready for automatic system integration.

  Lesson Plan Document: {{media url=lessonPlanDataUri}}`,
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
