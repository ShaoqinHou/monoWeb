import { useState, type FormEvent } from 'react';
import { Input } from '../../../../components/ui/Input';
import { Combobox } from '../../../../components/ui/Combobox';
import { Button } from '../../../../components/ui/Button';
import { useTaxRates } from '../../hooks/useTaxRates';
import type { BankAccount } from '../types';

export interface MoneyFormData {
  date: string;
  payee: string;
  accountId: string;
  amount: string;
  taxRate: string;
  reference: string;
  description: string;
}

interface MoneyFormProps {
  type: 'spend' | 'receive';
  accounts: BankAccount[];
  onSubmit: (data: MoneyFormData) => void;
  isLoading: boolean;
}

const DEFAULT_TAX_OPTIONS = [
  { value: '0', label: 'No Tax (0%)' },
  { value: '15', label: 'GST on Income (15%)' },
  { value: '9', label: 'GST on Imports (9%)' },
];

export function MoneyForm({ type, accounts, onSubmit, isLoading }: MoneyFormProps) {
  const { data: taxRates } = useTaxRates();
  const resolvedTaxOptions = taxRates && taxRates.length > 0
    ? taxRates.filter((r) => r.isActive).map((r) => ({
        value: String(r.rate),
        label: `${r.name} (${r.rate}%)`,
      }))
    : DEFAULT_TAX_OPTIONS;

  const [form, setForm] = useState<MoneyFormData>({
    date: new Date().toISOString().slice(0, 10),
    payee: '',
    accountId: '',
    amount: '',
    taxRate: '0',
    reference: '',
    description: '',
  });

  const handleChange = (field: keyof MoneyFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const isSpend = type === 'spend';
  const title = isSpend ? 'Spend Money' : 'Receive Money';
  const payeeLabel = isSpend ? 'Payee' : 'Payer';
  const submitLabel = isSpend ? 'Record Spend' : 'Record Receipt';

  const accountOptions = accounts.map((a) => ({
    value: a.id,
    label: `${a.name} (${a.accountNumber})`,
  }));

  return (
    <form onSubmit={handleSubmit} data-testid="money-form" className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Date"
          type="date"
          value={form.date}
          onChange={(e) => handleChange('date', e.target.value)}
          required
          data-testid="money-date"
        />

        <Input
          label={payeeLabel}
          placeholder={`Search ${payeeLabel.toLowerCase()}...`}
          value={form.payee}
          onChange={(e) => handleChange('payee', e.target.value)}
          required
          data-testid="money-payee"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Combobox
          label="Account"
          options={accountOptions}
          value={form.accountId}
          onChange={(v) => handleChange('accountId', v)}
          placeholder="Select account"
          data-testid="money-account"
        />

        <Input
          label="Amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={form.amount}
          onChange={(e) => handleChange('amount', e.target.value)}
          required
          data-testid="money-amount"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Combobox
          label="Tax Rate"
          options={resolvedTaxOptions}
          value={form.taxRate}
          onChange={(v) => handleChange('taxRate', v)}
          data-testid="money-tax"
        />

        <Input
          label="Reference"
          placeholder="Reference number"
          value={form.reference}
          onChange={(e) => handleChange('reference', e.target.value)}
          data-testid="money-reference"
        />
      </div>

      <Input
        label="Description"
        placeholder="What is this for?"
        value={form.description}
        onChange={(e) => handleChange('description', e.target.value)}
        data-testid="money-description"
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" loading={isLoading} data-testid="money-submit">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
