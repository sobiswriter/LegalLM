'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Feather, SendHorizonal, User } from 'lucide-react';
import type { Document, Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';


interface AnalysisPanelProps {
  document: Document | null;
  messages: Message[];
  onSendMessage: (content: string) => void;
  isAnswering: boolean;
  onCitationClick: (citationId: string) => void;
}

const WelcomeView = () => (
  <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-background">
    <div className="mb-4 p-4 bg-primary/10 rounded-full">
        <Feather className="w-10 h-10 text-primary" />
    </div>
    <h2 className="text-3xl font-bold text-foreground mb-2">Welcome to LegalLM</h2>
    <p className="text-lg text-muted-foreground max-w-md">
      Your AI-powered legal document analysis workspace. Upload a document to begin.
    </p>
  </div>
);

const ChatMessage = ({ message, onCitationClick }: { message: Message, onCitationClick: (citationId: string) => void }) => {
  const isUser = message.sender === 'user';
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleCitation = (e: Event) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'SUP') {
            onCitationClick(target.textContent || '');
        }
    };
    const contentEl = contentRef.current;
    contentEl?.addEventListener('click', handleCitation);

    return () => {
        contentEl?.removeEventListener('click', handleCitation);
    };
  }, [onCitationClick]);

  return (
    <div className={cn("flex items-start gap-4 my-6", isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <Avatar className="w-8 h-8 border">
          <AvatarFallback className="bg-primary/20 text-primary">
            <Feather className="w-4 h-4"/>
          </AvatarFallback>
        </Avatar>
      )}
      <div className={cn(
        "max-w-2xl rounded-lg px-4 py-3 shadow-sm",
        isUser ? 'bg-primary text-primary-foreground' : 'bg-card'
      )}>
        <div
          ref={contentRef}
          className="prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: message.content }}
        />
      </div>
       {isUser && (
        <Avatar className="w-8 h-8 border">
          <AvatarFallback className="bg-accent text-accent-foreground">
             <User className="w-4 h-4"/>
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

const ThinkingMessage = () => (
    <div className="flex items-start gap-4 my-6 justify-start">
        <Avatar className="w-8 h-8 border">
          <AvatarFallback className="bg-primary/20 text-primary">
            <Feather className="w-4 h-4"/>
          </AvatarFallback>
        </Avatar>
        <div className="max-w-2xl w-full rounded-lg px-4 py-3 shadow-sm bg-card space-y-2">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/5" />
        </div>
    </div>
)


export function AnalysisPanel({ document, messages, onSendMessage, isAnswering, onCitationClick }: AnalysisPanelProps) {
  const [input, setInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages, isAnswering]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isAnswering) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  if (!document) {
    return (
      <main className="flex-1 flex flex-col">
        <WelcomeView />
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col bg-background h-screen">
      <div className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1" ref={scrollAreaRef}>
          <div className="p-6">
            {messages.map(msg => (
              <ChatMessage key={msg.id} message={msg} onCitationClick={onCitationClick} />
            ))}
            {isAnswering && <ThinkingMessage />}
          </div>
        </ScrollArea>
        <div className="px-6 py-4 border-t bg-background">
          <form onSubmit={handleFormSubmit} className="flex items-center gap-4">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask a question about the document..."
              className="flex-1"
              disabled={isAnswering}
            />
            <Button type="submit" size="icon" disabled={!input.trim() || isAnswering}>
              <SendHorizonal className="w-4 h-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
