import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { cn } from '../../lib/cn';

export type SortDirection = 'asc' | 'desc';

export interface SortableHeaderProps {
  label: string;
  field: string;
  currentSort: string;
  currentDirection: SortDirection;
  onSort: (field: string, direction: SortDirection) => void;
  className?: string;
  'data-testid'?: string;
}

export function SortableHeader({
  label,
  field,
  currentSort,
  currentDirection,
  onSort,
  className,
  'data-testid': dataTestId,
}: SortableHeaderProps) {
  const isActive = currentSort === field;

  function handleClick() {
    if (isActive) {
      onSort(field, currentDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onSort(field, 'asc');
    }
  }

  return (
    <th
      className={cn(
        'h-10 px-4 text-left align-middle font-semibold text-[#6b7280] text-xs uppercase tracking-wide cursor-pointer select-none hover:text-[#1a1a2e] transition-colors',
        className,
      )}
      onClick={handleClick}
      role="columnheader"
      aria-sort={isActive ? (currentDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
      data-testid={dataTestId}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive ? (
          currentDirection === 'asc' ? (
            <ArrowUp className="h-3 w-3" aria-label="sorted ascending" />
          ) : (
            <ArrowDown className="h-3 w-3" aria-label="sorted descending" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" aria-label="unsorted" />
        )}
      </span>
    </th>
  );
}
