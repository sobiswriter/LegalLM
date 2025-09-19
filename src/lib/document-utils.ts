'use server';

import mammoth from 'mammoth';

// Helper to extract text from a data URI
export const extractTextFromDataUri = async (dataUri: string, fileName: string): Promise<string> => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const base64 = dataUri.substring(dataUri.indexOf(',') + 1);
  const buffer = Buffer.from(base64, 'base64');

  if (extension === 'docx') {
    try {
      const result = await mammoth.extractRawText({ buffer });
      if (!result.value || result.value.trim().length < 30) {
        throw new Error('Could not extract usable text from this DOCX file.');
      }
      return result.value;
    } catch (error) {
       console.error('Error extracting DOCX text:', error);
       throw new Error('Could not process this DOCX file.');
    }
  }
  
  // For .txt and other files, return the decoded content
  try {
    const text = buffer.toString('utf8');
    if (!text || text.trim().length < 10) {
      throw new Error('Could not extract usable text from this file.');
    }
    return text;
  } catch (error) {
    console.error('Error extracting text:', error);
    throw new Error('Could not process this file.');
  }
};
