'use server';

/**
 * @fileOverview This file defines a Genkit flow for identifying risks and key clauses in a legal document.
 *
 * - identifyRisksAndClauses - An async function that takes document content and returns an analysis.
 * - IdentifyRisksAndClausesInput - The input type for the function.
 * - IdentifyRisksAndClausesOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import { extractTextFromDataUri } from '@/lib/document-utils';
import {z} from 'genkit';

const IdentifyRisksAndClausesInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      'The content of the legal document as a data URI (e.g., data:application/pdf;base64,...).'
    ),
  documentName: z.string().describe('The name of the document file.'),
});
export type IdentifyRisksAndClausesInput = z.infer<typeof IdentifyRisksAndClausesInputSchema>;

const IdentifyRisksAndClausesOutputSchema = z.object({
  analysis: z.string().describe('An HTML formatted analysis of risks and key clauses, with citations.'),
});
export type IdentifyRisksAndClausesOutput = z.infer<typeof IdentifyRisksAndClausesOutputSchema>;

export async function identifyRisksAndClauses(input: IdentifyRisksAndClausesInput): Promise<IdentifyRisksAndClausesOutput> {
  return identifyRisksAndClausesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyRisksAndClausesPrompt',
  input: {schema: z.object({ documentContent: z.string() })},
  output: {schema: IdentifyRisksAndClausesOutputSchema},
  prompt: `You are a meticulous legal analyst. Analyze the provided document to identify potential legal risks, important obligations, and critical clauses.
  
  For each finding, provide a clear explanation and cite the relevant part of the document.
  For each citation, add a data-quote attribute to the sup tag containing the exact text from the document being cited. For example: "<p>The contract is valid until June 1, 2024<sup data-quote="the contract is valid until June 1, 2024">1</sup>.</p>"
  
  Structure your output as clean, semantic HTML with <h3> for sections (e.g., "Potential Risks", "Key Clauses") and <p> for descriptions.
  
  Document: {{{documentContent}}}`,
});

const identifyRisksAndClausesFlow = ai.defineFlow(
  {
    name: 'identifyRisksAndClausesFlow',
    inputSchema: IdentifyRisksAndClausesInputSchema,
    outputSchema: IdentifyRisksAndClausesOutputSchema,
  },
  async ({documentDataUri, documentName}) => {
    const extractedText = await extractTextFromDataUri(documentDataUri, documentName);
    const {output} = await prompt({ documentContent: extractedText });
    return output!;
  }
);
