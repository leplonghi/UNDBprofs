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
  thematicTree: z.string().describe('The thematic tree of the course.'),
  bibliography: z.string().describe('The bibliography of the course.'),
  classSchedule: z.string().describe('The class schedule of the course.'),
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
  OBJETIVO

A leitura deve identificar automaticamente:

Dados gerais da disciplina e do professor.

Estrutura das Unidades de Aprendizagem (UAs).

Cronograma de aulas com datas e contextos.

Atividades avaliativas e respectivas pontuações.

Bibliografia básica e complementar.

Dados administrativos (CH, curso, semestre, coordenação, aprovação, etc.).

2. ESTRUTURA DE SAÍDA ESPERADA

Organize os dados encontrados em uma estrutura JSON.

3. REGRAS DE INTERPRETAÇÃO

Datas abreviadas (ex: 04/08/25) -> converter para formato completo: 2025-08-04.

Siglas de avaliação:

ST = Somativa Teórica (Apresentação ou Entrega Final)

FT = Formativa Técnica (Relatórios, pranchas, processos)

AV QUALIS = Avaliação Parcial Intermediária

N1 e N2:

N1 corresponde à primeira metade do semestre.

N2 à segunda metade, geralmente culminando na entrega final.

Feriados: manter a data e descrição exatamente como no documento.

Códigos: se não constarem, deixar o campo vazio.

CH Total: deve ser o somatório das cargas horárias das UAs.

Manter acentuação e formatação original.

Excluir legendas repetidas, mas manter subtítulos que indiquem mudança de seção.

Não resumir nem alterar textos técnicos.

✅ Instrução final:

Extraia tudo o que for relevante do plano de ensino mantendo fidelidade total aos textos originais, e organize conforme a estrutura.
Cada campo deve estar completo, inteligível e coerente, pronto para integração automática no sistema acadêmico.

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
