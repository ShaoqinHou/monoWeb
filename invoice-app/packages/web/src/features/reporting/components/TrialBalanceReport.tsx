import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { formatCurrency } from '@shared/calc/currency';

export interface TrialBalanceAccount {
  accountCode: string;
  accountName: string;
  accountType: 'revenue' | 'expense' | 'asset' | 'liability' | 'equity';
  debit: number;
  credit: number;
}

interface TrialBalanceReportProps {
  accounts: TrialBalanceAccount[];
  asAt?: string;
}

/**
 * Trial Balance report showing accounts with debit and credit columns.
 * Debits and credits should balance (total debits = total credits).
 */
export function TrialBalanceReport({ accounts, asAt }: TrialBalanceReportProps) {
  const totalDebits = accounts.reduce((sum, a) => sum + a.debit, 0);
  const totalCredits = accounts.reduce((sum, a) => sum + a.credit, 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  // Group accounts by type for organized display
  const grouped = groupByType(accounts);
  const typeOrder: TrialBalanceAccount['accountType'][] = [
    'asset',
    'liability',
    'equity',
    'revenue',
    'expense',
  ];
  const typeLabels: Record<string, string> = {
    asset: 'Assets',
    liability: 'Liabilities',
    equity: 'Equity',
    revenue: 'Revenue',
    expense: 'Expenses',
  };

  return (
    <div className="space-y-4" data-testid="trial-balance-report">
      {asAt && (
        <p className="text-sm text-[#6b7280]">As at {asAt}</p>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Account Code</TableHead>
            <TableHead>Account Name</TableHead>
            <TableHead className="text-right">Debit</TableHead>
            <TableHead className="text-right">Credit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.length === 0 ? (
            <TableRow>
              <td colSpan={4} className="px-4 py-8 text-center text-[#6b7280]">
                No accounts to display
              </td>
            </TableRow>
          ) : (
            <>
              {typeOrder.map((type) => {
                const group = grouped[type];
                if (!group || group.length === 0) return null;
                return (
                  <AccountGroup
                    key={type}
                    label={typeLabels[type]}
                    accounts={group}
                  />
                );
              })}

              {/* Totals row */}
              <TableRow className="border-t-2 border-gray-300 font-bold bg-gray-50">
                <TableCell colSpan={2} className="text-right">
                  Total
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(totalDebits)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(totalCredits)}
                </TableCell>
              </TableRow>

              {/* Balance check row */}
              <TableRow>
                <TableCell colSpan={2} className="text-right text-sm">
                  {isBalanced ? (
                    <span className="text-green-600 font-medium">Balanced</span>
                  ) : (
                    <span className="text-red-600 font-medium">
                      Out of balance by {formatCurrency(Math.abs(totalDebits - totalCredits))}
                    </span>
                  )}
                </TableCell>
                <TableCell />
                <TableCell />
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function AccountGroup({ label, accounts }: { label: string; accounts: TrialBalanceAccount[] }) {
  return (
    <>
      <TableRow className="bg-gray-50">
        <TableCell colSpan={4} className="font-bold text-gray-700">
          {label}
        </TableCell>
      </TableRow>
      {accounts.map((account) => (
        <TableRow key={account.accountCode}>
          <TableCell className="pl-8">{account.accountCode}</TableCell>
          <TableCell>{account.accountName}</TableCell>
          <TableCell className="text-right tabular-nums">
            {account.debit > 0 ? formatCurrency(account.debit) : ''}
          </TableCell>
          <TableCell className="text-right tabular-nums">
            {account.credit > 0 ? formatCurrency(account.credit) : ''}
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

function groupByType(accounts: TrialBalanceAccount[]): Record<string, TrialBalanceAccount[]> {
  const groups: Record<string, TrialBalanceAccount[]> = {};
  for (const account of accounts) {
    if (!groups[account.accountType]) {
      groups[account.accountType] = [];
    }
    groups[account.accountType].push(account);
  }
  return groups;
}
