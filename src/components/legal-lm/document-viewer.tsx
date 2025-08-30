'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import type { Document } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

interface DocumentViewerPanelProps {
  document: Document | null;
  viewerContent?: { quote: string; docId: number } | null;
}

const WelcomeView = () => (
  <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-background">
    <p className="text-muted-foreground">Select or upload a document to view it here.</p>
  </div>
);

// Helper function to escape special characters for regex
const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export function DocumentViewerPanel({ document, viewerContent }: DocumentViewerPanelProps) {
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const [textContent, setTextContent] = useState<string>('');

  const isPdf = document?.name.endsWith('.pdf') ?? false;

  useEffect(() => {
    if (document && !isPdf) {
      // Decode base64 content for text files
      try {
        const base64 = document.content.substring(document.content.indexOf(',') + 1);
        const decoded = atob(base64);
        setTextContent(decoded);
      } catch (e) {
        console.error("Failed to decode text content", e);
        setTextContent("Error: Could not display file content.");
      }
    } else {
      setTextContent('');
    }
  }, [document, isPdf]);

  useEffect(() => {
    if (viewerContent && viewerContainerRef.current) {
      const { quote } = viewerContent;
      
      // For PDFs or empty quotes, just scroll to top
      if (isPdf || !quote) {
        viewerContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      
      // For text files, find and scroll to the quote
      const element = viewerContainerRef.current;
      const match = textContent.indexOf(quote);
      
      if (match !== -1) {
        // This is an approximation. A more robust solution might measure text size.
        const textBeforeMatch = textContent.substring(0, match);
        const lines = textBeforeMatch.split('\n').length;
        const scrollPosition = lines * 1.5 * 16; // Approx 1.5 line-height, 16px font-size

        element.scrollTo({ top: scrollPosition, behavior: 'smooth' });
      }
    }
  }, [viewerContent, isPdf, textContent]);
  
  const highlightedContent = useMemo(() => {
    if (isPdf || !textContent || !viewerContent?.quote) {
      return textContent;
    }
    const { quote } = viewerContent;
    const escapedQuote = escapeRegExp(quote);
    const parts = textContent.split(new RegExp(`(${escapedQuote})`, 'g'));

    return (
      <pre className="p-4 text-sm whitespace-pre-wrap font-sans">
        {parts.map((part, i) =>
          part.toLowerCase() === quote.toLowerCase() ? (
            <mark key={i} className="bg-primary/30 animate-pulse rounded-sm">{part}</mark>
          ) : (
            part
          )
        )}
      </pre>
    );

  }, [textContent, viewerContent, isPdf]);


  return (
    <section className="flex-1 flex flex-col bg-background h-screen">
      <div className="p-4 border-b shrink-0 flex items-center justify-between">
        <h2 className="text-lg font-semibold truncate">{document?.name ?? 'Document Viewer'}</h2>
        {isPdf && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                <span>Citation highlighting is not available for PDFs.</span>
            </div>
        )}
      </div>
      <div ref={viewerContainerRef} className="flex-1 bg-muted/20 overflow-y-auto transition-all duration-300">
        {document ? (
          isPdf ? (
            <embed
              src={document.content}
              type="application/pdf"
              className="w-full h-full"
            />
          ) : (
            <div>{highlightedContent}</div>
          )
        ) : (
          <WelcomeView />
        )}
      </div>
    </section>
  );
}
