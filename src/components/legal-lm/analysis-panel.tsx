'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Feather, SendHorizonal, User, FileWarning, Search, FileText, Loader2 } from 'lucide-react';
import type { Document, Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface AnalysisPanelProps {
  document: Document | null;
  messages: Message[];
  onSendMessage: (content: string) => void;
  onCitationClick: (citationId: string) => void;
  
  onGenerateSummary: () => void;
  onRiskAnalysis: () => void;
  onDefineTerm: (term: string) => void;

  isLoading: boolean;
  loadingAction: string | null;
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
            e.preventDefault();
            e.stopPropagation();
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
);


const ActionToolbar = ({ onGenerateSummary, onRiskAnalysis, onDefineTerm, isLoading, loadingAction }: Pick<AnalysisPanelProps, 'onGenerateSummary' | 'onRiskAnalysis' | 'onDefineTerm' | 'isLoading' | 'loadingAction'>) => {
    const [term, setTerm] = useState('');

    const handleDefineSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (term.trim() && !isLoading) {
            onDefineTerm(term.trim());
            setTerm('');
        }
    };

    return (
        <div className="px-6 py-3 border-t bg-background/80 backdrop-blur-sm">
            <div className="flex flex-wrap items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onGenerateSummary}
                    disabled={isLoading}
                >
                    {isLoading && loadingAction === 'summary' ? (
                        <Loader2 className="animate-spin" />
                    ) : (
                        <FileText />
                    )}
                    Re-summarize
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onRiskAnalysis}
                    disabled={isLoading}
                >
                    {isLoading && loadingAction === 'risks' ? (
                        <Loader2 className="animate-spin" />
                    ) : (
                        <FileWarning />
                    )}
                    Analyze Risks
                </Button>
                <form onSubmit={handleDefineSubmit} className="flex items-center gap-2 flex-1 sm:flex-initial sm:min-w-[300px]">
                    <Input
                        value={term}
                        onChange={e => setTerm(e.target.value)}
                        placeholder="Define a legal term..."
                        className="h-9 text-sm flex-1"
                        disabled={isLoading}
                    />
                    <Button type="submit" size="icon" variant="outline" className="h-9 w-9" disabled={!term.trim() || isLoading}>
                        {isLoading && loadingAction === 'jargon' ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            <Search className="w-4 h-4" />
                        )}
                        <span className="sr-only">Define Term</span>
                    </Button>
                </form>
            </div>
        </div>
    );
};


const ChatView = ({ document, messages, onSendMessage, onCitationClick, onGenerateSummary, onRiskAnalysis, onDefineTerm, isLoading, loadingAction }: AnalysisPanelProps) => {
    const [input, setInput] = useState('');
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }
    }, [messages, isLoading]);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
          onSendMessage(input.trim());
          setInput('');
        }
    };

    return (
        <div className="flex flex-col h-full">
            <ScrollArea className="flex-1" ref={scrollAreaRef}>
                <div className="p-6">
                    {messages.map(msg => (
                        <ChatMessage key={msg.id} message={msg} onCitationClick={onCitationClick} />
                    ))}
                    {isLoading && <ThinkingMessage />}
                </div>
            </ScrollArea>
            
            <ActionToolbar 
                onGenerateSummary={onGenerateSummary}
                onRiskAnalysis={onRiskAnalysis}
                onDefineTerm={onDefineTerm}
                isLoading={isLoading}
                loadingAction={loadingAction}
            />

            <div className="px-6 py-4 border-t bg-background">
                <form onSubmit={handleFormSubmit} className="flex items-center gap-4">
                    <Input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Ask a follow-up question..."
                        className="flex-1"
                        disabled={isLoading}
                    />
                    <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
                        <SendHorizonal className="w-4 h-4" />
                        <span className="sr-only">Send message</span>
                    </Button>
                </form>
            </div>
        </div>
    );
};


export function AnalysisPanel(props: AnalysisPanelProps) {
  if (!props.document) {
    return (
      <main className="w-[580px] flex-shrink-0 flex flex-col">
        <WelcomeView />
      </main>
    );
  }

  return (
    <main className="w-[580px] flex-shrink-0 flex flex-col bg-card border-l h-screen">
      <ChatView {...props} />
    </main>
  );
}
