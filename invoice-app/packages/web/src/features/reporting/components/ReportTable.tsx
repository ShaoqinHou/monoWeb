import { formatCurrency } from '@shared/calc/currency';
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '../../../components/ui/Table';
import { cn } from '../../../lib/cn';
import type { ReportSection } from '../types';

interface ReportTableProps {
  sections: ReportSection[];
  className?: string;
  /** When true, rows with drillDown flag render amounts as clickable links */
  drillDownEnabled?: boolean;
}

/**
 * Generic hierarchical table for financial reports.
 *
 * Renders rows with different visual treatments based on their type:
 * - header: bold, gray background
 * - item: regular, indented
 * - total: bold, border-top
 * - grand-total: bold, double border
 */
export function ReportTable({ sections, className, drillDownEnabled }: ReportTableProps) {
  return (
    <Table className={className}>
      <TableBody>
        {sections.map((section, sectionIdx) => (
          <ReportSectionRows
            key={sectionIdx}
            section={section}
            isLast={sectionIdx === sections.length - 1}
            drillDownEnabled={drillDownEnabled}
          />
        ))}
      </TableBody>
    </Table>
  );
}

interface ReportSectionRowsProps {
  section: ReportSection;
  isLast: boolean;
  drillDownEnabled?: boolean;
}

function ReportSectionRows({ section, drillDownEnabled }: ReportSectionRowsProps) {
  return (
    <>
      {section.rows.map((row, rowIdx) => {
        const indent = row.indent ?? (row.type === 'item' ? 1 : 0);
        const paddingLeft = indent > 0 ? `${indent * 1.5}rem` : undefined;
        const showDrillDown = drillDownEnabled && row.drillDown && row.amount !== undefined;

        return (
          <TableRow
            key={rowIdx}
            className={cn(
              'hover:bg-transparent',
              row.type === 'header' && 'bg-gray-50',
              row.type === 'total' && 'border-t-2 border-gray-300',
              row.type === 'grand-total' &&
                'border-t-4 border-double border-gray-800',
            )}
            data-row-type={row.type}
          >
            <TableCell
              className={cn(
                'py-2',
                (row.type === 'header' ||
                  row.type === 'total' ||
                  row.type === 'grand-total') &&
                  'font-bold',
              )}
              style={{ paddingLeft }}
            >
              {row.label}
            </TableCell>
            <TableCell
              className={cn(
                'py-2 text-right tabular-nums',
                (row.type === 'header' ||
                  row.type === 'total' ||
                  row.type === 'grand-total') &&
                  'font-bold',
              )}
            >
              {row.amount !== undefined ? (
                showDrillDown ? (
                  <a
                    href={`/reporting/account-transactions?account=${encodeURIComponent(row.label)}`}
                    className="text-[#0078c8] hover:underline cursor-pointer"
                    data-testid={`drill-down-${row.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {formatCurrency(row.amount)}
                  </a>
                ) : (
                  formatCurrency(row.amount)
                )
              ) : (
                ''
              )}
            </TableCell>
          </TableRow>
        );
      })}
    </>
  );
}
