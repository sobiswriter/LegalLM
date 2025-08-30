'use client';

import React, { useState, useRef } from 'react';
import type { Document, Message } from '@/lib/types';
import { SourcesPanel } from '@/components/legal-lm/sources-panel';
import { AnalysisPanel } from '@/components/legal-lm/analysis-panel';
import { DocumentViewerPanel } from '@/components/legal-lm/document-viewer';
import { generateDocumentSummary } from '@/ai/flows/generate-document-summary';
import { identifyRisksAndClauses } from '@/ai/flows/identify-risks-and-clauses';
import { answerQuestionsAboutDocument } from '@/ai/flows/answer-questions-about-document';
import { defineLegalTerm } from '@/ai/flows/define-legal-term';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

export default function LegalLMPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [highlightedDocId, setHighlightedDocId] = useState<number | null>(null);

  const [viewerContent, setViewerContent] = useState<{ quote: string; docId: number } | null>(null);


  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleAddDocumentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setLoadingAction('summary');

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUri = e.target?.result as string;
        try {
          const newDoc: Document = {
            id: Date.now(),
            name: file.name,
            summary: '',
            content: dataUri,
          };
          setDocuments(prev => [...prev, newDoc]);
          // This will trigger the initial summary generation
          handleSelectDocument(newDoc);
        } catch (error) {
          console.error('Error processing file:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to process the uploaded file.",
          });
        } finally {
          setIsLoading(false);
          setLoadingAction(null);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
        console.error('Error processing file:', error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not process the uploaded file.",
        });
        setIsLoading(false);
        setLoadingAction(null);
    }

    event.target.value = '';
  };

  const handleSelectDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setMessages([]);
    // Immediately trigger summary generation for the selected doc
    handleGenerateSummary(doc, true);
  };

  const handleCitationClick = (quote: string) => {
    if (!selectedDocument) return;
    
    // For PDFs, just scroll to top for now
    if (selectedDocument.name.endsWith('.pdf')) {
        setViewerContent({ quote: '', docId: selectedDocument.id });
    } else {
        setViewerContent({ quote, docId: selectedDocument.id });
    }

    setHighlightedDocId(selectedDocument.id);
    setTimeout(() => {
        setHighlightedDocId(null);
    }, 2000); // Highlight for 2 seconds
  };


  const addMessage = (message: Omit<Message, 'id'>) => {
    setMessages(prev => [...prev, { ...message, id: Date.now() }]);
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedDocument?.content) return;

    addMessage({ sender: 'user', content });
    setIsLoading(true);
    setLoadingAction('qna');

    try {
      const { answer } = await answerQuestionsAboutDocument({
        question: content,
        documentContent: selectedDocument.content,
      });
      addMessage({ sender: 'ai', content: answer });
    } catch (error) {
      console.error('Error getting answer:', error);
      addMessage({ sender: 'ai', content: "Sorry, I encountered an error trying to answer your question." });
    } finally {
        setIsLoading(false);
        setLoadingAction(null);
    }
  };

  const handleGenerateSummary = async (doc: Document | null = selectedDocument, clearChat = false) => {
    if (!doc?.content) return;
    
    setIsLoading(true);
    setLoadingAction('summary');
    if (clearChat) {
      setMessages([]);
    }
    try {
      const { summary } = await generateDocumentSummary({ documentDataUri: doc.content, documentName: doc.name });
      addMessage({ sender: 'ai', content: `<h3>Summary of ${doc.name}</h3>${summary}` });
    } catch (error) {
       console.error('Error generating summary:', error);
      addMessage({ sender: 'ai', content: `Sorry, I couldn't generate a summary for ${doc.name}.` });
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const handleRiskAnalysis = async () => {
    if (!selectedDocument?.content) return;
    
    setIsLoading(true);
    setLoadingAction('risks');
    try {
      const { analysis } = await identifyRisksAndClauses({ documentContent: selectedDocument.content });
      addMessage({ sender: 'ai', content: analysis });
    } catch (error) {
      console.error('Error analyzing risks:', error);
      addMessage({ sender: 'ai', content: "Sorry, I failed to analyze risks and clauses." });
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const handleDefineTerm = async (term: string) => {
    if (!selectedDocument?.content || !term.trim()) return;

    addMessage({ sender: 'user', content: `Define: "${term}"` });
    setIsLoading(true);
    setLoadingAction('jargon');
    try {
      const { definition } = await defineLegalTerm({
        term,
        documentContent: selectedDocument.content,
      });
      addMessage({ sender: 'ai', content: definition });
    } catch (error) {
      console.error('Error defining term:', error);
      addMessage({ sender: 'ai', content: `Sorry, I failed to define "${term}".` });
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };


  return (
    <>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <SourcesPanel
          documents={documents}
          selectedDocument={selectedDocument}
          onAddDocument={handleAddDocumentClick}
          onSelectDocument={handleSelectDocument}
          isUploading={isLoading && loadingAction === 'summary'}
          highlightedDocId={highlightedDocId}
          canUpload={!isLoading}
        />
        <Separator orientation="vertical" />
        <DocumentViewerPanel document={selectedDocument} viewerContent={viewerContent} />
        <Separator orientation="vertical" />
        <AnalysisPanel
          document={selectedDocument}
          messages={messages}
          onSendMessage={handleSendMessage}
          onCitationClick={handleCitationClick}
          onGenerateSummary={() => handleGenerateSummary(selectedDocument, false)}
          onRiskAnalysis={handleRiskAnalysis}
          onDefineTerm={handleDefineTerm}
          isLoading={isLoading}
          loadingAction={loadingAction}
        />
      </div>
       <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".txt,.pdf"
      />
    </>
  );
}
