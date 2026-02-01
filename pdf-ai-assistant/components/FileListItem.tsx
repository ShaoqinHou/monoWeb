import React from 'react';
import { PdfFile } from '../types';

interface FileListItemProps {
  file: PdfFile;
  isActive: boolean;
  onClick: () => void;
  onRemove: () => void;
}

export default function FileListItem({ file, isActive, onClick, onRemove }: FileListItemProps) {
  return (
    <div
      onClick={onClick}
      className={`group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors
        ${isActive ? 'bg-blue-600/20 border-l-2 border-blue-500' : 'hover:bg-slate-700/50 border-l-2 border-transparent'}`}
    >
      {/* PDF icon */}
      <div className="w-7 h-7 bg-red-600/20 rounded flex items-center justify-center shrink-0">
        <span className="text-[10px] font-bold text-red-400">PDF</span>
      </div>

      {/* Name & page count */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200 truncate">{file.name}</p>
        <p className="text-[10px] text-slate-500">{file.pageCount} page{file.pageCount !== 1 ? 's' : ''}</p>
      </div>

      {/* Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded hover:bg-slate-600 text-slate-400 hover:text-slate-200 transition-all text-xs shrink-0"
      >
        x
      </button>
    </div>
  );
}
