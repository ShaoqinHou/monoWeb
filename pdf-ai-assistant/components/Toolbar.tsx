import React, { useCallback } from 'react';
import { PdfFile, PageSelection } from '../types';
import * as pdfService from '../services/pdfService';

interface ToolbarProps {
  files: PdfFile[];
  selectedPages: PageSelection;
  onAddFile: (file: PdfFile) => void;
  onReplaceFile: (fileId: string, newFile: PdfFile) => void;
  onDeselectAll: () => void;
  onAddToWorkspace?: () => void;
}

export default function Toolbar({
  files,
  selectedPages,
  onAddFile,
  onReplaceFile,
  onDeselectAll,
  onAddToWorkspace,
}: ToolbarProps) {
  // Count total selected pages across all files
  let totalSelected = 0;
  const filesWithSelection: Array<{ file: PdfFile; pages: number[] }> = [];
  selectedPages.forEach((pages, fileId) => {
    if (pages.size > 0) {
      const file = files.find((f) => f.id === fileId);
      if (file) {
        totalSelected += pages.size;
        filesWithSelection.push({ file, pages: [...pages].sort((a, b) => a - b) });
      }
    }
  });

  const handleDeleteSelected = useCallback(async () => {
    // Delete selected pages from each file that has selections
    for (const { file, pages } of filesWithSelection) {
      const result = await pdfService.deletePages(file.data, pages);
      if (result.success && result.data) {
        onReplaceFile(file.id, {
          ...file,
          data: result.data,
          pageCount: result.pageCount!,
        });
      }
    }
    onDeselectAll();
  }, [filesWithSelection, onReplaceFile, onDeselectAll]);

  const handleMergeSelected = useCallback(async () => {
    if (filesWithSelection.length === 0) return;

    const sources = filesWithSelection.map(({ file, pages }) => ({
      data: file.data,
      pages,
    }));

    const result = await pdfService.mergePages(sources);
    if (result.success && result.data) {
      onAddFile({
        id: `merged-${Date.now()}`,
        name: 'merged',
        fileName: 'merged.pdf',
        data: result.data,
        pageCount: result.pageCount!,
      });
      onDeselectAll();
    }
  }, [filesWithSelection, onAddFile, onDeselectAll]);

  const handleExtractSelected = useCallback(async () => {
    // Extract selected pages from each file into separate new PDFs
    for (const { file, pages } of filesWithSelection) {
      const result = await pdfService.extractPages(file.data, pages);
      if (result.success && result.data) {
        onAddFile({
          id: `extract-${Date.now()}-${file.id}`,
          name: `${file.name}-extract`,
          fileName: `${file.name}-extract.pdf`,
          data: result.data,
          pageCount: result.pageCount!,
        });
      }
    }
    onDeselectAll();
  }, [filesWithSelection, onAddFile, onDeselectAll]);

  const handleDownloadActive = useCallback(() => {
    // Download all files that have selections, or all files if none selected
    const filesToDownload = filesWithSelection.length > 0
      ? filesWithSelection.map(({ file }) => file)
      : files;

    for (const file of filesToDownload) {
      pdfService.downloadPdf(file.data, file.fileName);
    }
  }, [filesWithSelection, files]);

  return (
    <div className="bg-slate-800/50 border-b border-slate-700 px-4 py-2 flex items-center gap-2 shrink-0">
      <span className="text-xs text-slate-500 mr-2">
        {totalSelected > 0
          ? `${totalSelected} page${totalSelected !== 1 ? 's' : ''} selected`
          : 'Select pages to perform operations'}
      </span>

      <div className="flex-1" />

      <button
        onClick={handleDeleteSelected}
        disabled={totalSelected === 0}
        className="px-3 py-1.5 text-xs rounded-md transition-colors
          disabled:opacity-30 disabled:cursor-not-allowed
          bg-red-600/20 text-red-400 hover:bg-red-600/30 disabled:hover:bg-red-600/20"
      >
        Delete Selected
      </button>

      <button
        onClick={handleMergeSelected}
        disabled={totalSelected === 0}
        className="px-3 py-1.5 text-xs rounded-md transition-colors
          disabled:opacity-30 disabled:cursor-not-allowed
          bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 disabled:hover:bg-blue-600/20"
      >
        Merge Selected
      </button>

      <button
        onClick={handleExtractSelected}
        disabled={totalSelected === 0}
        className="px-3 py-1.5 text-xs rounded-md transition-colors
          disabled:opacity-30 disabled:cursor-not-allowed
          bg-green-600/20 text-green-400 hover:bg-green-600/30 disabled:hover:bg-green-600/20"
      >
        Extract Selected
      </button>

      {onAddToWorkspace && (
        <button
          onClick={onAddToWorkspace}
          disabled={totalSelected === 0}
          className="px-3 py-1.5 text-xs rounded-md transition-colors
            disabled:opacity-30 disabled:cursor-not-allowed
            bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 disabled:hover:bg-purple-600/20"
        >
          Add to Workspace
        </button>
      )}

      <div className="w-px h-5 bg-slate-700 mx-1" />

      <button
        onClick={handleDownloadActive}
        disabled={files.length === 0}
        className="px-3 py-1.5 text-xs rounded-md transition-colors
          disabled:opacity-30 disabled:cursor-not-allowed
          bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:hover:bg-slate-700"
      >
        Download
      </button>
    </div>
  );
}
