import React from 'react';
import { PdfFile } from '../types';
import FileListItem from './FileListItem';
import FileDropZone from './FileDropZone';

interface FileListProps {
  files: PdfFile[];
  activeFileId: string | null;
  onSetActive: (fileId: string) => void;
  onRemoveFile: (fileId: string) => void;
  onFilesAdded: (files: PdfFile[]) => void;
  onLoadSamples: () => void;
}

export default function FileList({
  files,
  activeFileId,
  onSetActive,
  onRemoveFile,
  onFilesAdded,
  onLoadSamples,
}: FileListProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-slate-700">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Files ({files.length})
        </h2>
      </div>

      {/* Load Sample PDFs button - prominent when no files */}
      {files.length === 0 && (
        <div className="px-3 pt-3 pb-1">
          <button
            onClick={onLoadSamples}
            className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-base">⬇</span> Load Sample PDFs
          </button>
          <p className="text-[10px] text-slate-500 text-center mt-1.5">
            Load 6 test PDFs to try things out
          </p>
        </div>
      )}

      {/* Compact load samples when files exist */}
      {files.length > 0 && (
        <div className="px-3 py-1.5 border-b border-slate-700/50">
          <button
            onClick={onLoadSamples}
            className="w-full py-1.5 px-2 text-[11px] text-blue-400 hover:text-blue-300 hover:bg-slate-700/50 rounded transition-colors"
          >
            + Load Sample PDFs
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {files.map((file) => (
          <FileListItem
            key={file.id}
            file={file}
            isActive={file.id === activeFileId}
            onClick={() => onSetActive(file.id)}
            onRemove={() => onRemoveFile(file.id)}
          />
        ))}
      </div>

      <FileDropZone onFilesAdded={onFilesAdded} compact />
    </div>
  );
}
