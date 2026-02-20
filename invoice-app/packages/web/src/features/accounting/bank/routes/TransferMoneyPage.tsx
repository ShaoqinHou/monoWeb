import { useState, type FormEvent } from 'react';
import { PageContainer } from '../../../../components/layout/PageContainer';
import { Input } from '../../../../components/ui/Input';
import { Combobox } from '../../../../components/ui/Combobox';
import { Button } from '../../../../components/ui/Button';
import { useBankAccounts } from '../hooks/useBank';
import { useCreateBankTransaction } from '../hooks/useBankTransactions';
import { showToast } from '../../../dashboard/components/ToastContainer';

export function TransferMoneyPage() {
  const accountsQuery = useBankAccounts();
  const createMutation = useCreateBankTransaction();

  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState('');
  const [showTracking, setShowTracking] = useState(false);
  const [validationError, setValidationError] = useState('');

  const accounts = accountsQuery.data ?? [];
  const accountOptions = accounts.map((a) => ({
    value: a.id,
    label: `${a.name} (${a.accountNumber})`,
  }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (fromAccountId === toAccountId) {
      setValidationError('From and To accounts must be different.');
      return;
    }

    const parsedAmount = Math.abs(parseFloat(amount) || 0);
    if (parsedAmount <= 0) {
      setValidationError('Amount must be greater than zero.');
      return;
    }

    try {
      // Create outgoing transaction (negative from source)
      await createMutation.mutateAsync({
        accountId: fromAccountId,
        date,
        description: `Transfer to ${accounts.find((a) => a.id === toAccountId)?.name ?? toAccountId}`,
        amount: -parsedAmount,
        reference: reference || undefined,
      });

      // Create incoming transaction (positive to destination)
      await createMutation.mutateAsync({
        accountId: toAccountId,
        date,
        description: `Transfer from ${accounts.find((a) => a.id === fromAccountId)?.name ?? fromAccountId}`,
        amount: parsedAmount,
        reference: reference || undefined,
      });

      showToast('success', 'Transfer completed');
    } catch {
      showToast('error', 'Failed to complete transfer. Please try again.');
    }
  };

  return (
    <PageContainer
      title="Transfer Money"
      breadcrumbs={[
        { label: 'Bank Accounts', href: '/bank' },
        { label: 'Transfer Money' },
      ]}
    >
      <div className="max-w-2xl" data-testid="transfer-money-page">
        <form onSubmit={handleSubmit} className="space-y-4" data-testid="transfer-form">
          <h2 className="text-lg font-semibold text-gray-900">Transfer Between Accounts</h2>

          <Combobox
            label="From Account"
            options={accountOptions}
            value={fromAccountId}
            onChange={(v) => setFromAccountId(v)}
            placeholder="Select source account"
            data-testid="transfer-from"
          />

          <Combobox
            label="To Account"
            options={accountOptions}
            value={toAccountId}
            onChange={(v) => setToAccountId(v)}
            placeholder="Select destination account"
            data-testid="transfer-to"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              data-testid="transfer-amount"
            />

            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              data-testid="transfer-date"
            />
          </div>

          <Input
            label="Reference"
            placeholder="Optional reference"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            data-testid="transfer-reference"
          />

          {!showTracking && (
            <button
              type="button"
              className="text-sm font-medium text-blue-600 hover:underline"
              onClick={() => setShowTracking(true)}
              data-testid="add-tracking-link"
            >
              + add tracking
            </button>
          )}

          {showTracking && (
            <div className="rounded-md border border-gray-200 bg-gray-50 p-3" data-testid="tracking-section">
              <div className="text-sm text-gray-500">
                Tracking categories can be assigned after the transfer is created.
              </div>
            </div>
          )}

          {validationError && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700" data-testid="transfer-error">
              {validationError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" loading={createMutation.isPending} data-testid="transfer-submit">
              Transfer
            </Button>
          </div>
        </form>

      </div>
    </PageContainer>
  );
}
