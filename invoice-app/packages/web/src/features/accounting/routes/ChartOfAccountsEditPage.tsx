import { useState, useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { showToast } from '../../dashboard/components/ToastContainer';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import type { SelectOption } from '../../../components/ui/Select';
import { useAccount, useUpdateAccount } from '../hooks/useAccounts';

const ACCOUNT_TYPE_OPTIONS: SelectOption[] = [
  { value: 'revenue', label: 'Revenue' },
  { value: 'expense', label: 'Expense' },
  { value: 'asset', label: 'Asset' },
  { value: 'liability', label: 'Liability' },
  { value: 'equity', label: 'Equity' },
];

const TAX_TYPE_OPTIONS: SelectOption[] = [
  { value: 'none', label: 'No Tax' },
  { value: 'output', label: 'GST on Sales (Output)' },
  { value: 'input', label: 'GST on Purchases (Input)' },
];

export function ChartOfAccountsEditPage() {
  const { accountId } = useParams({ from: '/accounting/chart-of-accounts/$accountId/edit' });
  const navigate = useNavigate();
  const { data: account, isLoading, error: loadError } = useAccount(accountId);
  const updateAccount = useUpdateAccount();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('revenue');
  const [taxType, setTaxType] = useState('none');
  const [description, setDescription] = useState('');

  // Pre-fill form when account loads
  useEffect(() => {
    if (account) {
      setCode(account.code);
      setName(account.name);
      setType(account.type);
      setTaxType(account.taxType);
      setDescription(account.description ?? '');
    }
  }, [account]);

  const isValid = code.trim().length > 0 && name.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updateAccount.mutate(
      {
        id: accountId,
        data: {
          code: code.trim(),
          name: name.trim(),
          type: type as 'revenue' | 'expense' | 'asset' | 'liability' | 'equity',
          taxType: taxType as 'output' | 'input' | 'none',
          description: description.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          showToast('success', 'Account saved');
          navigate({ to: '/accounting/chart-of-accounts' });
        },
        onError: (err) => {
          showToast('error', err.message || 'Failed to save account');
        },
      },
    );
  };

  if (isLoading) {
    return (
      <PageContainer
        title="Edit Account"
        breadcrumbs={[
          { label: 'Accounting', href: '/accounting' },
          { label: 'Chart of Accounts', href: '/accounting/chart-of-accounts' },
          { label: 'Loading...' },
        ]}
      >
        <p className="text-gray-500" data-testid="edit-account-loading">Loading account...</p>
      </PageContainer>
    );
  }

  if (loadError || !account) {
    return (
      <PageContainer
        title="Account Not Found"
        breadcrumbs={[
          { label: 'Accounting', href: '/accounting' },
          { label: 'Chart of Accounts', href: '/accounting/chart-of-accounts' },
          { label: 'Not Found' },
        ]}
      >
        <p className="text-gray-500" data-testid="edit-account-not-found">
          The requested account could not be found.
        </p>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Edit Account"
      breadcrumbs={[
        { label: 'Accounting', href: '/accounting' },
        { label: 'Chart of Accounts', href: '/accounting/chart-of-accounts' },
        { label: `Edit: ${account.name}` },
      ]}
    >
      <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-6" data-testid="edit-account-form">
        <Input
          label="Account Code"
          id="account-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. 4-0000"
          required
        />

        <Input
          label="Account Name"
          id="account-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sales"
          required
        />

        <Select
          label="Account Type"
          id="account-type"
          options={ACCOUNT_TYPE_OPTIONS}
          value={type}
          onChange={(e) => setType(e.target.value)}
        />

        <Select
          label="Tax Type"
          id="tax-type"
          options={TAX_TYPE_OPTIONS}
          value={taxType}
          onChange={(e) => setTaxType(e.target.value)}
        />

        <Input
          label="Description"
          id="account-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
        />

        <div className="sticky bottom-0 z-10 bg-white border-t py-3 flex gap-4">
          <Button type="submit" disabled={!isValid || updateAccount.isPending}>
            {updateAccount.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate({ to: '/accounting/chart-of-accounts' })}
          >
            Cancel
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
