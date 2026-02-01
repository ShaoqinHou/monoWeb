import React from 'react';
import { PdfFile, PageSelection } from '../types';
import PageThumbnailGrid from './PageThumbnailGrid';
import FileDropZone from './FileDropZone';

interface PdfPreviewProps {
  file: PdfFile | null;
  selectedPages: PageSelection;
  onTogglePage: (fileId: string, pageNumber: number) => void;
  onSelectAllPages: (fileId: string) => void;
  onDeselectAll: () => void;
  onFilesAdded: (files: PdfFile[]) => void;
}

export default function PdfPreview({
  file,
  selectedPages,
  onTogglePage,
  onSelectAllPages,
  onDeselectAll,
  onFilesAdded,
}: PdfPreviewProps) {
  if (!file) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Getting Started Guide */}
        <div className="max-w-lg w-full">
          <h2 className="text-2xl font-semibold text-slate-200 text-center mb-2">
            Welcome to PDF AI Assistant
          </h2>
          <p className="text-slate-400 text-center mb-8 text-sm">
            Manipulate PDFs with manual tools or natural language AI commands
          </p>

          {/* Steps */}
          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-4 bg-slate-800/50 rounded-lg p-4">
              <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                1
              </div>
              <div>
                <p className="text-slate-200 font-medium text-sm">Upload your PDFs or load samples</p>
                <p className="text-slate-500 text-xs mt-0.5">
                  Drag & drop files, click to browse, or use "Load Sample PDFs" in the sidebar
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-slate-800/50 rounded-lg p-4">
              <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                2
              </div>
              <div>
                <p className="text-slate-200 font-medium text-sm">Select pages & use the toolbar</p>
                <p className="text-slate-500 text-xs mt-0.5">
                  Click page thumbnails to select, then Delete, Merge, Extract, or Download
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-slate-800/50 rounded-lg p-4">
              <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                3
              </div>
              <div>
                <p className="text-slate-200 font-medium text-sm">Or just ask the AI</p>
                <p className="text-slate-500 text-xs mt-0.5">
                  Type commands like "Merge pages 1-3 of File A with page 5 of File B" in the chat panel, or click a Quick Command
                </p>
              </div>
            </div>
          </div>

          {/* Drop zone */}
          <FileDropZone onFilesAdded={onFilesAdded} />
        </div>
      </div>
    );
  }

  const fileSelection = selectedPages.get(file.id) || new Set<number>();

  return (
    <PageThumbnailGrid
      file={file}
      selectedPages={fileSelection}
      onTogglePage={(pageNumber) => onTogglePage(file.id, pageNumber)}
      onSelectAll={() => onSelectAllPages(file.id)}
      onDeselectAll={onDeselectAll}
    />
  );
}
