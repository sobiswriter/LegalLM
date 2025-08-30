'use server';

import PDFParser from 'pdf2json';
import mammoth from 'mammoth';

// Helper to extract text from a data URI
export const extractTextFromDataUri = async (dataUri: string, fileName: string): Promise<string> => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const base64 = dataUri.substring(dataUri.indexOf(',') + 1);
  const buffer = Buffer.from(base64, 'base64');

  if (extension === 'pdf') {
    return new Promise((resolve, reject) => {
      const pdfParser = new PDFParser();

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

  if (extension === 'docx') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  
  // For .txt and other files, return the decoded content
  return buffer.toString('utf8');
};
