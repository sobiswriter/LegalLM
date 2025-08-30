'use server';
/**
 * @fileOverview This file defines a Genkit flow for answering questions about a legal document, providing citations to the source document.
 *
 * - answerQuestionsAboutDocument - An async function that takes a question and document content as input and returns an answer with citations.
 * - AnswerQuestionsAboutDocumentInput - The input type for the answerQuestionsAboutDocument function.
 * - AnswerQuestionsAboutDocumentOutput - The return type for the answerQuestionsAboutDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerQuestionsAboutDocumentInputSchema = z.object({
  question: z.string().describe('The question about the legal document.'),
  documentContent: z.string().describe('The content of the legal document.'),
});
export type AnswerQuestionsAboutDocumentInput = z.infer<typeof AnswerQuestionsAboutDocumentInputSchema>;

const AnswerQuestionsAboutDocumentOutputSchema = z.object({
  answer: z.string().describe('The answer to the question, with citations.'),
});
export type AnswerQuestionsAboutDocumentOutput = z.infer<typeof AnswerQuestionsAboutDocumentOutputSchema>;

export async function answerQuestionsAboutDocument(input: AnswerQuestionsAboutDocumentInput): Promise<AnswerQuestionsAboutDocumentOutput> {
  return answerQuestionsAboutDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerQuestionsAboutDocumentPrompt',
  input: {schema: AnswerQuestionsAboutDocumentInputSchema},
  output: {schema: AnswerQuestionsAboutDocumentOutputSchema},
  prompt: `You are a legal expert. You will answer questions about a legal document.
  When you answer, you must cite the specific parts of the document that support your answer. Use superscript numbers as in footnote to indicate the citation.
  For example: "The contract is valid until June 1, 2024¹."

  Question: {{{question}}}
  Document Content: {{{documentContent}}}`,
});

const answerQuestionsAboutDocumentFlow = ai.defineFlow(
  {
    name: 'answerQuestionsAboutDocumentFlow',
    inputSchema: AnswerQuestionsAboutDocumentInputSchema,
    outputSchema: AnswerQuestionsAboutDocumentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
