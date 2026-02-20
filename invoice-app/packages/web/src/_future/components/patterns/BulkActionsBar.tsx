import { X } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface BulkAction {
  label: string;
  onClick: () => void;
}

export interface BulkActionsBarProps {
  selectedCount: number;
  actions: BulkAction[];
  onClear: () => void;
  className?: string;
}

export function BulkActionsBar({
  selectedCount,
  actions,
  onClear,
  className,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between border-t border-[#e5e7eb] bg-white px-6 py-3 shadow-lg',
        className,
      )}
      role="toolbar"
      aria-label="Bulk actions"
    >
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-[#1a1a2e]">
          {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
        </span>
        <button
          onClick={onClear}
          className="rounded p-1 text-[#6b7280] hover:bg-gray-100 transition-colors"
          aria-label="Clear selection"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className="rounded-md border border-[#e5e7eb] bg-white px-3 py-1.5 text-sm font-medium text-[#1a1a2e] hover:bg-gray-50 transition-colors"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
