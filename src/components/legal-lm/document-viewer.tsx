'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import type { Document } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AlertCircle, ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DocumentViewerPanelProps {
  document: Document | null;
  viewerContent?: { quote: string; docId: number } | null;
  onBack?: () => void;
  isMobile?: boolean;
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

export function DocumentViewerPanel({ document, viewerContent, onBack, isMobile }: DocumentViewerPanelProps) {
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const [textContent, setTextContent] = useState<string>('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  
  const isPdf = document?.name.endsWith('.pdf') ?? false;
  const isDocx = document?.name.endsWith('.docx') ?? false;
  const htmlContent = document?.htmlContent;

  useEffect(() => {
    if (!document || isPdf) {
      setTextContent('');
      return;
    }

    // TXT-like files: decode the data URI
    if (!isDocx) {
      const base64 = document.content.substring(document.content.indexOf(',') + 1);
      try {
        const decoded = atob(base64);
        setTextContent(decoded);
      } catch (e) {
        console.error('Failed to decode text content', e);
        setTextContent('Error: Could not display file content.');
      }
      return;
    }

    // DOCX: htmlContent is provided; extract plain text so highlighting behaves like TXT
    if (isDocx) {
      try {
        const temp = window.document.createElement('div');
        temp.innerHTML = htmlContent || '';
        // Use innerText to preserve visible line breaks
        const txt = temp.innerText || temp.textContent || '';
        setTextContent(txt);
      } catch (e) {
        console.error('Failed to extract text from docx htmlContent', e);
        setTextContent('Error: Could not display document content.');
      }
      return;
    }
  }, [document, isPdf, isDocx, htmlContent]);


    useEffect(() => {
    if (document && isPdf && document.content) {
      const byteCharacters = atob(document.content.split(',')[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const objectUrl = URL.createObjectURL(blob);
      setPdfUrl(objectUrl);

      return () => {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
        setPdfUrl(null);
      };
    }
  }, [document, isPdf]);


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

  // For docx (rendered as plain text) and txt (preformatted text)
    const walker = window.document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
    let node: Node | null;
    const nodesToReplace: {node: Text, range: Range}[] = [];

    while ((node = walker.nextNode())) {
      if (node.nodeType === Node.TEXT_NODE && node.nodeValue) {
        const normNode = normalize(node.nodeValue);
        const matchIndex = normNode.indexOf(normQuote);
        if (matchIndex !== -1) {
          // Map the normalized match index back to the original node offsets.
          // We must account for collapsed whitespace when normalizing so
          // the end offset is computed against the original string length
          // and never exceeds it.
          const nodeValue = node.nodeValue || '';
          let origIdx = 0;
          let normIdx = 0;

          // Advance origIdx until we reach the normalized match start
          while (origIdx < nodeValue.length && normIdx < matchIndex) {
            if (!/\s/.test(nodeValue[origIdx])) normIdx++;
            origIdx++;
          }

          // Compute how many normalized characters the quote occupies
          const normQuoteLen = normQuote.length;
          const targetNormEnd = matchIndex + normQuoteLen;

          // Advance endOrigIdx until we've consumed the normalized quote length
          let endOrigIdx = origIdx;
          let normIdx2 = matchIndex;
          while (endOrigIdx < nodeValue.length && normIdx2 < targetNormEnd) {
            if (!/\s/.test(nodeValue[endOrigIdx])) normIdx2++;
            endOrigIdx++;
          }

          // Clamp offsets to the node length to avoid Range errors
          origIdx = Math.min(Math.max(0, origIdx), nodeValue.length);
          endOrigIdx = Math.min(Math.max(origIdx, endOrigIdx), nodeValue.length);

          const range = window.document.createRange();
          range.setStart(node as Text, origIdx);
          range.setEnd(node as Text, endOrigIdx);
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
  }, [viewerContent, isDocx, textContent]);
  
  const highlightedContent = useMemo(() => {
    if (!document || isPdf || isDocx) {
      return null;
    }
    
    return <pre className="p-4 text-sm whitespace-pre-wrap font-sans">{textContent}</pre>;

  }, [textContent, document, isPdf, isDocx]);


  return (
    <section className="flex flex-col bg-background h-screen lg:h-full">
      <div className="p-4 border-b shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2 truncate">
          {onBack && (
            <Button variant="ghost" size="icon" className="mr-2" onClick={onBack}>
              <ArrowLeft />
            </Button>
          )}
          <h2 className="text-lg font-semibold truncate">{document?.name ?? 'Document Viewer'}</h2>
        </div>
        {(isPdf || isDocx) && !isMobile && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                <span>Citation highlighting may not be precise for PDF/DOCX.</span>
            </div>
        )}
      </div>
      <div ref={viewerContainerRef} className="flex-1 bg-muted/20 overflow-y-auto transition-all duration-300">
        {document ? (
            isPdf ? (
              <>
                {isMobile ? (
                  <div className="p-8 flex flex-col items-center justify-center h-full">
                    {pdfUrl ? (
                      <Button asChild size="lg">
                        <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2"/>
                          Open PDF in New Tab
                        </a>
                      </Button>
                    ) : (
                      <p className="text-destructive">Generating PDF link...</p>
                    )}
                    <p className="text-muted-foreground text-sm mt-4 text-center">
                      PDF preview is not available directly on this screen.
                    </p>
                  </div>
                ) : (
                   pdfUrl ? (
                    <iframe src={pdfUrl} className="w-full h-full" title={document.name} />
                  ) : (
                    <div className="p-8 flex items-center justify-center h-full">
                      <p>Loading PDF...</p>
                    </div>
                  )
                )}
              </>
            ) : isDocx ? (
              // Render DOCX as plain text inside a pre so highlighting logic is the same as TXT
              <div className="p-8 max-w-none">
                <pre className="p-0 m-0 text-sm whitespace-pre-wrap font-sans">{textContent || 'Converting document...'}</pre>
              </div>
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
