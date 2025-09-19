import PDFParser from 'pdf2json';
import mammoth from 'mammoth';
import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import sharp from 'sharp';


// On Node server, run pdf.js without a worker to avoid worker setup issues.
// We'll pass `disableWorker: true` when calling getDocument.

async function extractTextFromPDFPage(page: any, scale = 2.0): Promise<string> {
  try {
    // First try to extract text directly; suppress noisy pdf.js warnings during this call
    const originalWarn = console.warn;
    try {
      console.warn = () => {};
    } catch {}
    const textContent = await page.getTextContent();
    try {
      console.warn = originalWarn;
    } catch {}
    const extractedText = textContent.items
      .filter((item: any) => typeof item.str === 'string' && item.str.trim().length > 0)
      .map((item: any) => item.str)
      .join(' ');
    
    // If we got meaningful text, return it
    if (extractedText && extractedText.trim().length > 30) {
      return extractedText;
    }

    // If no text found, try OCR
    const viewport = page.getViewport({ scale });
    const canvasFactory = {
      create: function(width: number, height: number) {
        return {
          width,
          height,
          style: {},
          getContext: function() {
            return {
              drawImage: () => {},
              getImageData: () => ({ data: new Uint8Array(width * height * 4) }),
              putImageData: () => {}
            };
          }
        };
      },
      reset: function() {},
      destroy: function() {}
    };

    // Render page to a virtual canvas
    await page.render({
      canvasFactory,
      viewport
    }).promise;
    
    // Generate image data from rendered page
    const pageData = await page.render({ canvasFactory, viewport }).promise;
    const width = Math.round(viewport.width);
    const height = Math.round(viewport.height);
    
    // Create a buffer from the raw image data
    const imageData = new Uint8Array(width * height * 4);
    const pngBuffer = await sharp(imageData, {
      raw: {
        width,
        height,
        channels: 4
      }
    })
    .png()
    .resize(width, height, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .modulate({ brightness: 1.1, saturation: 1.0, lightness: 1.1 }) // Enhance contrast
    .sharpen({ sigma: 1.5 }) // Sharpen the image
    .toBuffer();

    // Perform OCR on the image
    const worker = await createWorker('eng');
    const { data: { text: ocrText } } = await worker.recognize(pngBuffer);
    await worker.terminate();

    return ocrText || '';
  } catch (error) {
    console.error('Error in extractTextFromPDFPage:', error);
    return '';
  }
}


// Helper to extract text from a data URI
export const extractTextFromDataUri = async (dataUri: string, fileName: string): Promise<string> => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const base64 = dataUri.substring(dataUri.indexOf(',') + 1);
  const buffer = Buffer.from(base64, 'base64');

  if (extension === 'pdf') {
    try {
      // Load PDF document without worker (server-side)
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer), disableWorker: true } as any);
      const pdf = await loadingTask.promise;
        
      // Process first 5 pages or all pages if less than 5
      const numPages = Math.min(pdf.numPages, 5);
      const textPromises = [];
        
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        textPromises.push(extractTextFromPDFPage(page));
      }
        
      // Get text from all processed pages
      const texts = await Promise.all(textPromises);
      const combinedText = texts.join(' ').trim();
        
      if (!combinedText) {
        throw new Error('Could not extract text from this PDF. It may be heavily encrypted or damaged.');
      }
      
      const cleanedText = combinedText.replace(/\s+/g, ' ');

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
