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

    // Normalize function for robust matching
    const normalize = (str: string) => str.replace(/\s+/g, ' ').trim().toLowerCase();
    const normQuote = normalize(quote);

    // For docx (HTML content) and txt (preformatted text)
    const walker = window.document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
    let node: Node | null;
    const nodesToReplace: {node: Text, range: Range}[] = [];

    while ((node = walker.nextNode())) {
      if (node.nodeType === Node.TEXT_NODE && node.nodeValue) {
        const normNode = normalize(node.nodeValue);
        const matchIndex = normNode.indexOf(normQuote);
        if (matchIndex !== -1) {
          // Find the real index in the original string
          let origIdx = 0, normIdx = 0;
          while (origIdx < node.nodeValue.length && normIdx < matchIndex) {
            if (!/\s/.test(node.nodeValue[origIdx])) normIdx++;
            origIdx++;
          }
          const range = window.document.createRange();
          range.setStart(node as Text, origIdx);
          range.setEnd(node as Text, origIdx + quote.length);
          nodesToReplace.push({ node: node as Text, range });
        }
      }
    }

    if (nodesToReplace.length > 0) {
      const mark = window.document.createElement('mark');
      mark.className = "bg-primary/30 animate-pulse rounded-sm current-highlight";
      const { range } = nodesToReplace[0];
      try {
        range.surroundContents(mark);
        mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
              document.content ? (
                <embed
                  src={document.content}
                  type="application/pdf"
                  className="w-full h-full"
                />
              ) : (
                <div className="p-8 text-center text-destructive">PDF file is too large or could not be loaded.</div>
              )
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
