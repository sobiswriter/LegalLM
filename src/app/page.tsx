'use client';

import React, { useState, useEffect } from 'react';
import type { Document, Message } from '@/lib/types';
import { SourcesPanel } from '@/components/legal-lm/sources-panel';
import { AnalysisPanel } from '@/components/legal-lm/analysis-panel';

const MOCK_DOCUMENTS: Document[] = [
  {
    id: 1,
    name: 'Rental_Agreement.pdf',
    summary: `<h3>Summary of Rental Agreement</h3><p>This agreement is between 'Landlord' and 'Tenant'<sup>1</sup>. The lease duration is 12 months, commencing on September 1, 2025<sup>2</sup>. The monthly rent is set at $1,500, due on the first of each month<sup>3</sup>. A security deposit of $1,500 is required upon signing<sup>4</sup>.</p><p>The tenant is responsible for all utilities except for water<sup>5</sup>. Pets are not allowed without prior written consent from the landlord<sup>6</sup>.</p>`,
    responses: {
      'what is the rent amount': `<p>The monthly rent is $1,500, as stated in the agreement<sup>3</sup>.</p>`,
      'default': `<p>I am a simple mock AI. I can only answer "what is the rent amount". Please try that question to see a simulated response<sup>7</sup>.</p>`
    }
  },
  {
    id: 2,
    name: 'Loan_Terms.txt',
    summary: `<h3>Summary of Loan Terms</h3><p>This is a personal loan agreement for the principal amount of $10,000<sup>8</sup>. The annual interest rate is 5%<sup>9</sup>. The loan term is 5 years, with monthly payments of $188.71<sup>10</sup>.</p><p>There is a late fee of 5% of the payment amount for any payments more than 10 days overdue<sup>11</sup>.</p>`,
    responses: {
      'what is the interest rate': `<p>The annual interest rate for this loan is 5%<sup>9</sup>.</p>`,
      'default': `<p>I am a simple mock AI. I can only answer "what is the interest rate". Please try that question to see a simulated response<sup>12</sup>.</p>`
    }
  }
];


export default function LegalLMPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAddingDoc, setIsAddingDoc] = useState(false);

  useEffect(() => {
    // Start with one document loaded and selected
    const initialDoc = MOCK_DOCUMENTS[0];
    setDocuments([initialDoc]);
    setSelectedDocument(initialDoc);
    setMessages([{ id: Date.now(), sender: 'ai', content: initialDoc.summary }]);
  }, []);

  const handleAddDocument = () => {
    if (documents.length < MOCK_DOCUMENTS.length) {
      setIsAddingDoc(true);
      setTimeout(() => {
        const nextDoc = MOCK_DOCUMENTS[documents.length];
        setDocuments(prev => [...prev, nextDoc]);
        handleSelectDocument(nextDoc);
        setIsAddingDoc(false);
      }, 1000); // Simulate upload delay
    }
  };

  const handleSelectDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setMessages([{ id: Date.now(), sender: 'ai', content: doc.summary }]);
  };

  const handleSendMessage = (content: string) => {
    if (!selectedDocument) return;

    // Add user message
    const userMessage: Message = { id: Date.now(), sender: 'user', content };
    setMessages(prev => [...prev, userMessage]);

    // Simulate AI response
    setTimeout(() => {
      const query = content.toLowerCase().trim();
      const responseContent = selectedDocument.responses[query] || selectedDocument.responses['default'];
      const aiMessage: Message = { id: Date.now() + 1, sender: 'ai', content: responseContent };
      setMessages(prev => [...prev, aiMessage]);
    }, 800);
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <SourcesPanel
        documents={documents}
        selectedDocument={selectedDocument}
        onAddDocument={handleAddDocument}
        onSelectDocument={handleSelectDocument}
        isUploading={isAddingDoc}
        canUpload={documents.length < MOCK_DOCUMENTS.length}
      />
      <AnalysisPanel
        document={selectedDocument}
        messages={messages}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
