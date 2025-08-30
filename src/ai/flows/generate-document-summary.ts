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
import PDFParser from 'pdf2json';


// Helper to extract text from a data URI
const extractTextFromDataUri = async (dataUri: string, fileName: string): Promise<string> => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const base64 = dataUri.substring(dataUri.indexOf(',') + 1);
  const buffer = Buffer.from(base64, 'base64');

  if (extension === 'pdf') {
    return new Promise((resolve, reject) => {
      const pdfParser = new PDFParser(this, 1);

      pdfParser.on("pdfParser_dataError", (errData: any) => {
        console.error(errData.parserError);
        reject(new Error('Error parsing PDF'));
      });

      pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
        const text = pdfParser.getRawTextContent();
        resolve(text);
      });

      pdfParser.parseBuffer(buffer);
    });
  }
  
  // For .txt and other files, return the decoded content
  return buffer.toString('utf8');
};


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
  return generateDocumentSummaryFlow(input);
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

Provide a concise summary of its key components (e.g., Parties, Term, Key Obligations, and Risks). 
Format your output as clean, semantic HTML using <p> and <h3> tags.
For every piece of information you provide, you MUST cite the relevant section by adding a superscript number and a data-quote attribute containing the exact text from the document being cited. For example: <sup data-quote="This is the exact text being cited.">1</sup>`,
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
