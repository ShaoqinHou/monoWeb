import { cn } from '../../lib/cn';

export interface DetailSkeletonProps {
  className?: string;
}

export function DetailSkeleton({ className }: DetailSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)} aria-busy="true" aria-label="Loading detail">
      {/* Header area */}
      <div className="space-y-2">
        <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-48 animate-pulse rounded bg-gray-100" />
      </div>
      {/* Form field placeholders */}
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="space-y-2" data-testid="skeleton-field">
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-10 w-full animate-pulse rounded bg-gray-100" />
          </div>
        ))}
      </div>
      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-[#e5e7eb]">
        <div className="h-10 w-24 animate-pulse rounded bg-gray-200" />
        <div className="h-10 w-20 animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  );
}
