import { useState } from 'react';
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
import type { OpeningBalance } from '../hooks/useOpeningBalances';

interface OpeningBalancesFormProps {
  accounts: Array<{ code: string; name: string }>;
  initialBalances?: OpeningBalance[];
  onSave: (balances: OpeningBalance[]) => void;
  isSaving?: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
  }).format(amount);
}

export function OpeningBalancesForm({
  accounts,
  initialBalances = [],
  onSave,
  isSaving,
}: OpeningBalancesFormProps) {
  const [balances, setBalances] = useState<Record<string, { debit: string; credit: string }>>(() => {
    const map: Record<string, { debit: string; credit: string }> = {};
    for (const acct of accounts) {
      const existing = initialBalances.find((b) => b.accountCode === acct.code);
      map[acct.code] = {
        debit: existing && existing.debit > 0 ? String(existing.debit) : '',
        credit: existing && existing.credit > 0 ? String(existing.credit) : '',
      };
    }
    return map;
  });

  const totalDebits = Object.values(balances).reduce(
    (sum, b) => sum + (parseFloat(b.debit) || 0),
    0,
  );
  const totalCredits = Object.values(balances).reduce(
    (sum, b) => sum + (parseFloat(b.credit) || 0),
    0,
  );
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  const handleChange = (code: string, field: 'debit' | 'credit', value: string) => {
    setBalances((prev) => ({
      ...prev,
      [code]: { ...prev[code], [field]: value },
    }));
  };

  const handleSave = () => {
    const result: OpeningBalance[] = accounts.map((acct) => ({
      accountCode: acct.code,
      accountName: acct.name,
      debit: parseFloat(balances[acct.code]?.debit ?? '') || 0,
      credit: parseFloat(balances[acct.code]?.credit ?? '') || 0,
    }));
    onSave(result);
  };

  return (
    <div className="space-y-4" data-testid="opening-balances-form">
      <div>
        <h3 className="text-lg font-semibold text-[#1a1a2e]">Opening Balances</h3>
        <p className="text-sm text-[#6b7280] mt-1">
          Set opening balances for your chart of accounts. Total debits must equal total credits.
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Account</TableHead>
            <TableHead className="text-right">Debit</TableHead>
            <TableHead className="text-right">Credit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((acct) => (
            <TableRow key={acct.code}>
              <TableCell className="font-mono text-sm">{acct.code}</TableCell>
              <TableCell>{acct.name}</TableCell>
              <TableCell className="text-right">
                <Input
                  type="number"
                  value={balances[acct.code]?.debit ?? ''}
                  onChange={(e) => handleChange(acct.code, 'debit', e.target.value)}
                  placeholder="0.00"
                  className="w-28 text-right"
                  data-testid={`debit-${acct.code}`}
                />
              </TableCell>
              <TableCell className="text-right">
                <Input
                  type="number"
                  value={balances[acct.code]?.credit ?? ''}
                  onChange={(e) => handleChange(acct.code, 'credit', e.target.value)}
                  placeholder="0.00"
                  className="w-28 text-right"
                  data-testid={`credit-${acct.code}`}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Totals */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex gap-8">
          <div>
            <p className="text-xs font-semibold uppercase text-[#6b7280]">Total Debits</p>
            <p className="text-lg font-bold text-[#1a1a2e]" data-testid="total-debits">
              {formatCurrency(totalDebits)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-[#6b7280]">Total Credits</p>
            <p className="text-lg font-bold text-[#1a1a2e]" data-testid="total-credits">
              {formatCurrency(totalCredits)}
            </p>
          </div>
        </div>
        {!isBalanced && (
          <p className="text-sm font-medium text-[#ef4444]" data-testid="balance-error" role="alert">
            Debits and credits must be equal (difference: {formatCurrency(Math.abs(totalDebits - totalCredits))})
          </p>
        )}
      </div>

      <Button
        variant="primary"
        onClick={handleSave}
        loading={isSaving}
        disabled={!isBalanced}
        data-testid="save-opening-balances-btn"
      >
        Save Opening Balances
      </Button>
    </div>
  );
}
