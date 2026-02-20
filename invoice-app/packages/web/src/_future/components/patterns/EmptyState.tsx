import { type ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className="mb-4 text-[#6b7280]">
        {icon ?? <Inbox className="h-12 w-12" />}
      </div>
      <h3 className="text-lg font-semibold text-[#1a1a2e] mb-1">{title}</h3>
      <p className="text-sm text-[#6b7280] max-w-sm mb-4">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center rounded-md bg-[#0078c8] px-4 py-2 text-sm font-medium text-white hover:bg-[#006bb3] transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
