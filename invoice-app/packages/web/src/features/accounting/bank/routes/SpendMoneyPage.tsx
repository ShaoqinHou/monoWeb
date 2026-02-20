import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { PageContainer } from '../../../../components/layout/PageContainer';
import { Button } from '../../../../components/ui/Button';
import { MoneyForm, type MoneyFormData } from '../components/MoneyForm';
import { useBankAccounts } from '../hooks/useBank';
import { useCreateBankTransaction } from '../hooks/useBankTransactions';
import { showToast } from '../../../dashboard/components/ToastContainer';

export function SpendMoneyPage() {
  const accountsQuery = useBankAccounts();
  const createMutation = useCreateBankTransaction();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  const accounts = accountsQuery.data ?? [];

  const handleNext = () => {
    if (selectedAccountId) {
      setStep(2);
    }
  };

  const handleSubmit = (data: MoneyFormData) => {
    const amount = -Math.abs(parseFloat(data.amount) || 0);
    createMutation.mutate(
      {
        accountId: selectedAccountId || data.accountId,
        date: data.date,
        description: data.description || data.payee,
        amount,
        reference: data.reference || undefined,
        category: data.accountId,
      },
      {
        onSuccess: () => {
          showToast('success', 'Transaction recorded');
        },
        onError: (error: Error) => {
          showToast('error', error.message || 'Failed to record transaction');
        },
      },
    );
  };

  return (
    <PageContainer
      title="Spend Money"
      breadcrumbs={[
        { label: 'Bank', href: '/bank' },
        { label: 'Spend Money' },
      ]}
    >
      <div className="max-w-2xl" data-testid="spend-money-page">
        {step === 1 && (
          <div data-testid="spend-step-1">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Select Bank Account
            </h2>
            <p className="mb-4 text-sm text-gray-500">
              Choose which bank account this payment will come from.
            </p>
            <div className="space-y-2" data-testid="account-radio-group">
              {accounts.map((account) => (
                <label
                  key={account.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 ${
                    selectedAccountId === account.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                  data-testid={`account-radio-${account.id}`}
                >
                  <input
                    type="radio"
                    name="bank-account"
                    value={account.id}
                    checked={selectedAccountId === account.id}
                    onChange={() => setSelectedAccountId(account.id)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{account.name}</div>
                    <div className="text-xs text-gray-500">{account.accountNumber}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="mt-6 flex gap-2">
              <Link to="/bank">
                <Button variant="outline" data-testid="spend-cancel-btn">
                  Cancel
                </Button>
              </Link>
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={!selectedAccountId}
                data-testid="spend-next-btn"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div data-testid="spend-step-2">
            <MoneyForm
              type="spend"
              accounts={accounts}
              onSubmit={handleSubmit}
              isLoading={createMutation.isPending}
            />
          </div>
        )}
      </div>
    </PageContainer>
  );
}
