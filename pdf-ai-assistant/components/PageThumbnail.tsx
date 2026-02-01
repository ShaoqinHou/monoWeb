import React from 'react';

interface PageThumbnailProps {
  imageUrl: string;
  pageNumber: number;
  isSelected: boolean;
  onClick: () => void;
  isDragging?: boolean;
}

export default function PageThumbnail({
  imageUrl,
  pageNumber,
  isSelected,
  onClick,
  isDragging,
}: PageThumbnailProps) {
  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer rounded-lg overflow-hidden transition-all group
        ${isDragging ? 'opacity-40 scale-95' : ''}
        ${isSelected
          ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900 scale-[0.97]'
          : 'hover:ring-1 hover:ring-slate-500 hover:ring-offset-1 hover:ring-offset-slate-900'
        }`}
    >
      {/* Page image */}
      <img
        src={imageUrl}
        alt={`Page ${pageNumber}`}
        className="w-full h-auto bg-white"
        draggable={false}
      />

      {/* Page number badge */}
      <div
        className={`absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-medium
          ${isSelected ? 'bg-blue-600 text-white' : 'bg-black/60 text-slate-300'}`}
      >
        {pageNumber}
      </div>

      {/* Selection checkbox - always visible */}
      <div
        className={`absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center transition-all
          ${isSelected
            ? 'bg-blue-600 shadow-md'
            : 'border-2 border-white/70 bg-black/30 group-hover:border-white group-hover:bg-black/50'
          }`}
      >
        {isSelected && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </div>
  );
}
