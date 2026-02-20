import { useState, useMemo } from 'react';
import { formatCurrency } from '@shared/calc/currency';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import type { TaxAuditTransaction, TaxAuditTotals } from '../hooks/useTaxAuditReport';

interface TaxAuditTableProps {
  transactions: TaxAuditTransaction[];
  totals: TaxAuditTotals;
}

type SortField = 'date' | 'netAmount';
type SortDir = 'asc' | 'desc';

/**
 * Reusable table component for tax audit data.
 * Sortable by date (default) or net amount. Includes a footer row with totals.
 */
export function TaxAuditTable({ transactions, totals }: TaxAuditTableProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const sorted = useMemo(() => {
    const copy = [...transactions];
    copy.sort((a, b) => {
      let cmp: number;
      if (sortField === 'date') {
        cmp = a.date.localeCompare(b.date);
      } else {
        cmp = a.netAmount - b.netAmount;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return copy;
  }, [transactions, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortIndicator = (field: SortField) => {
    if (sortField !== field) return '';
    return sortDir === 'asc' ? ' \u2191' : ' \u2193';
  };

  return (
    <Table data-testid="tax-audit-table">
      <TableHeader>
        <TableRow>
          <TableHead>
            <button
              type="button"
              onClick={() => handleSort('date')}
              className="hover:text-gray-900 cursor-pointer"
              data-testid="sort-date"
            >
              Date{sortIndicator('date')}
            </button>
          </TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Reference</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead className="text-right">
            <button
              type="button"
              onClick={() => handleSort('netAmount')}
              className="hover:text-gray-900 cursor-pointer"
              data-testid="sort-amount"
            >
              Net{sortIndicator('netAmount')}
            </button>
          </TableHead>
          <TableHead className="text-right">Tax</TableHead>
          <TableHead className="text-right">Gross</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((tx) => (
          <TableRow key={tx.id}>
            <TableCell>{tx.date}</TableCell>
            <TableCell>{tx.type}</TableCell>
            <TableCell>{tx.reference}</TableCell>
            <TableCell>{tx.contact}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatCurrency(tx.netAmount)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatCurrency(tx.taxAmount)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatCurrency(tx.grossAmount)}
            </TableCell>
          </TableRow>
        ))}
        {/* Totals footer row */}
        <TableRow className="font-bold border-t-2 border-gray-300" data-testid="totals-row">
          <TableCell colSpan={4}>Total</TableCell>
          <TableCell className="text-right tabular-nums">
            {formatCurrency(totals.totalNet)}
          </TableCell>
          <TableCell className="text-right tabular-nums">
            {formatCurrency(totals.totalTax)}
          </TableCell>
          <TableCell className="text-right tabular-nums">
            {formatCurrency(totals.totalGross)}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
