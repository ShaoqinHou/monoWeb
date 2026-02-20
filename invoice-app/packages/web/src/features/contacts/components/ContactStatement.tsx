import { Printer, Mail } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { formatCurrency } from '../../../../../shared/calc/currency';
import type { Contact, StatementTransaction } from '../types';

interface ContactStatementProps {
  contact: Contact;
  transactions: StatementTransaction[];
  dateRange: { start: string; end: string };
  onDateRangeChange: (range: { start: string; end: string }) => void;
  onPrint: () => void;
  onEmail: () => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function ContactStatement({
  contact,
  transactions,
  dateRange,
  onDateRangeChange,
  onPrint,
  onEmail,
}: ContactStatementProps) {
  // Calculate summary
  const totalInvoiced = transactions
    .filter((t) => t.type === 'invoice')
    .reduce((sum, t) => sum + t.debit, 0);
  const totalPaid = transactions
    .filter((t) => t.type === 'payment')
    .reduce((sum, t) => sum + t.credit, 0);
  const totalCredits = transactions
    .filter((t) => t.type === 'credit-note')
    .reduce((sum, t) => sum + t.credit, 0);
  const closingBalance = transactions.length > 0
    ? transactions[transactions.length - 1].balance
    : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between" data-testid="statement-header">
        <div>
          <h2 className="text-lg font-semibold text-[#1a1a2e]">
            Statement of Account
          </h2>
          <p className="text-sm text-[#6b7280]">{contact.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrint}
            data-testid="statement-print-btn"
          >
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onEmail}
            data-testid="statement-email-btn"
          >
            <Mail className="h-4 w-4 mr-1" />
            Email
          </Button>
        </div>
      </div>

      {/* Date Range */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-[#6b7280]">From</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) =>
              onDateRangeChange({ ...dateRange, start: e.target.value })
            }
            className="rounded border border-[#e5e7eb] px-2 py-1 text-sm"
            data-testid="statement-date-start"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-[#6b7280]">To</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) =>
              onDateRangeChange({ ...dateRange, end: e.target.value })
            }
            className="rounded border border-[#e5e7eb] px-2 py-1 text-sm"
            data-testid="statement-date-end"
          />
        </div>
      </div>

      {/* Transactions Table */}
      {transactions.length === 0 ? (
        <div className="py-8 text-center text-[#6b7280]" data-testid="statement-empty">
          No transactions found for this period.
        </div>
      ) : (
        <Table data-testid="statement-table">
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Number</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Debit</TableHead>
              <TableHead className="text-right">Credit</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((txn, index) => (
              <TableRow key={`${txn.number}-${index}`} data-testid={`statement-row-${index}`}>
                <TableCell>{formatDate(txn.date)}</TableCell>
                <TableCell className="capitalize">{txn.type}</TableCell>
                <TableCell>{txn.number}</TableCell>
                <TableCell>{txn.description}</TableCell>
                <TableCell className="text-right">
                  {txn.debit > 0 ? formatCurrency(txn.debit) : '-'}
                </TableCell>
                <TableCell className="text-right">
                  {txn.credit > 0 ? formatCurrency(txn.credit) : '-'}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(txn.balance)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Summary */}
      <Card data-testid="statement-summary">
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2">
            <div>
              <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">
                Total Invoiced
              </p>
              <p className="text-lg font-bold text-[#1a1a2e]">
                {formatCurrency(totalInvoiced)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">
                Total Paid
              </p>
              <p className="text-lg font-bold text-[#14b8a6]">
                {formatCurrency(totalPaid)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">
                Credits
              </p>
              <p className="text-lg font-bold text-[#1a1a2e]">
                {formatCurrency(totalCredits)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">
                Closing Balance
              </p>
              <p className={`text-lg font-bold ${closingBalance > 0 ? 'text-[#f59e0b]' : 'text-[#1a1a2e]'}`}>
                {formatCurrency(closingBalance)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
