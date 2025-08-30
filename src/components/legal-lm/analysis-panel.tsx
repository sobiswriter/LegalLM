'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Feather, SendHorizonal, User, FileWarning, BookOpen, Search } from 'lucide-react';
import type { Document, Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AnalysisPanelProps {
  document: Document | null;
  messages: Message[];
  onSendMessage: (content: string) => void;
  isAnswering: boolean;
  onCitationClick: (citationId: string) => void;
  
  riskAnalysis: string | null;
  onRiskAnalysis: () => void;
  isAnalyzingRisks: boolean;

  termDefinition: string | null;
  onDefineTerm: (term: string) => void;
  isDefiningTerm: boolean;
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
);

const SummaryView = ({ messages, onCitationClick }: { messages: Message[], onCitationClick: (citationId: string) => void }) => (
    <ScrollArea className="h-full">
        <div className="p-6">
            {messages.map(msg => (
              <ChatMessage key={msg.id} message={msg} onCitationClick={onCitationClick} />
            ))}
        </div>
    </ScrollArea>
);

const RiskAnalysisView = ({ analysis, onAnalyze, isLoading }: { analysis: string | null, onAnalyze: () => void, isLoading: boolean }) => (
    <div className="p-6 h-full flex flex-col">
        {!analysis && !isLoading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
                <FileWarning className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Identify Risks &amp; Key Clauses</h3>
                <p className="text-muted-foreground mb-4 max-w-md">Analyze the document to automatically identify potential legal risks, important obligations, and critical clauses.</p>
                <Button onClick={onAnalyze}>Analyze Now</Button>
            </div>
        )}
        {isLoading && (
            <div className="space-y-4">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <br/>
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
            </div>
        )}
        {analysis && !isLoading &&(
            <ScrollArea className="flex-1">
                <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: analysis }} />
            </ScrollArea>
        )}
    </div>
);

const QandAView = ({ messages, onSendMessage, isAnswering, onCitationClick }: { messages: Message[], onSendMessage: (content: string) => void, isAnswering: boolean, onCitationClick: (citationId: string) => void }) => {
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

    return (
        <div className="flex flex-col h-full">
            <ScrollArea className="flex-1" ref={scrollAreaRef}>
                <div className="p-6">
                    {messages.slice(1).map(msg => (
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
    )
};


const LegalJargonView = ({ definition, onDefine, isLoading }: { definition: string | null, onDefine: (term: string) => void, isLoading: boolean }) => {
    const [term, setTerm] = useState('');

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (term.trim() && !isLoading) {
            onDefine(term.trim());
        }
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <BookOpen className="w-5 h-5" />
                        Define Legal Term
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleFormSubmit} className="flex items-center gap-4">
                        <Input
                            value={term}
                            onChange={e => setTerm(e.target.value)}
                            placeholder="Enter a term, e.g., 'indemnification'"
                            className="flex-1"
                            disabled={isLoading}
                        />
                        <Button type="submit" size="icon" disabled={!term.trim() || isLoading}>
                            <Search className="w-4 h-4" />
                            <span className="sr-only">Define Term</span>
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {(isLoading || definition) && (
                <Card className="mt-6 flex-1">
                    <CardContent className="p-6">
                        {isLoading ? (
                            <div className="space-y-3">
                                <Skeleton className="h-5 w-1/4" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-4/5" />
                            </div>
                        ) : (
                            <div
                                className="prose prose-sm dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: definition! }}
                            />
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};


export function AnalysisPanel(props: AnalysisPanelProps) {
  const { document, messages, onSendMessage, isAnswering, onCitationClick, riskAnalysis, onRiskAnalysis, isAnalyzingRisks, termDefinition, onDefineTerm, isDefiningTerm } = props;

  if (!document) {
    return (
      <main className="flex-1 flex flex-col">
        <WelcomeView />
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col bg-background h-screen">
      <Tabs defaultValue="summary" className="flex-1 flex flex-col">
        <div className="px-6 border-b">
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="risks">Risks &amp; Clauses</TabsTrigger>
            <TabsTrigger value="qna">Q&amp;A</TabsTrigger>
            <TabsTrigger value="jargon">Legal Jargon</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="summary" className="flex-1 overflow-y-auto">
          <SummaryView messages={messages.slice(0,1)} onCitationClick={onCitationClick} />
        </TabsContent>
        <TabsContent value="risks" className="flex-1 overflow-y-auto">
          <RiskAnalysisView analysis={riskAnalysis} onAnalyze={onRiskAnalysis} isLoading={isAnalyzingRisks} />
        </TabsContent>
        <TabsContent value="qna" className="flex-1 flex flex-col min-h-0">
          <QandAView messages={messages} onSendMessage={onSendMessage} isAnswering={isAnswering} onCitationClick={onCitationClick} />
        </TabsContent>
        <TabsContent value="jargon" className="flex-1 overflow-y-auto">
           <LegalJargonView definition={termDefinition} onDefine={onDefineTerm} isLoading={isDefiningTerm} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
