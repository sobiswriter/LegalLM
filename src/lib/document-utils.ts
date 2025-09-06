import PDFParser from 'pdf2json';
import mammoth from 'mammoth';

// Helper to extract text from a data URI
export const extractTextFromDataUri = async (dataUri: string, fileName: string): Promise<string> => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const base64 = dataUri.substring(dataUri.indexOf(',') + 1);
  const buffer = Buffer.from(base64, 'base64');

  if (extension === 'pdf') {
    // For PDFs, use the new API endpoint with advanced extraction
    try {
      // Try standard PDF parsing first
      let basicText = '';
      try {
        basicText = await new Promise((resolve, reject) => {
          const pdfParser = new PDFParser();
          pdfParser.on("pdfParser_dataError", (errData: any) => reject(new Error('Error parsing PDF')));
          pdfParser.on("pdfParser_dataReady", () => resolve(pdfParser.getRawTextContent()));
          pdfParser.parseBuffer(buffer);
        });
      } catch (e) {
        console.log('Basic PDF parsing failed, trying advanced extraction...');
      }

      // If basic parsing worked and got enough text, return it
      if (basicText && basicText.trim().length >= 30) {
        return basicText;
      }

      // If basic parsing failed, try advanced extraction
      const formData = new FormData();
      const blob = new Blob([buffer], { type: 'application/pdf' });
      formData.append('file', blob, fileName);

      const url = new URL('/api/extract-text', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002');
      const response = await fetch(url.toString(), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Failed to extract text from PDF');
      }

      const { text, error } = await response.json();
      if (error) throw new Error(error);
      
      // Clean up the extracted text
      const cleanedText = text.trim().replace(/\s+/g, ' ');
      
      if (!cleanedText || cleanedText.length < 30) {
        throw new Error('Could not extract usable text from this PDF. It may be encrypted, damaged, or contain no text content.');
      }

      return cleanedText;
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      throw new Error('Could not extract usable text from this PDF. It may be scanned or image-based. Please try again.');
    }
  }

  if (extension === 'docx') {
    const result = await mammoth.extractRawText({ buffer });
    if (!result.value || result.value.trim().length < 30) {
      throw new Error('Could not extract usable text from this DOCX file.');
    }
    return result.value;
  }
  // For .txt and other files, return the decoded content
  const text = buffer.toString('utf8');
  if (!text || text.trim().length < 10) {
    throw new Error('Could not extract usable text from this file.');
  }
  return text;
};
