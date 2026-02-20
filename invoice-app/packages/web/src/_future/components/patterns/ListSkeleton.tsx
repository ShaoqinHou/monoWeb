import { cn } from '../../lib/cn';

export interface ListSkeletonProps {
  rows?: number;
  className?: string;
}

export function ListSkeleton({ rows = 5, className }: ListSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)} aria-busy="true" aria-label="Loading list">
      {/* Header row */}
      <div className="flex gap-4 px-4 py-3 border-b border-[#e5e7eb]">
        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
        <div className="ml-auto h-4 w-16 animate-pulse rounded bg-gray-200" />
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3" data-testid="skeleton-row">
          <div className="h-4 w-40 animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
          <div className="ml-auto h-4 w-16 animate-pulse rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}
