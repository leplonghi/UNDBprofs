'use server';
/**
 * @fileOverview Extracts a list of students from a document using AI.
 *
 * - extractStudentsFromDocument - A function that handles the student extraction process.
 * - ExtractStudentsFromDocumentInput - The input type for the function.
 * - ExtractStudentsFromDocumentOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractStudentsFromDocumentInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "A document (PDF or image) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractStudentsFromDocumentInput = z.infer<
  typeof ExtractStudentsFromDocumentInputSchema
>;

const StudentSchema = z.object({
    name: z.string().describe("The full name of the student."),
    email: z.string().describe("The email address of the student."),
});

const ExtractStudentsFromDocumentOutputSchema = z.object({
    students: z.array(StudentSchema).describe("An array of students extracted from the document.")
});

export type ExtractStudentsFromDocumentOutput = z.infer<
  typeof ExtractStudentsFromDocumentOutputSchema
>;
export type ExtractedStudent = z.infer<typeof StudentSchema>;


export async function extractStudentsFromDocument(
  input: ExtractStudentsFromDocumentInput
): Promise<ExtractStudentsFromDocumentOutput> {
  return extractStudentsFromDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractStudentsFromDocumentPrompt',
  input: { schema: ExtractStudentsFromDocumentInputSchema },
  output: { schema: ExtractStudentsFromDocumentOutputSchema },
  prompt: `
  You are an expert in analyzing academic documents and lists.
  Your task is to extract all student names and their corresponding email addresses from the provided document (image or PDF).

  - Identify each student listed in the document.
  - For each student, extract their full name and their email address.
  - Structure the output as a JSON object containing a 'students' array. Each object in the array should have a 'name' and 'email' field.
  - Be as accurate as possible. If an email is not present for a student, you may need to infer it based on a common pattern if one is obvious, but prefer leaving it empty if uncertain. If a name is unclear, do your best to transcribe it.

  Document: {{media url=documentDataUri}}`,
});

const extractStudentsFromDocumentFlow = ai.defineFlow(
  {
    name: 'extractStudentsFromDocumentFlow',
    inputSchema: ExtractStudentsFromDocumentInputSchema,
    outputSchema: ExtractStudentsFromDocumentOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
