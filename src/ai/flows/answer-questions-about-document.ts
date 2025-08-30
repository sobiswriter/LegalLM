'use server';
/**
 * @fileOverview This file defines a Genkit flow for answering questions about a legal document, providing citations to the source document.
 *
 * - answerQuestionsAboutDocument - An async function that takes a question and document content as input and returns an answer with citations.
 * - AnswerQuestionsAboutDocumentInput - The input type for the answerQuestionsAboutDocument function.
 * - AnswerQuestionsAboutDocumentOutput - The return type for the answerQuestionsAboutDocument function.
 */

import {ai} from '@/ai/genkit';
import { extractTextFromDataUri } from '@/lib/document-utils';
import {z} from 'genkit';

const AnswerQuestionsAboutDocumentInputSchema = z.object({
  question: z.string().describe('The question about the legal document.'),
  documentDataUri: z
    .string()
    .describe(
      'The legal document to analyze, as a data URI that must include a MIME type and use Base64 encoding.'
    ),
  documentName: z.string().describe('The name of the document file.'),
});
export type AnswerQuestionsAboutDocumentInput = z.infer<typeof AnswerQuestionsAboutDocumentInputSchema>;

const AnswerQuestionsAboutDocumentOutputSchema = z.object({
  answer: z.string().describe('The answer to the question, with citations, in HTML format.'),
});
export type AnswerQuestionsAboutDocumentOutput = z.infer<typeof AnswerQuestionsAboutDocumentOutputSchema>;

export async function answerQuestionsAboutDocument(input: AnswerQuestionsAboutDocumentInput): Promise<AnswerQuestionsAboutDocumentOutput> {
  return answerQuestionsAboutDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerQuestionsAboutDocumentPrompt',
  input: {schema: z.object({
    question: z.string(),
    documentContent: z.string(),
  })},
  output: {schema: AnswerQuestionsAboutDocumentOutputSchema},
  prompt: `You are a legal expert. You will answer questions based ONLY on the provided legal document.
  Format your output as clean, semantic HTML using <p> tags.
  When you answer, you MUST cite the specific parts of the document that support your answer. 
  For each citation, add a data-quote attribute to the sup tag containing the exact text from the document being cited. For example: "<p>The contract is valid until June 1, 2024<sup data-quote="the contract is valid until June 1, 2024">1</sup>.</p>"

  Question: {{{question}}}
  Document: {{{documentContent}}}`,
});

const answerQuestionsAboutDocumentFlow = ai.defineFlow(
  {
    name: 'answerQuestionsAboutDocumentFlow',
    inputSchema: AnswerQuestionsAboutDocumentInputSchema,
    outputSchema: AnswerQuestionsAboutDocumentOutputSchema,
  },
  async ({ question, documentDataUri, documentName }) => {
    const extractedText = await extractTextFromDataUri(documentDataUri, documentName);
    const {output} = await prompt({
        question,
        documentContent: extractedText,
    });
    return output!;
  }
);
