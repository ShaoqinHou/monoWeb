import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import PageThumbnail from './PageThumbnail';

interface SortablePageThumbnailProps {
  id: string;
  imageUrl: string;
  pageNumber: number;
  isSelected: boolean;
  onClick: () => void;
}

export default function SortablePageThumbnail({
  id,
  imageUrl,
  pageNumber,
  isSelected,
  onClick,
}: SortablePageThumbnailProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <PageThumbnail
        imageUrl={imageUrl}
        pageNumber={pageNumber}
        isSelected={isSelected}
        onClick={onClick}
        isDragging={isDragging}
      />
    </div>
  );
}
