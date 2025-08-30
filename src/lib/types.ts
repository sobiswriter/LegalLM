export interface Document {
  id: number;
  name: string;
  summary: string;
  content: string; // data URI
}

export interface Message {
  id: number;
  sender: 'user' | 'ai';
  content: string;
}
