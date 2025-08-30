'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import type { Document } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';
import mammoth from 'mammoth';

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
  const [htmlContent, setHtmlContent] = useState<string>('');


  const isPdf = document?.name.endsWith('.pdf') ?? false;
  const isDocx = document?.name.endsWith('.docx') ?? false;

  useEffect(() => {
    if (document) {
      const base64 = document.content.substring(document.content.indexOf(',') + 1);
      if (isDocx) {
        const buffer = Buffer.from(base64, 'base64');
        mammoth.convertToHtml({ buffer })
          .then(result => {
            setHtmlContent(result.value);
            setTextContent('');
          })
          .catch(err => {
            console.error("Failed to convert docx to html", err);
            setHtmlContent("<p>Error: Could not display file content.</p>");
          });
      } else if (!isPdf) {
        // Decode base64 content for text files
        try {
          const decoded = atob(base64);
          setTextContent(decoded);
          setHtmlContent('');
        } catch (e) {
          console.error("Failed to decode text content", e);
          setTextContent("Error: Could not display file content.");
          setHtmlContent('');
        }
      } else {
        setTextContent('');
        setHtmlContent('');
      }
    }
  }, [document, isPdf, isDocx]);


  useEffect(() => {
    if (viewerContent && viewerContainerRef.current) {
      const { quote } = viewerContent;
      
      // For PDFs or empty quotes, just scroll to top
      if (isPdf || !quote) {
        viewerContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (isDocx) {
        // In docx, we can't reliably scroll to a quote, so just scroll to top
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
  }, [viewerContent, isPdf, isDocx, textContent]);
  
  const highlightedContent = useMemo(() => {
    if (isPdf || isDocx) {
      return null;
    }
    
    if (!textContent) {
      return <pre className="p-4 text-sm whitespace-pre-wrap font-sans"></pre>;
    }
    
    if (!viewerContent?.quote) {
      return <pre className="p-4 text-sm whitespace-pre-wrap font-sans">{textContent}</pre>;
    }

    const { quote } = viewerContent;
    const escapedQuote = escapeRegExp(quote);
    const parts = textContent.split(new RegExp(`(${escapedQuote})`, 'gi'));

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

  }, [textContent, viewerContent, isPdf, isDocx]);


  return (
    <section className="flex-1 flex flex-col bg-background h-screen">
      <div className="p-4 border-b shrink-0 flex items-center justify-between">
        <h2 className="text-lg font-semibold truncate">{document?.name ?? 'Document Viewer'}</h2>
        {(isPdf || isDocx) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                <span>Citation highlighting is not available for {isPdf ? 'PDFs' : 'DOCX files'}.</span>
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
            ) : isDocx ? (
              <div
                className="p-8 prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
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
