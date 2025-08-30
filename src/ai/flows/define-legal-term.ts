'use server';

/**
 * @fileOverview This file defines a Genkit flow for defining a legal term within the context of a document.
 *
 * - defineLegalTerm - An async function that takes a term and document content and returns a definition.
 * - DefineLegalTermInput - The input type for the function.
 * - DefineLegalTermOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import { extractTextFromDataUri } from '@/lib/document-utils';
import {z} from 'genkit';

const DefineLegalTermInputSchema = z.object({
  term: z.string().describe('The legal term to be defined.'),
  documentDataUri: z
    .string()
    .describe(
      'The content of the legal document as a data URI for context.'
    ),
  documentName: z.string().describe('The name of the document file.'),
});
export type DefineLegalTermInput = z.infer<typeof DefineLegalTermInputSchema>;

const DefineLegalTermOutputSchema = z.object({
  definition: z.string().describe('An HTML formatted definition of the term, with citations if applicable.'),
});
export type DefineLegalTermOutput = z.infer<typeof DefineLegalTermOutputSchema>;

export async function defineLegalTerm(input: DefineLegalTermInput): Promise<DefineLegalTermOutput> {
  return defineLegalTermFlow(input);
}

const prompt = ai.definePrompt({
  name: 'defineLegalTermPrompt',
  input: {schema: z.object({
    term: z.string(),
    documentContent: z.string(),
  })},
  output: {schema: DefineLegalTermOutputSchema},
  prompt: `You are a legal dictionary. The user wants to understand a specific term from a legal document.
  
  Term: "{{{term}}}"
  
  First, provide a general definition of the term.
  Then, analyze the provided document to see if the term is used or defined specifically within it. If it is, explain how it's used and cite the relevant section.
  For each citation, add a data-quote attribute to the sup tag containing the exact text from the document being cited. For example: "<p>The contract is valid until June 1, 2024<sup data-quote="the contract is valid until June 1, 2024">1</sup>.</p>"

  Format your output as clean, semantic HTML.
  
  Document for context: {{{documentContent}}}`,
});

const defineLegalTermFlow = ai.defineFlow(
  {
    name: 'defineLegalTermFlow',
    inputSchema: DefineLegalTermInputSchema,
    outputSchema: DefineLegalTermOutputSchema,
  },
  async ({term, documentDataUri, documentName}) => {
    const extractedText = await extractTextFromDataUri(documentDataUri, documentName);
    const {output} = await prompt({
        term,
        documentContent: extractedText,
    });
    return output!;
  }
);
