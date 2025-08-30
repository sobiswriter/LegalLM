export interface Document {
  id: number;
  name: string;
  summary: string;
  content: string; // data URI
  htmlContent?: string; // HTML content for docx
}

export interface Message {
  id: number;
  sender: 'user' | 'ai';
  content: string;
}
