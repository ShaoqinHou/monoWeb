import { useState, useMemo, useCallback, useEffect } from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardContent } from '../../../components/ui/Card';
import { Combobox } from '../../../components/ui/Combobox';
import { Input } from '../../../components/ui/Input';
import { ReportHeader } from '../components/ReportHeader';
import { formatCurrency } from '@shared/calc/currency';
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHeader,
  TableHead,
} from '../../../components/ui/Table';
import { useAccounts } from '../../accounting/hooks/useAccounts';
import type { DateRange } from '../types';

interface AccountTransaction {
  date: string;
  description: string;
  reference: string;
  type: 'invoice' | 'bill' | 'payment' | 'journal';
  debit: number;
  credit: number;
  balance: number;
}

interface AccountOption {
  code: string;
  name: string;
}

/** Fallback account list used when API data is unavailable */
const DEFAULT_ACCOUNTS: AccountOption[] = [
  { code: '200', name: 'Sales' },
  { code: '260', name: 'Other Revenue' },
  { code: '310', name: 'Cost of Goods Sold' },
  { code: '400', name: 'Advertising' },
  { code: '404', name: 'Bank Fees' },
  { code: '408', name: 'Cleaning' },
  { code: '412', name: 'Consulting & Accounting' },
  { code: '420', name: 'Entertainment' },
  { code: '461', name: 'Printing & Stationery' },
  { code: '477', name: 'Telephone & Internet' },
  { code: '489', name: 'Wages and Salaries' },
];

function getMockTransactions(accountCode: string): AccountTransaction[] {
  if (!accountCode) return [];
  const base = parseInt(accountCode, 10) * 7;
  return [
    { date: '2026-01-05', description: 'Invoice #INV-001', reference: 'INV-001', type: 'invoice', debit: base + 1200, credit: 0, balance: base + 1200 },
    { date: '2026-01-12', description: 'Payment received', reference: 'PAY-001', type: 'payment', debit: 0, credit: base + 500, balance: base + 700 },
    { date: '2026-01-20', description: 'Bill #BILL-042', reference: 'BILL-042', type: 'bill', debit: base + 350, credit: 0, balance: base + 1050 },
    { date: '2026-02-01', description: 'Journal #JNL-007', reference: 'JNL-007', type: 'journal', debit: 0, credit: base + 150, balance: base + 900 },
    { date: '2026-02-15', description: 'Invoice #INV-015', reference: 'INV-015', type: 'invoice', debit: base + 2400, credit: 0, balance: base + 3300 },
  ];
}

function getDefaultDateRange(): DateRange {
  const year = new Date().getFullYear();
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

export function AccountTransactionsPage() {
  const [selectedAccount, setSelectedAccount] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange);
  const { data: apiAccounts } = useAccounts();

  // Pre-select account from ?account= query param (e.g. when navigating from Chart of Accounts YTD link)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accountParam = params.get('account');
    if (accountParam) {
      setSelectedAccount(accountParam);
    }
  }, []);

  const transactions = useMemo(
    () => getMockTransactions(selectedAccount),
    [selectedAccount],
  );

  const resolvedAccounts: AccountOption[] = useMemo(() => {
    if (apiAccounts && apiAccounts.length > 0) {
      return apiAccounts.map((a) => ({ code: a.code, name: a.name }));
    }
    return DEFAULT_ACCOUNTS;
  }, [apiAccounts]);

  const accountOptions = useMemo(
    () => resolvedAccounts.map((a) => ({ value: a.code, label: `${a.code} - ${a.name}` })),
    [resolvedAccounts],
  );

  const handleAccountChange = useCallback(
    (value: string) => {
      setSelectedAccount(value);
    },
    [],
  );

  const handleFromChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDateRange((prev) => ({ ...prev, from: e.target.value }));
    },
    [],
  );

  const handleToChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDateRange((prev) => ({ ...prev, to: e.target.value }));
    },
    [],
  );

  const selectedName = resolvedAccounts.find((a) => a.code === selectedAccount)?.name ?? '';
  const subtitle = selectedAccount
    ? `${selectedAccount} - ${selectedName} | ${dateRange.from} to ${dateRange.to}`
    : 'Select an account to view transactions';

  return (
    <PageContainer
      title="Account Transactions"
      breadcrumbs={[
        { label: 'Reports', href: '/reporting' },
        { label: 'Account Transactions' },
      ]}
    >
      <ReportHeader title="Account Transactions" subtitle={subtitle}>
        <div className="flex items-end gap-3">
          <div className="w-64">
            <Combobox
              label="Account"
              options={accountOptions}
              value={selectedAccount}
              onChange={handleAccountChange}
              placeholder="Search for accounts..."
              data-testid="account-select"
            />
          </div>
          <div className="w-40">
            <Input
              label="From"
              inputId="txn-from"
              type="date"
              value={dateRange.from}
              onChange={handleFromChange}
            />
          </div>
          <div className="w-40">
            <Input
              label="To"
              inputId="txn-to"
              type="date"
              value={dateRange.to}
              onChange={handleToChange}
            />
          </div>
        </div>
      </ReportHeader>

      {selectedAccount && transactions.length > 0 && (
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((txn, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{txn.date}</TableCell>
                    <TableCell>{txn.description}</TableCell>
                    <TableCell className="font-mono text-xs">{txn.reference}</TableCell>
                    <TableCell>
                      <span className="capitalize text-sm">{txn.type}</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {txn.debit > 0 ? formatCurrency(txn.debit) : ''}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {txn.credit > 0 ? formatCurrency(txn.credit) : ''}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatCurrency(txn.balance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {selectedAccount && transactions.length === 0 && (
        <p className="text-gray-500">No transactions found for this account and date range.</p>
      )}
    </PageContainer>
  );
}
