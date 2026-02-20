interface FormSkeletonProps {
  fields?: number;
  showHeader?: boolean;
}

export function FormSkeleton({ fields = 5, showHeader = true }: FormSkeletonProps) {
  return (
    <div className="animate-pulse space-y-6 p-4" aria-busy="true" aria-label="Loading form" data-testid="form-skeleton">
      {showHeader && (
        <div className="h-8 bg-gray-200 rounded w-1/3" />
      )}
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-10 bg-gray-200 rounded w-full" />
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <div className="h-10 bg-gray-200 rounded w-24" />
        <div className="h-10 bg-gray-100 rounded w-20" />
      </div>
    </div>
  );
}

export type { FormSkeletonProps };
