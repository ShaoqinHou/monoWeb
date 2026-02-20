import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useBankAccounts } from '../hooks/useDashboardData';
import { Landmark, Upload } from 'lucide-react';
import { formatCurrency } from '@shared/calc/currency';

// Mock enhanced bank account data
interface EnhancedBankAccount {
  id: string;
  name: string;
  code: string;
  type: string;
  statementBalance: number;
  xeroBalance: number;
  unreconciledCount: number;
  currency: string;
}

function deriveEnhancedAccounts(accounts: { id: string; name: string; code: string; type: string }[]): EnhancedBankAccount[] {
  // In production, these values would come from the API
  const mockBalances: Record<string, Partial<EnhancedBankAccount>> = {
    '0': { statementBalance: 12500.00, xeroBalance: 11800.00, unreconciledCount: 7, currency: 'NZD' },
    '1': { statementBalance: 4200.00, xeroBalance: 4200.00, unreconciledCount: 0, currency: 'NZD' },
  };

  return accounts.map((account, idx) => {
    const mock = mockBalances[String(idx)] ?? { statementBalance: 0, xeroBalance: 0, unreconciledCount: 0, currency: 'NZD' };
    return {
      ...account,
      statementBalance: mock.statementBalance ?? 0,
      xeroBalance: mock.xeroBalance ?? 0,
      unreconciledCount: mock.unreconciledCount ?? 0,
      currency: mock.currency ?? 'NZD',
    };
  });
}

export function BankAccountsWidget() {
  const { data: accounts, isLoading } = useBankAccounts();

  const enhanced = accounts ? deriveEnhancedAccounts(accounts) : [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Landmark className="h-4 w-4 text-[#6b7280]" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-[#1a1a2e]">Bank Accounts</h2>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div data-testid="bank-accounts-loading" className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        ) : enhanced.length > 0 ? (
          <ul className="space-y-4" data-testid="bank-accounts-list">
            {enhanced.map((account) => {
              const difference = account.statementBalance - account.xeroBalance;
              return (
                <li key={account.id} className="border-b border-[#e5e7eb] pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-[#1a1a2e]">{account.name}</p>
                      <p className="text-xs text-[#6b7280]">{account.code}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                    <div>
                      <p className="text-[#6b7280]">Statement</p>
                      <p className="font-medium text-[#1a1a2e]" data-testid={`statement-balance-${account.id}`}>
                        {formatCurrency(account.statementBalance, account.currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#6b7280]">In Xero</p>
                      <p className="font-medium text-[#1a1a2e]" data-testid={`xero-balance-${account.id}`}>
                        {formatCurrency(account.xeroBalance, account.currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#6b7280]">Difference</p>
                      <p
                        className={`font-medium ${difference !== 0 ? 'text-[#ef4444]' : 'text-[#10b981]'}`}
                        data-testid={`balance-diff-${account.id}`}
                      >
                        {formatCurrency(Math.abs(difference), account.currency)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {account.unreconciledCount > 0 && (
                      <Button
                        variant="primary"
                        size="sm"
                        data-testid={`reconcile-btn-${account.id}`}
                      >
                        Reconcile {account.unreconciledCount} items
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      data-testid={`import-statement-btn-${account.id}`}
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      Import
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-[#6b7280]" data-testid="bank-accounts-empty">
            No bank accounts
          </p>
        )}
      </CardContent>
    </Card>
  );
}
