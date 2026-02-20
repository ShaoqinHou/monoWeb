import { Select } from '../../../../components/ui/Select';
import type { BankAccount } from '../types';
import { formatCurrency } from '@shared/calc/currency';

interface BankAccountSelectorProps {
  accounts: BankAccount[] | undefined;
  selectedAccountId: string;
  onAccountChange: (accountId: string) => void;
  isLoading: boolean;
}

export function BankAccountSelector({
  accounts,
  selectedAccountId,
  onAccountChange,
  isLoading,
}: BankAccountSelectorProps) {
  const selectedAccount = accounts?.find((a) => a.id === selectedAccountId);

  return (
    <div className="space-y-3" data-testid="bank-account-selector">
      <Select
        label="Bank Account"
        selectId="bank-account-select"
        value={selectedAccountId}
        onChange={(e) => onAccountChange(e.target.value)}
        disabled={isLoading}
        options={
          accounts?.map((account) => ({
            value: account.id,
            label: `${account.name} (${account.accountNumber})`,
          })) ?? []
        }
        placeholder="Select a bank account"
      />

      {selectedAccount && (
        <div className="flex gap-6 text-sm" data-testid="balance-comparison">
          <div>
            <span className="text-gray-500">Statement Balance: </span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(selectedAccount.statementBalance)}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Xero Balance: </span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(selectedAccount.balance)}
            </span>
          </div>
          {selectedAccount.statementBalance !== selectedAccount.balance && (
            <div>
              <span className="text-gray-500">Difference: </span>
              <span className="font-semibold text-orange-600">
                {formatCurrency(selectedAccount.statementBalance - selectedAccount.balance)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
