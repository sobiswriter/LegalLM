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
  const isDocx = document?.name.endsWith('.docx') ?? false;
  const htmlContent = document?.htmlContent;

  useEffect(() => {
    if (document && !isPdf && !isDocx) {
      const base64 = document.content.substring(document.content.indexOf(',') + 1);
      try {
        const decoded = atob(base64);
        setTextContent(decoded);
      } catch (e) {
        console.error("Failed to decode text content", e);
        setTextContent("Error: Could not display file content.");
      }
    } else {
        setTextContent('');
    }
  }, [document, isPdf, isDocx]);


  useEffect(() => {
    if (!viewerContent || !viewerContainerRef.current) return;

    const { quote } = viewerContent;
    const element = viewerContainerRef.current;

    // Remove previous highlight
    const previousHighlight = element.querySelector('mark.current-highlight');
    if (previousHighlight) {
      previousHighlight.outerHTML = previousHighlight.innerHTML;
    }

    if (!quote) {
      element.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (isPdf) {
      element.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // For docx (HTML content)
    if (isDocx && htmlContent) {
      const escapedQuote = escapeRegExp(quote);
      const regex = new RegExp(escapedQuote, 'i'); // Case-insensitive search
      if (element.innerHTML.match(regex)) {
        element.innerHTML = element.innerHTML.replace(regex, (match) => `<mark class="bg-primary/30 animate-pulse rounded-sm current-highlight">${match}</mark>`);
        
        const newHighlight = element.querySelector('mark.current-highlight');
        if (newHighlight) {
          newHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => {
            if (newHighlight.parentNode) {
              newHighlight.outerHTML = newHighlight.innerHTML;
            }
          }, 3000);
        }
      }
      return;
    }
    
    // For txt files
    const walker = window.document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
    let node;
    while (node = walker.nextNode()) {
      const nodeText = node.nodeValue || '';
      const matchIndex = nodeText.indexOf(quote);
      if (matchIndex !== -1) {
          const range = document.createRange();
          range.setStart(node, matchIndex);
          range.setEnd(node, matchIndex + quote.length);
          
          const mark = document.createElement('mark');
          mark.className = "bg-primary/30 animate-pulse rounded-sm current-highlight";
          range.surroundContents(mark);
          
          mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          setTimeout(() => {
              if (mark.parentNode) {
                  mark.outerHTML = mark.innerHTML;
              }
          }, 3000);
          
          break; 
      }
    }
  }, [viewerContent, isDocx, htmlContent]);
  
  const highlightedContent = useMemo(() => {
    if (!document || isPdf || isDocx) {
      return null;
    }
    
    return <pre className="p-4 text-sm whitespace-pre-wrap font-sans">{textContent}</pre>;

  }, [textContent, document, isPdf, isDocx]);


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
            ) : isDocx ? (
              <div
                className="p-8 prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: htmlContent || '<p>Converting document...</p>' }}
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
