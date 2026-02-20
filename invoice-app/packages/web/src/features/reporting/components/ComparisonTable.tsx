import { formatCurrency } from '@shared/calc/currency';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from '../../../components/ui/Table';
import { cn } from '../../../lib/cn';
import type { ReportSection } from '../types';
import { computeChange } from '../hooks/useReportComparison';

interface ComparisonTableProps {
  currentSections: ReportSection[];
  priorSections: ReportSection[];
  className?: string;
}

export function ComparisonTable({
  currentSections,
  priorSections,
  className,
}: ComparisonTableProps) {
  return (
    <Table className={className} data-testid="comparison-table">
      <TableHeader>
        <TableRow>
          <TableHead className="w-1/3">Account</TableHead>
          <TableHead className="text-right">This Period</TableHead>
          <TableHead className="text-right">Prior Period</TableHead>
          <TableHead className="text-right">Change</TableHead>
          <TableHead className="text-right">Change %</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {currentSections.map((section, sIdx) => {
          const priorSection = priorSections[sIdx];
          return section.rows.map((row, rIdx) => {
            const priorRow = priorSection?.rows[rIdx];
            const currentAmt = row.amount ?? 0;
            const priorAmt = priorRow?.amount ?? 0;
            const indent = row.indent ?? (row.type === 'item' ? 1 : 0);
            const paddingLeft = indent > 0 ? `${indent * 1.5}rem` : undefined;
            const { change, changePercent } = computeChange(currentAmt, priorAmt);

            return (
              <TableRow
                key={`${sIdx}-${rIdx}`}
                className={cn(
                  'hover:bg-transparent',
                  row.type === 'header' && 'bg-gray-50',
                  row.type === 'total' && 'border-t-2 border-gray-300',
                  row.type === 'grand-total' && 'border-t-4 border-double border-gray-800',
                )}
                data-row-type={row.type}
              >
                <TableCell
                  className={cn(
                    'py-2',
                    (row.type === 'header' || row.type === 'total' || row.type === 'grand-total') && 'font-bold',
                  )}
                  style={{ paddingLeft }}
                >
                  {row.label}
                </TableCell>
                <TableCell className={cn('py-2 text-right tabular-nums', (row.type === 'total' || row.type === 'grand-total') && 'font-bold')}>
                  {row.amount !== undefined ? formatCurrency(currentAmt) : ''}
                </TableCell>
                <TableCell className="py-2 text-right tabular-nums">
                  {priorRow?.amount !== undefined ? formatCurrency(priorAmt) : ''}
                </TableCell>
                <TableCell
                  className={cn(
                    'py-2 text-right tabular-nums',
                    row.amount !== undefined && change > 0 && 'text-green-600',
                    row.amount !== undefined && change < 0 && 'text-red-600',
                  )}
                >
                  {row.amount !== undefined ? formatCurrency(change) : ''}
                </TableCell>
                <TableCell
                  className={cn(
                    'py-2 text-right tabular-nums',
                    row.amount !== undefined && change > 0 && 'text-green-600',
                    row.amount !== undefined && change < 0 && 'text-red-600',
                  )}
                >
                  {row.amount !== undefined && changePercent !== null
                    ? `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(1)}%`
                    : ''}
                </TableCell>
              </TableRow>
            );
          });
        })}
      </TableBody>
    </Table>
  );
}
