'use client';

import React, { useState, useRef } from 'react';
import type { Document, Message } from '@/lib/types';
import { SourcesPanel } from '@/components/legal-lm/sources-panel';
import { AnalysisPanel } from '@/components/legal-lm/analysis-panel';
import { generateDocumentSummary } from '@/ai/flows/generate-document-summary';
import { identifyRisksAndClauses } from '@/ai/flows/identify-risks-and-clauses';
import { answerQuestionsAboutDocument } from '@/ai/flows/answer-questions-about-document';
import { defineLegalTerm } from '@/ai/flows/define-legal-term';
import { useToast } from '@/hooks/use-toast';

export default function LegalLMPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [riskAnalysis, setRiskAnalysis] = useState<string | null>(null);
  const [termDefinition, setTermDefinition] = useState<string | null>(null);

  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [isAnalyzingRisks, setIsAnalyzingRisks] = useState(false);
  const [isDefiningTerm, setIsDefiningTerm] = useState(false);
  
  const [highlightedDoc, setHighlightedDoc] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleAddDocumentClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAddingDoc(true);
    setRiskAnalysis(null);
    setTermDefinition(null);
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUri = e.target?.result as string;
        try {
          const { summary } = await generateDocumentSummary({ documentDataUri: dataUri, documentName: file.name });
          const newDoc: Document = {
            id: Date.now(),
            name: file.name,
            summary: `<h3>Summary of ${file.name}</h3>${summary}`,
            content: dataUri,
          };
          setDocuments(prev => [...prev, newDoc]);
          handleSelectDocument(newDoc);
        } catch (error) {
          console.error('Error generating summary:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to generate document summary. Please try again.",
          });
        } finally {
          setIsAddingDoc(false);
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
        setIsAddingDoc(false);
    }

    event.target.value = '';
  };

  const handleSelectDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setMessages([{ id: Date.now(), sender: 'ai', content: doc.summary }]);
    setRiskAnalysis(null);
    setTermDefinition(null);
  };
  
  const handleCitationClick = () => {
    if (!selectedDocument) return;
    setHighlightedDoc(selectedDocument.id);
    setTimeout(() => {
        setHighlightedDoc(null);
    }, 1000);
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedDocument?.content) return;

    const userMessage: Message = { id: Date.now(), sender: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setIsAnswering(true);

    try {
      const { answer } = await answerQuestionsAboutDocument({
        question: content,
        documentContent: selectedDocument.content,
      });

      const aiMessage: Message = { id: Date.now() + 1, sender: 'ai', content: answer };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Error getting answer:', error);
      const errorMessage: Message = { id: Date.now() + 1, sender: 'ai', content: "Sorry, I encountered an error trying to answer your question." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsAnswering(false);
    }
  };

  const handleRiskAnalysis = async () => {
    if (!selectedDocument?.content) return;
    
    setIsAnalyzingRisks(true);
    try {
      const { analysis } = await identifyRisksAndClauses({ documentContent: selectedDocument.content });
      setRiskAnalysis(analysis);
    } catch (error) {
      console.error('Error analyzing risks:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to analyze risks and clauses.",
      });
    } finally {
      setIsAnalyzingRisks(false);
    }
  };

  const handleDefineTerm = async (term: string) => {
    if (!selectedDocument?.content || !term.trim()) return;

    setIsDefiningTerm(true);
    try {
      const { definition } = await defineLegalTerm({
        term,
        documentContent: selectedDocument.content,
      });
      setTermDefinition(definition);
    } catch (error) {
      console.error('Error defining term:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to define the legal term.",
      });
    } finally {
      setIsDefiningTerm(false);
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
          isUploading={isAddingDoc}
          highlightedDocId={highlightedDoc}
          canUpload={true}
        />
        <AnalysisPanel
          document={selectedDocument}
          messages={messages}
          onSendMessage={handleSendMessage}
          isAnswering={isAnswering}
          onCitationClick={handleCitationClick}
          
          riskAnalysis={riskAnalysis}
          onRiskAnalysis={handleRiskAnalysis}
          isAnalyzingRisks={isAnalyzingRisks}

          termDefinition={termDefinition}
          onDefineTerm={handleDefineTerm}
          isDefiningTerm={isDefiningTerm}
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
