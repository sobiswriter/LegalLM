export interface Document {
  id: number;
  name: string;
  summary: string;
  content: string; // Base64 encoded content
}

export interface Message {
  id: number;
  sender: 'user' | 'ai';
  content: string;
}
