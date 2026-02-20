import { useState, useMemo } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { useAccountTransactions, type DateRange } from '../hooks/useAccountTransactions';

interface AccountTransactionsPageProps {
  accountCode: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
  }).format(amount);
}

function defaultDateRange(): DateRange {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  return {
    from: `${year}-${month}-01`,
    to: `${year}-${month}-${String(lastDay).padStart(2, '0')}`,
  };
}

export function AccountTransactionsPage({ accountCode }: AccountTransactionsPageProps) {
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange);
  const { data: transactions = [], isLoading } = useAccountTransactions(accountCode, dateRange);

  const transactionsWithBalance = useMemo(() => {
    let balance = 0;
    return transactions.map((txn) => {
      balance += txn.debit - txn.credit;
      return { ...txn, runningBalance: balance };
    });
  }, [transactions]);

  return (
    <div className="space-y-6" data-testid="account-transactions-page">
      <div>
        <h2 className="text-xl font-bold text-[#1a1a2e]">
          Account Transactions
        </h2>
        <p className="text-sm text-[#6b7280]">Account: {accountCode}</p>
      </div>

      {/* Date Range Filter */}
      <div className="flex items-end gap-4">
        <Input
          label="From"
          type="date"
          value={dateRange.from}
          onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
          data-testid="date-from-input"
        />
        <Input
          label="To"
          type="date"
          value={dateRange.to}
          onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
          data-testid="date-to-input"
        />
        <Button
          variant="secondary"
          onClick={() => setDateRange(defaultDateRange())}
          data-testid="reset-dates-btn"
        >
          Reset
        </Button>
      </div>

      {/* Transactions Table */}
      {isLoading ? (
        <p className="text-sm text-[#6b7280]">Loading transactions...</p>
      ) : (
        <Table data-testid="transactions-table">
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead className="text-right">Debit</TableHead>
              <TableHead className="text-right">Credit</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactionsWithBalance.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-[#6b7280]">
                  No transactions found for this period.
                </TableCell>
              </TableRow>
            ) : (
              transactionsWithBalance.map((txn) => (
                <TableRow key={txn.id} data-testid={`txn-row-${txn.id}`}>
                  <TableCell>{txn.date}</TableCell>
                  <TableCell>{txn.description}</TableCell>
                  <TableCell className="font-mono text-sm">{txn.reference}</TableCell>
                  <TableCell className="text-right">
                    {txn.debit > 0 ? formatCurrency(txn.debit) : ''}
                  </TableCell>
                  <TableCell className="text-right">
                    {txn.credit > 0 ? formatCurrency(txn.credit) : ''}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(txn.runningBalance)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
