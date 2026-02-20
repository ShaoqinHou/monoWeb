import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
  className?: string;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export function Pagination({ page, pageSize, total, onChange, className }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className={cn('flex items-center justify-between px-4 py-3 text-sm', className)}>
      {/* Page size selector */}
      <div className="flex items-center gap-2">
        <span className="text-[#6b7280]">Show</span>
        <select
          value={pageSize}
          onChange={(e) => onChange(1, Number(e.target.value))}
          className="rounded border border-[#e5e7eb] bg-white px-2 py-1 text-sm"
          aria-label="Page size"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <span className="text-[#6b7280]">per page</span>
      </div>

      {/* Current page display */}
      <span className="text-[#6b7280]">
        {total === 0 ? 'No items' : `${start}-${end} of ${total}`}
      </span>

      {/* Prev/Next buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1, pageSize)}
          disabled={page <= 1}
          className="rounded p-1 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="px-2 text-[#1a1a2e] font-medium">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onChange(page + 1, pageSize)}
          disabled={page >= totalPages}
          className="rounded p-1 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
