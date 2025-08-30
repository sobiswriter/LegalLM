export interface Document {
  id: number;
  name: string;
  summary: string;
  responses: {
    [key: string]: string;
  };
}

export interface Message {
  id: number;
  sender: 'user' | 'ai';
  content: string;
}
