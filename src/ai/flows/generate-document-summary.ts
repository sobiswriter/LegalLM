'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a summary of a legal document.
 *
 * - generateDocumentSummary - A function that takes a document data URI as input and returns a summary of the document.
 * - GenerateDocumentSummaryInput - The input type for the generateDocumentsummary function.
 * - GenerateDocumentSummaryOutput - The return type for the generateDocumentSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { extractTextFromDataUri } from '@/lib/document-utils';

const GenerateDocumentSummaryInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      'The legal document to summarize, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
  documentName: z.string().describe('The name of the document file.'),
});
export type GenerateDocumentSummaryInput = z.infer<typeof GenerateDocumentSummaryInputSchema>;

const GenerateDocumentSummaryOutputSchema = z.object({
  summary: z.string().describe('A summary of the legal document, formatted as HTML.'),
});
export type GenerateDocumentSummaryOutput = z.infer<typeof GenerateDocumentSummaryOutputSchema>;

export async function generateDocumentSummary(input: GenerateDocumentSummaryInput): Promise<GenerateDocumentSummaryOutput> {
  try {
    return await generateDocumentSummaryFlow(input);
  } catch (err: any) {
    return {
      summary: `<h3>Summary of ${input.documentName}</h3><p class='text-destructive'>${err?.message || 'Could not extract usable text from this document. Please upload a text-based file.'}</p>`
    };
  }
}

const summaryPrompt = ai.definePrompt({
  name: 'summaryPrompt',
  input: {
    schema: z.object({
      documentName: z.string(),
      documentContent: z.string(),
    }),
  },
  output: {schema: GenerateDocumentSummaryOutputSchema},
  prompt: `You are a highly skilled legal assistant. Your task is to summarize legal documents.
The user has uploaded a document named {{{documentName}}}. 
The content of the document is:
{{{documentContent}}}

Your output MUST start with an <h3> title tag, like this: "<h3>Summary of {{{documentName}}}</h3>".
After the title, provide a concise summary of its key components (e.g., Parties, Term, Key Obligations, and Risks).
Format the body of the summary as clean, semantic HTML using <p> tags.
For every piece of information you provide, you MUST cite the relevant section by adding a superscript number.
For each citation, you MUST add a 'data-quote' attribute to the superscript tag containing the exact text from the document being cited.
Crucially, do NOT include the quoted text in the main body of the summary itself. Only the superscript number should be visible in the flow of the text.

For example, a correct citation looks like this: <p>The contract is valid until June 1, 2024<sup data-quote="the contract is valid until June 1, 2024">1</sup>.</p>
A WRONG citation looks like this: <p>The contract is valid until June 1, 2024, "the contract is valid until June 1, 2024" [1].</p>`,
});


const generateDocumentSummaryFlow = ai.defineFlow(
  {
    name: 'generateDocumentSummaryFlow',
    inputSchema: GenerateDocumentSummaryInputSchema,
    outputSchema: GenerateDocumentSummaryOutputSchema,
  },
  async ({documentDataUri, documentName}) => {
    
    const extractedText = await extractTextFromDataUri(documentDataUri, documentName);

    const {output} = await summaryPrompt({
      documentName,
      documentContent: extractedText,
    });

    return output!;
  }
);
