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
  courseName: z.string().describe('The name of the course, extracted from the "UNIDADE CURRICULAR" field.').optional(),
  courseCode: z.string().describe('The code of the course.').optional(),
  syllabus: z.string().describe('The syllabus of the course (Ementa).').optional(),
  objectives: z.string().describe('The objectives of the course (Objetivos). Transcribe it exactly as it appears.').optional(),
  competencies: z.string().describe('The general competencies of the course (Competências).').optional(),
  workload: z.string().describe('The workload of the course (Carga Horária).').optional(),
  semester: z.string().describe('The semester of the course').optional(),
  classType: z.enum(['Integradora', 'Modular']).describe('The type of the class, determined by analyzing the course content. Should be "Integradora" for project-based studio disciplines or "Modular" for others.').optional(),
  competencyMatrix: z.array(CompetencySchema).describe("The competency matrix, including skills and descriptors.").optional(),
  learningUnits: z.array(LearningUnitSchema).describe("The list of learning units (Unidades de Aprendizagem).").optional(),
  thematicTree: z
    .array(
      z.object({
        name: z.string().describe('The name of the process stage.'),
        description: z
          .string()
          .describe('A brief description of the stage.'),
      })
    )
    .describe('The thematic tree or project process steps of the course.').optional(),
  bibliography: z.object({
    basic: z.string().describe('The basic bibliography items.').optional(),
    complementary: z.string().describe('The complementary bibliography items.').optional(),
    recommended: z.string().describe('The recommended bibliography items.').optional(),
  }).describe('The bibliography of the course, separated into basic, complementary, and recommended sections. Preserve formatting with line breaks.').optional(),
  classSchedule: z
    .array(
      z.object({
        date: z.string().describe('The date of the class (format: YYYY-MM-DD). If not present, this should be an empty string.'),
        type: z.string().describe('The type of class (e.g., TEÓRICA, PRÁTICA, FERIADO). This corresponds to the HABILIDADES column in the document.'),
        topic: z.string().describe('The main topic or unit (e.g., I - Teoria e Método). This corresponds to the UNIDADE DE APRENDIZAGEM column.'),
        content: z.string().describe('The content or topic of the class. This corresponds to the DESCRITORES column.'),
        activity: z.string().describe('The activity planned for the class. This corresponds to the column after DESCRITORES.'),
        location: z.string().describe('The location of the class (e.g., Sala de Aula, Laboratório). If not present, this should be an empty string.'),
      })
    )
    .describe('A structured list of class schedule events, extracted from the main table of the document.').optional(),
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
  You MUST be as fast and accurate as possible. Transcribe content word-for-word. Do NOT summarize or interpret.

  **Analysis and Extraction Steps (Follow Precisely):**

  1.  **Extract Key Fields**: Identify and extract the following fields from the document.
      - courseName: The name of the discipline, which is located in the "UNIDADE CURRICULAR" field.
      - courseCode: The code of the discipline. If not present, leave it empty.
      - syllabus: The "Ementa". Transcribe it exactly as it appears.
      - objectives: The "Objetivos". Transcribe it exactly as it appears.
      - competencies: The general text block under the title "COMPETÊNCIAS". Transcribe it exactly as it appears.
      - workload: The "Carga Horária".
      - semester: The "Semestre".

  2.  **Extract Competency Matrix (Matriz de Competências)**:
      - This is a CRITICAL section. Find the table or section labeled "Matriz de Competências". This matrix contains the general "Ementa" and "Competências" fields, but also a more detailed breakdown.
      - For each "Competência" in the matrix (the individual competency items, not the general text block), extract its name.
      - For each "Habilidade" associated with that competency, extract its name.
      - For each "Habilidade", extract the "Descritores" associated with it. This is often a list. Combine them into a single comma-separated string.
      - Structure this into the 'competencyMatrix' array. If this section is not present, return an empty array.
  
  3.  **Extract Learning Units (Unidades de Aprendizagem - This is the main table)**:
      - This is a separate task from extracting the class schedule. Find the section detailing the "Unidades de Aprendizagem" and their content descriptions.
      - For each unit (e.g., "UA 1", "UA 2"), extract its 'name' and its 'content' (the description of the unit).
      - Structure this into the 'learningUnits' array. If this section is not present, return an empty array.

  4.  **Extract Class Schedule (Main Content Table)**:
      - This is the most detailed part of the document. Go through the table that has columns like "UNIDADE DE APRENDIZAGEM", "HABILIDADES", "DESCRITORES", and a column with activities and times.
      - For each row in this table, you MUST extract:
        - 'topic': The content from the "UNIDADE DE APRENDIZAGEM" column (e.g., "I - Teoria e Método").
        - 'type': The content from the "HABILIDADES" column (e.g., "- Interpretação crítica da legislação...").
        - 'content': The content from the "DESCRITORES" column.
        - 'activity': The content from the column to the right of "DESCRITORES", which contains the list of activities (e.g., "Leitura orientada & debate...").
        - 'date': The date of the class. If there is no date column, leave this as an empty string.
        - 'location': The location of the class. If there is no location column, leave this as an empty string.
      - You MUST extract every single row from this detailed schedule table.

  5.  **Extract Thematic Tree (Árvore Temática)**:
      - This section describes the project stages or thematic units.
      - For each item in the tree, extract its 'name' (the title of the stage) and 'description'.
      - If this section is not present, return an empty array.

  6.  **Extract Bibliography (Bibliografia)**:
      - This is a CRITICAL step. You MUST identify three distinct sections: "Básica", "Complementar", and "Recomendada".
      - For each section, extract the full text content, including all numbering, author names, titles, and formatting.
      - **CRITICAL**: You MUST preserve the original line breaks (\\n) within each bibliography section. Do not merge lines. The output for each bibliography field must be a single string containing the full, formatted text of that section.
      - If a section (e.g., "Recomendada") is not found, its corresponding JSON field must be an empty string.

  7.  **Determine classType (Critical Classification)**:
      - This is a mandatory field. You must analyze the document to classify the discipline.
      - **Rule 1 (Highest Priority):** If the course name (courseName) contains the word "Estúdio", you MUST classify it as **"Integradora"**.
      - **Rule 2:** If Rule 1 does not apply, analyze the document's content (syllabus, activities). If the discipline is heavily project-based, described as a "Studio", or shows a clear project development cycle (e.g., analysis, preliminary solution, final delivery), you MUST set classType to **"Integradora"**.
      - **Rule 3:** For all other traditional or theoretical disciplines, set classType to **"Modular"**.
      - You MUST provide a value for classType. Default to "Modular" ONLY if you are absolutely uncertain after applying all rules.

  **Final Output Instructions**:
  - Be extremely faithful to the original text. Do not invent, summarize, or alter any content.
  - If any field or section is not present in the document, you MUST return an empty string, an empty array, or an empty object for the corresponding field.
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
