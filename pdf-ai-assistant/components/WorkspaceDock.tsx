import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WorkspacePage, PdfFile } from '../types';

interface WorkspaceDockProps {
  pages: WorkspacePage[];
  files: PdfFile[];
  onRemovePage: (pageId: string) => void;
  onClear: () => void;
  onCreatePdf: () => void;
}

function SortableWorkspaceItem({
  page,
  onRemove,
}: {
  page: WorkspacePage;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative shrink-0 group cursor-grab active:cursor-grabbing"
    >
      <div className="w-16 h-20 rounded-md overflow-hidden border border-slate-600 bg-white shadow-md hover:border-blue-400 transition-colors">
        <img
          src={page.thumbnailUrl}
          alt={`${page.sourceFileName} p${page.pageNumber}`}
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>
      {/* Label */}
      <div className="text-[8px] text-slate-400 text-center mt-0.5 leading-tight truncate w-16">
        {page.sourceFileName}
      </div>
      <div className="text-[9px] text-slate-300 text-center font-medium">
        p{page.pageNumber}
      </div>
      {/* Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[8px] font-bold hover:bg-red-400"
      >
        x
      </button>
    </div>
  );
}

export default function WorkspaceDock({
  pages,
  files,
  onRemovePage,
  onClear,
  onCreatePdf,
}: WorkspaceDockProps) {
  const { setNodeRef, isOver } = useDroppable({ id: 'workspace-drop' });

  const isEmpty = pages.length === 0;
  const sortableIds = pages.map((p) => p.id);

  return (
    <div
      ref={setNodeRef}
      className={`shrink-0 border-t transition-all
        ${isOver
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-slate-700 bg-slate-800/80'
        }
        ${isEmpty ? 'h-10' : ''}`}
    >
      {isEmpty ? (
        <div className={`h-full flex items-center justify-center gap-2 text-xs transition-colors
          ${isOver ? 'text-blue-400' : 'text-slate-500'}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>
            {isOver ? 'Drop here to add to workspace' : 'Workspace — Drag pages here or select + "Add to Workspace" to assemble a new PDF'}
          </span>
        </div>
      ) : (
        <div className="px-3 py-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-300">
                Workspace
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-600/20 text-blue-400 font-medium">
                {pages.length} page{pages.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={onClear}
                className="text-[10px] px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-slate-300 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={onCreatePdf}
                className="text-[10px] px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
              >
                Create PDF
              </button>
            </div>
          </div>

          {/* Sortable page strip */}
          <SortableContext items={sortableIds} strategy={horizontalListSortingStrategy}>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {pages.map((page) => (
                <SortableWorkspaceItem
                  key={page.id}
                  page={page}
                  onRemove={() => onRemovePage(page.id)}
                />
              ))}
            </div>
          </SortableContext>
        </div>
      )}
    </div>
  );
}
