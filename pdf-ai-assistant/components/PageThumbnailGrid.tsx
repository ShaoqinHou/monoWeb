import React, { useEffect, useState, useMemo } from 'react';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { PdfFile } from '../types';
import { renderAllPages } from '../services/pdfRenderService';
import { THUMBNAIL_SCALE } from '../constants';
import SortablePageThumbnail from './SortablePageThumbnail';

interface PageThumbnailGridProps {
  file: PdfFile;
  selectedPages: Set<number>;
  onTogglePage: (pageNumber: number) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export default function PageThumbnailGrid({
  file,
  selectedPages,
  onTogglePage,
  onSelectAll,
  onDeselectAll,
}: PageThumbnailGridProps) {
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    renderAllPages(file.data, THUMBNAIL_SCALE).then((urls) => {
      if (!cancelled) {
        setThumbnails(urls);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [file.data, file.id]);

  const allSelected = selectedPages.size === file.pageCount;

  // Stable IDs for sortable context
  const sortableIds = useMemo(
    () => thumbnails.map((_, i) => `grid-${file.id}-${i + 1}`),
    [thumbnails, file.id]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header with select controls */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700 shrink-0">
        <div className="text-sm text-slate-300">
          <span className="font-medium">{file.name}</span>
          <span className="text-slate-500 ml-2">{file.pageCount} pages</span>
          {selectedPages.size > 0 && (
            <span className="text-blue-400 ml-2">{selectedPages.size} selected</span>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-[10px] text-slate-500 hidden sm:inline">Drag to reorder</span>
          <button
            onClick={allSelected ? onDeselectAll : onSelectAll}
            className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 transition-colors"
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      </div>

      {/* Thumbnail grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full spinner" />
          </div>
        ) : (
          <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {thumbnails.map((url, index) => (
                <SortablePageThumbnail
                  key={sortableIds[index]}
                  id={sortableIds[index]}
                  imageUrl={url}
                  pageNumber={index + 1}
                  isSelected={selectedPages.has(index + 1)}
                  onClick={() => onTogglePage(index + 1)}
                />
              ))}
            </div>
          </SortableContext>
        )}
      </div>
    </div>
  );
}
