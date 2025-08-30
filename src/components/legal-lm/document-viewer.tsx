'use client';

import React, { useEffect, useRef } from 'react';
import type { Document } from '@/lib/types';

interface DocumentViewerPanelProps {
  document: Document | null;
  scrollTop?: number;
}

const WelcomeView = () => (
  <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-background">
    <p className="text-muted-foreground">Select or upload a document to view it here.</p>
  </div>
);

export function DocumentViewerPanel({ document, scrollTop }: DocumentViewerPanelProps) {
  const viewerContainerRef = useRef<HTMLDivElement>(null);

  // This is a bit of a trick. The <embed> tag is a separate document,
  // so we can't easily scroll it. Instead, we scroll its container.
  // For a real app, we might use a library like react-pdf to render pages
  // that we can control. For this demo, scrolling the container is a good simulation.
  useEffect(() => {
    if (scrollTop && viewerContainerRef.current) {
      viewerContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [scrollTop]);

  return (
    <section className="flex-1 flex flex-col bg-background h-screen">
      <div className="p-4 border-b shrink-0">
        <h2 className="text-lg font-semibold truncate">{document?.name ?? 'Document Viewer'}</h2>
      </div>
      <div ref={viewerContainerRef} className="flex-1 bg-muted/20 overflow-y-auto">
        {document ? (
          <embed
            src={document.content}
            type={document.name.endsWith('.pdf') ? 'application/pdf' : 'text/plain'}
            className="w-full h-full"
          />
        ) : (
          <WelcomeView />
        )}
      </div>
    </section>
  );
}
