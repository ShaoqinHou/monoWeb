import { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useSplitPayments, useUpdateSplitPayments } from '../hooks/useSplitPayments';
import type { SplitPaymentAccount } from '../hooks/useSplitPayments';
import { Trash2, Plus } from 'lucide-react';

interface SplitPaymentFormProps {
  employeeId: string;
  netPay?: number;
}

const TYPE_OPTIONS = [
  { value: 'fixed', label: 'Fixed Amount ($)' },
  { value: 'percentage', label: 'Percentage (%)' },
];

const MAX_ACCOUNTS = 3;

export function SplitPaymentForm({ employeeId, netPay = 5000 }: SplitPaymentFormProps) {
  const { data: config, isLoading } = useSplitPayments(employeeId);
  const updateMutation = useUpdateSplitPayments();
  const [accounts, setAccounts] = useState<SplitPaymentAccount[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (config) {
      setAccounts(config.accounts);
    }
  }, [config]);

  if (isLoading) {
    return <div data-testid="split-payment-loading">Loading split payment settings...</div>;
  }

  const validate = (accs: SplitPaymentAccount[]): string | null => {
    const secondary = accs.filter((a) => !a.isPrimary);
    let totalAllocated = 0;

    for (const acc of secondary) {
      if (acc.type === 'fixed') {
        totalAllocated += acc.amount;
      } else {
        totalAllocated += (acc.amount / 100) * netPay;
      }
    }

    if (totalAllocated > netPay) {
      return `Split amounts ($${totalAllocated.toFixed(2)}) exceed net pay ($${netPay.toFixed(2)})`;
    }

    return null;
  };

  const updateAccount = (index: number, updates: Partial<SplitPaymentAccount>) => {
    const updated = accounts.map((acc, i) => (i === index ? { ...acc, ...updates } : acc));
    setAccounts(updated);
    setValidationError(validate(updated));
  };

  const addAccount = () => {
    if (accounts.length >= MAX_ACCOUNTS) return;
    const updated = [...accounts, { bankAccount: '', type: 'fixed' as const, amount: 0, isPrimary: false }];
    setAccounts(updated);
  };

  const removeAccount = (index: number) => {
    if (accounts[index].isPrimary) return; // Cannot remove primary
    const updated = accounts.filter((_, i) => i !== index);
    setAccounts(updated);
    setValidationError(validate(updated));
  };

  const handleSave = () => {
    const error = validate(accounts);
    if (error) {
      setValidationError(error);
      return;
    }
    updateMutation.mutate({ employeeId, accounts });
  };

  return (
    <div className="space-y-6" data-testid="split-payment-form">
      <h3 className="text-lg font-semibold text-[#1a1a2e]">Split Payment Configuration</h3>
      <p className="text-sm text-[#6b7280]">
        Configure how pay is split across bank accounts. The primary account receives the remainder after other allocations.
      </p>

      <div className="space-y-4">
        {accounts.map((account, index) => (
          <div
            key={index}
            className="flex items-end gap-3 rounded border border-[#e5e7eb] p-4"
            data-testid={`split-account-${index}`}
          >
            <div className="flex-1">
              <Input
                label={account.isPrimary ? 'Primary Account (remainder)' : `Account ${index + 1}`}
                value={account.bankAccount}
                onChange={(e) => updateAccount(index, { bankAccount: e.target.value })}
                placeholder="XX-XXXX-XXXXXXX-XX"
                aria-label={`Bank account ${index}`}
              />
            </div>

            {!account.isPrimary && (
              <>
                <div className="w-40">
                  <Select
                    label="Type"
                    options={TYPE_OPTIONS}
                    value={account.type}
                    onChange={(e) => updateAccount(index, { type: e.target.value as 'fixed' | 'percentage' })}
                    aria-label={`Account ${index} type`}
                  />
                </div>
                <div className="w-32">
                  <Input
                    label={account.type === 'fixed' ? 'Amount ($)' : 'Percentage (%)'}
                    type="number"
                    min="0"
                    max={account.type === 'percentage' ? '100' : undefined}
                    step={account.type === 'percentage' ? '1' : '0.01'}
                    value={String(account.amount)}
                    onChange={(e) => updateAccount(index, { amount: parseFloat(e.target.value) || 0 })}
                    aria-label={`Account ${index} amount`}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAccount(index)}
                  aria-label={`Remove account ${index}`}
                  data-testid={`remove-account-${index}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        ))}
      </div>

      {accounts.length < MAX_ACCOUNTS && (
        <Button variant="outline" size="sm" onClick={addAccount} data-testid="add-account-btn">
          <Plus className="h-4 w-4 mr-1" />
          Add Account
        </Button>
      )}

      {validationError && (
        <p className="text-sm text-red-600" role="alert" data-testid="split-validation-error">
          {validationError}
        </p>
      )}

      <div className="flex gap-2">
        <Button onClick={handleSave} loading={updateMutation.isPending} data-testid="save-split-btn">
          Save Split Configuration
        </Button>
      </div>
    </div>
  );
}
