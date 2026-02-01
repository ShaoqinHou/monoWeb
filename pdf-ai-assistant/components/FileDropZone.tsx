import React, { useCallback, useRef, useState } from 'react';
import { PdfFile } from '../types';
import { getPageCount } from '../services/pdfService';

interface FileDropZoneProps {
  onFilesAdded: (files: PdfFile[]) => void;
  compact?: boolean;
}

export default function FileDropZone({ onFilesAdded, compact }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    async (fileList: FileList) => {
      const pdfFiles: PdfFile[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (file.type !== 'application/pdf') continue;

        const arrayBuffer = await file.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const pageCount = await getPageCount(data);
        const name = file.name.replace(/\.pdf$/i, '');

        pdfFiles.push({
          id: `file-${Date.now()}-${i}`,
          name,
          fileName: file.name,
          data,
          pageCount,
        });
      }
      if (pdfFiles.length > 0) {
        onFilesAdded(pdfFiles);
      }
    },
    [onFilesAdded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files);
        e.target.value = '';
      }
    },
    [processFiles]
  );

  if (compact) {
    return (
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={`mx-2 my-2 p-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors text-center
          ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 hover:border-slate-500'}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          multiple
          className="hidden"
          onChange={handleInputChange}
        />
        <p className="text-xs text-slate-400">+ Drop or click to add PDFs</p>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      className={`flex-1 flex flex-col items-center justify-center cursor-pointer transition-colors
        ${isDragging ? 'bg-blue-500/10' : ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        multiple
        className="hidden"
        onChange={handleInputChange}
      />
      <div
        className={`p-12 border-2 border-dashed rounded-2xl text-center transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-500/5' : 'border-slate-600'}`}
      >
        <div className="text-5xl mb-4 opacity-30">PDF</div>
        <p className="text-slate-300 text-lg mb-2">Drop PDF files here</p>
        <p className="text-slate-500 text-sm">or click to browse</p>
      </div>
    </div>
  );
}
