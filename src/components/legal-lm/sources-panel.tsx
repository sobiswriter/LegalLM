'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Document } from '@/lib/types';
import { FileText, Upload, Loader2, Feather } from 'lucide-react';

interface SourcesPanelProps {
  documents: Document[];
  selectedDocument: Document | null;
  onAddDocument: () => void;
  onSelectDocument: (doc: Document) => void;
  onDeleteDocument: (docId: number) => void;
  isUploading: boolean;
  canUpload: boolean;
  highlightedDocId?: number | null;
}

export function SourcesPanel({ documents, selectedDocument, onAddDocument, onSelectDocument, onDeleteDocument, isUploading, canUpload, highlightedDocId }: SourcesPanelProps) {
  return (
    <aside className="w-[380px] flex-shrink-0 bg-card border-r flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
            <Feather className="w-6 h-6 text-primary"/>
            <h1 className="text-xl font-bold">LegalLM</h1>
        </div>
      </div>
      <div className="p-4">
        <Button onClick={onAddDocument} disabled={isUploading || !canUpload} className="w-full">
          {isUploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          {isUploading ? 'Uploading...' : 'Upload Document'}
        </Button>
      </div>
      <div className="flex flex-col flex-1 min-h-0">
          <p className="px-4 pb-2 text-sm font-medium text-muted-foreground">Sources</p>
          <ScrollArea className="flex-1">
            <div className="px-4 pb-4 space-y-2">
              {documents.map(doc => {
                const isHighlighted = highlightedDocId === doc.id;
                return (
                  <div key={doc.id} className="flex items-center gap-2 group">
                    <button
                      onClick={() => onSelectDocument(doc)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3",
                        "hover:bg-accent hover:border-primary/20",
                        selectedDocument?.id === doc.id ? 'bg-accent border-primary/50 shadow-sm' : 'bg-card',
                        isHighlighted && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                      )}
                    >
                      <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="truncate text-sm font-medium text-card-foreground">{doc.name}</span>
                    </button>
                    <button
                      onClick={() => onDeleteDocument(doc.id)}
                      className="ml-1 text-xs text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete document"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
              {documents.length === 0 && !isUploading && (
                <div className="text-center text-sm text-muted-foreground pt-8">
                  <p>Upload your first document to get started.</p>
                </div>
              )}
            </div>
          </ScrollArea>
      </div>
    </aside>
  );
}
