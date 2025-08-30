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
    if (viewerContent && viewerContainerRef.current) {
      const { quote } = viewerContent;
      
      if (isPdf) {
        viewerContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      
      const element = viewerContainerRef.current;
      
      // Use a marker to avoid re-highlighting
      const highlightedElement = element.querySelector('mark.current-highlight');
      if (highlightedElement) {
        highlightedElement.outerHTML = highlightedElement.innerHTML; // Un-wrap
      }
      
      if (!quote) {
        element.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
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
            
            // Clean up the highlight after a delay
            setTimeout(() => {
                if (mark.parentNode) {
                    mark.outerHTML = mark.innerHTML;
                }
            }, 3000);
            
            break; 
        }
      }
    }
  }, [viewerContent]);
  
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
