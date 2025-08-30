'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a summary of a legal document.
 *
 * - generateDocumentSummary - A function that takes a document data URI as input and returns a summary of the document.
 * - GenerateDocumentSummaryInput - The input type for the generateDocumentSummary function.
 * - GenerateDocumentSummaryOutput - The return type for the generateDocumentSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Helper to extract text from a data URI
const extractTextFromDataUri = (dataUri: string, fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const base64 = dataUri.substring(dataUri.indexOf(',') + 1);
  const decoded = Buffer.from(base64, 'base64').toString('utf8');

  if (extension === 'pdf') {
    // In a real implementation, you would use a PDF parsing library.
    // For this simulation, we'll return a placeholder for PDFs.
    console.log("PDF detected. Using placeholder text extraction.");
    return `[Text extracted from ${fileName}] ... ` + decoded.substring(0, 4000);
  }
  
  // For .txt and other files, return the decoded content
  return decoded;
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

const extractTextTool = ai.defineTool(
    {
        name: 'extractTextTool',
        description: 'Extracts plain text from a document provided as a data URI.',
        inputSchema: z.object({ 
            dataUri: z.string(),
            fileName: z.string()
        }),
        outputSchema: z.string(),
    },
    async ({ dataUri, fileName }) => extractTextFromDataUri(dataUri, fileName)
);


const prompt = ai.definePrompt({
  name: 'generateDocumentSummaryPrompt',
  input: {schema: GenerateDocumentSummaryInputSchema},
  output: {schema: GenerateDocumentSummaryOutputSchema},
  tools: [extractTextTool],
  prompt: `You are a highly skilled legal assistant. Your task is to summarize legal documents.
The user has uploaded a document named {{{documentName}}}. First, use the extractTextTool to get the text content.
Then, provide a concise summary of its key components (e.g., Parties, Term, Key Obligations, and Risks). 
Format your output as clean, semantic HTML using <p> and <h3> tags.
For every piece of information you provide, you MUST cite the relevant section by adding a superscript number like a footnote.`,
});

const generateDocumentSummaryFlow = ai.defineFlow(
  {
    name: 'generateDocumentSummaryFlow',
    inputSchema: GenerateDocumentSummaryInputSchema,
    outputSchema: GenerateDocumentSummaryOutputSchema,
  },
  async (input) => {
    const llmResponse = await prompt(input);
    const toolRequest = llmResponse.toolRequest();
    
    if (!toolRequest || toolRequest.tool.name !== 'extractTextTool') {
        throw new Error('Expected the model to use the extractTextTool.');
    }

    const toolResponse = await toolRequest.run();

    const finalResponse = await llmResponse.continue(toolResponse);
    return finalResponse.output!;
  }
);
