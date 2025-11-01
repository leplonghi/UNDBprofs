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
    registrationId: z.string().optional().describe("The student's registration ID or number, if available."),
    confidence: z.number().min(0).max(1).describe("A confidence score from 0.0 to 1.0 on the accuracy of the extracted data.")
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
  You are a meticulous data analysis assistant specializing in academic documents.
  Your task is to extract a list of students from the provided document (image or PDF) with high accuracy.

  Follow these steps carefully:
  1.  **Analyze Structure**: First, analyze the document's structure. Identify columns, headers (like "Name", "Email", "ID", "Registration"), and data patterns.
  2.  **Extract Data**: For each student listed, extract the following information:
      *   **Full Name**: Combine first and last names if they are in separate columns.
      *   **Email Address**: Find the student's email.
      *   **Registration ID**: Look for a student ID, registration number, or matrícula. If it's not present, leave it blank.
  3.  **Validate and Score Confidence**:
      *   Review each extracted record. Is the name a plausible name? Is the email a valid email format?
      *   Assign a **confidence score** from 0.0 (very uncertain) to 1.0 (very certain) for each student record. Base the score on the clarity of the document, the consistency of the data, and whether all expected fields were found. For example, if a name is smudged or an email is clearly just another name, the confidence should be low.
  4.  **Format Output**: Structure the final output as a JSON object containing a 'students' array. Each object in the array must have 'name', 'email', 'registrationId' (optional), and 'confidence' fields.

  **CRITICAL INSTRUCTIONS**:
  - Do NOT confuse a name with an email. If a field that should be an email looks like a name, the confidence score for that record must be very low (e.g., 0.2).
  - Be as accurate as possible. It is better to have a low confidence score than to present incorrect data as certain.

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
