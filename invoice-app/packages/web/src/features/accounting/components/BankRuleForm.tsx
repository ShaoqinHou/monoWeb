import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Combobox } from '../../../components/ui/Combobox';
import { Button } from '../../../components/ui/Button';
import type { SelectOption } from '../../../components/ui/Select';
import type { MatchField, MatchType, CreateBankRule } from '../hooks/useBankRules';

interface BankRuleFormProps {
  onSubmit: (data: CreateBankRule) => void;
  onCancel: () => void;
  loading?: boolean;
  initialData?: Partial<CreateBankRule>;
  bankAccountOptions?: SelectOption[];
  accountCodeOptions?: SelectOption[];
}

const MATCH_FIELD_OPTIONS: SelectOption[] = [
  { value: 'description', label: 'Description' },
  { value: 'reference', label: 'Reference' },
  { value: 'amount', label: 'Amount' },
];

const MATCH_TYPE_OPTIONS: SelectOption[] = [
  { value: 'contains', label: 'Contains' },
  { value: 'equals', label: 'Equals' },
  { value: 'starts_with', label: 'Starts With' },
];

export function BankRuleForm({
  onSubmit,
  onCancel,
  loading,
  initialData,
  bankAccountOptions,
  accountCodeOptions,
}: BankRuleFormProps) {
  const navigate = useNavigate();
  const [name, setName] = useState(initialData?.name ?? '');
  const [accountId, setAccountId] = useState(initialData?.accountId ?? '');
  const [matchField, setMatchField] = useState<MatchField>(initialData?.matchField ?? 'description');
  const [matchType, setMatchType] = useState<MatchType>(initialData?.matchType ?? 'contains');
  const [matchValue, setMatchValue] = useState(initialData?.matchValue ?? '');
  const [allocateToAccountCode, setAllocateToAccountCode] = useState(
    initialData?.allocateToAccountCode ?? '',
  );

  const isValid =
    name.trim().length > 0 &&
    accountId.trim().length > 0 &&
    matchValue.trim().length > 0 &&
    allocateToAccountCode.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    onSubmit({
      name: name.trim(),
      accountId: accountId.trim(),
      matchField,
      matchType,
      matchValue: matchValue.trim(),
      allocateToAccountCode: allocateToAccountCode.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="bank-rule-form">
      <Input
        label="Rule Name"
        placeholder="e.g. Office Supplies"
        value={name}
        onChange={(e) => setName(e.target.value)}
        data-testid="rule-name-input"
        required
      />

      {bankAccountOptions && bankAccountOptions.length > 0 ? (
        <Combobox
          label="Bank Account"
          options={bankAccountOptions}
          value={accountId}
          onChange={(v) => setAccountId(v)}
          placeholder="Select a bank account"
          data-testid="rule-account-select"
        />
      ) : (
        <Input
          label="Bank Account ID"
          placeholder="Bank account for this rule"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          data-testid="rule-account-input"
          required
        />
      )}

      <Select
        label="Match Field"
        options={MATCH_FIELD_OPTIONS}
        value={matchField}
        onChange={(e) => setMatchField(e.target.value as MatchField)}
        data-testid="rule-match-field"
      />

      <Select
        label="Match Type"
        options={MATCH_TYPE_OPTIONS}
        value={matchType}
        onChange={(e) => setMatchType(e.target.value as MatchType)}
        data-testid="rule-match-type"
      />

      <Input
        label="Match Value"
        placeholder="Value to match"
        value={matchValue}
        onChange={(e) => setMatchValue(e.target.value)}
        data-testid="rule-match-value"
        required
      />

      {accountCodeOptions && accountCodeOptions.length > 0 ? (
        <Combobox
          label="Allocate to Account Code"
          options={accountCodeOptions}
          value={allocateToAccountCode}
          onChange={(v) => setAllocateToAccountCode(v)}
          placeholder="Select an account"
          onCreateNew={() => navigate({ to: '/accounting/chart-of-accounts/new' })}
          data-testid="rule-allocate-select"
        />
      ) : (
        <Input
          label="Allocate to Account Code"
          placeholder="e.g. 6-0200"
          value={allocateToAccountCode}
          onChange={(e) => setAllocateToAccountCode(e.target.value)}
          data-testid="rule-allocate-code"
          required
        />
      )}

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" disabled={!isValid || loading} loading={loading}>
          {loading ? 'Saving...' : 'Save Rule'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
