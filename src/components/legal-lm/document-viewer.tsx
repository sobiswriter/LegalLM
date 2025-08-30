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
    let previousHighlight = element.querySelector('mark.current-highlight');
    if (previousHighlight) {
        previousHighlight.outerHTML = previousHighlight.innerHTML;
        // Reread the element to get the clean DOM
        previousHighlight = element.querySelector('mark.current-highlight');
    }

    if (!quote) {
      element.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (isPdf) {
      // PDF highlighting is handled inside the embed, cannot control from here
      return;
    }
    
    // For docx (HTML content) and txt (preformatted text)
    const walker = window.document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
    let node;
    const nodesToReplace: {node: Text, range: Range}[] = [];

    while (node = walker.nextNode()) {
      if (node.nodeValue) {
        const matchIndex = node.nodeValue.indexOf(quote);
        if (matchIndex !== -1) {
          const range = document.createRange();
          range.setStart(node, matchIndex);
          range.setEnd(node, matchIndex + quote.length);
          nodesToReplace.push({ node, range });
        }
      }
    }

    if (nodesToReplace.length > 0) {
      const mark = document.createElement('mark');
      mark.className = "bg-primary/30 animate-pulse rounded-sm current-highlight";
      
      // Use the first found node for highlighting
      const { range } = nodesToReplace[0];
      try {
        range.surroundContents(mark);
        mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Remove the highlight after a delay
        setTimeout(() => {
            if (mark.parentNode) {
                mark.outerHTML = mark.innerHTML;
            }
        }, 3000);

      } catch (e) {
        console.error("Failed to surround contents for highlighting", e);
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
    <section className="flex flex-col bg-background h-screen">
      <div className="p-4 border-b shrink-0 flex items-center justify-between">
        <h2 className="text-lg font-semibold truncate">{document?.name ?? 'Document Viewer'}</h2>
        {(isPdf || isDocx) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                <span>Citation highlighting may not be precise for PDF/DOCX.</span>
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
