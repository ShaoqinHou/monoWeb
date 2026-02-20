import { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Combobox } from '../../../components/ui/Combobox';
import { ReceiptUpload } from './ReceiptUpload';
import { useTaxRates } from '../../accounting/hooks/useTaxRates';
import { useAccounts } from '../../accounting/hooks/useAccounts';
import type { CreateExpense } from '@xero-replica/shared';

const MILEAGE_RATE_OPTIONS = [
  { value: '0.95', label: '$0.95/km (NZ standard)' },
  { value: '0.85', label: '$0.85/km (reduced rate)' },
  { value: 'custom', label: 'Custom rate' },
];

const CATEGORY_OPTIONS = [
  { value: 'Travel', label: 'Travel' },
  { value: 'Office Supplies', label: 'Office Supplies' },
  { value: 'Meals & Entertainment', label: 'Meals & Entertainment' },
  { value: 'Equipment', label: 'Equipment' },
  { value: 'Communications', label: 'Communications' },
  { value: 'Software', label: 'Software' },
  { value: 'Professional Services', label: 'Professional Services' },
  { value: 'Training', label: 'Training' },
  { value: 'Utilities', label: 'Utilities' },
  { value: 'Marketing', label: 'Marketing' },
];

const DEFAULT_ACCOUNT_CODE_OPTIONS = [
  { value: '200', label: '200', description: 'Sales' },
  { value: '260', label: '260', description: 'Other Revenue' },
  { value: '300', label: '300', description: 'Advertising' },
  { value: '310', label: '310', description: 'Bank Fees' },
  { value: '320', label: '320', description: 'Cleaning' },
  { value: '325', label: '325', description: 'Consulting & Accounting' },
  { value: '400', label: '400', description: 'Computer Equipment' },
  { value: '404', label: '404', description: 'Entertainment' },
  { value: '408', label: '408', description: 'General Expenses' },
  { value: '412', label: '412', description: 'Insurance' },
  { value: '416', label: '416', description: 'Light, Power, Heating' },
  { value: '420', label: '420', description: 'Motor Vehicle Expenses' },
  { value: '429', label: '429', description: 'Office Expenses' },
  { value: '433', label: '433', description: 'Printing & Stationery' },
  { value: '437', label: '437', description: 'Rent' },
  { value: '441', label: '441', description: 'Subscriptions' },
  { value: '445', label: '445', description: 'Telephone & Internet' },
  { value: '680', label: '680', description: 'Meals & Entertainment' },
  { value: '684', label: '684', description: 'Travel - National' },
  { value: '685', label: '685', description: 'Travel - International' },
];

const DEFAULT_TAX_RATE_OPTIONS = [
  { value: '15', label: 'GST on Expenses (15%)' },
  { value: '0', label: 'No GST (0%)' },
  { value: '9', label: 'GST on Imports (9%)' },
];

interface ExpenseFormProps {
  initialData?: Partial<CreateExpense>;
  onSubmit: (data: CreateExpense) => void;
  isLoading?: boolean;
}

export function ExpenseForm({ initialData, onSubmit, isLoading }: ExpenseFormProps) {
  const { data: taxRates } = useTaxRates();
  const { data: accounts } = useAccounts();

  const resolvedAccountCodeOptions = accounts && accounts.length > 0
    ? accounts.map((a) => ({
        value: a.code,
        label: `${a.code} - ${a.name}`,
      }))
    : DEFAULT_ACCOUNT_CODE_OPTIONS;

  const resolvedTaxRateOptions = taxRates && taxRates.length > 0
    ? taxRates.filter((r) => r.isActive).map((r) => ({
        value: String(r.rate),
        label: `${r.name} (${r.rate}%)`,
      }))
    : DEFAULT_TAX_RATE_OPTIONS;

  const [date, setDate] = useState(initialData?.date ?? new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() ?? '');
  const [category, setCategory] = useState(initialData?.category ?? '');
  const [accountCode, setAccountCode] = useState(initialData?.accountCode ?? '');
  const [taxRate, setTaxRate] = useState(initialData?.taxRate?.toString() ?? '15');
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [receiptUrl, setReceiptUrl] = useState<string | null>(initialData?.receiptUrl ?? null);
  const [showMileage, setShowMileage] = useState(
    !!(initialData?.mileageKm || initialData?.mileageRate),
  );
  const [mileageKm, setMileageKm] = useState(initialData?.mileageKm?.toString() ?? '');
  const [mileageRate, setMileageRate] = useState(initialData?.mileageRate?.toString() ?? '0.95');
  const [mileageRateMode, setMileageRateMode] = useState<string>(
    initialData?.mileageRate && !['0.95', '0.85'].includes(String(initialData.mileageRate))
      ? 'custom'
      : (initialData?.mileageRate?.toString() ?? '0.95'),
  );

  // Auto-calc: when mileage is on, update amount from km * rate
  const mileageCalcAmount = showMileage
    ? Math.round((parseFloat(mileageKm) || 0) * (parseFloat(mileageRate) || 0) * 100) / 100
    : 0;

  useEffect(() => {
    if (showMileage && mileageKm && mileageRate) {
      const calc = Math.round((parseFloat(mileageKm) || 0) * (parseFloat(mileageRate) || 0) * 100) / 100;
      if (calc > 0) {
        setAmount(calc.toString());
      }
    }
  }, [showMileage, mileageKm, mileageRate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || !description.trim()) return;

    const data: CreateExpense = {
      date,
      description: description.trim(),
      amount: parsedAmount,
      taxRate: parseFloat(taxRate) || 15,
      category: category || undefined,
      accountCode: accountCode || undefined,
      notes: notes || undefined,
      receiptUrl: receiptUrl ?? undefined,
      mileageKm: showMileage && mileageKm ? parseFloat(mileageKm) : undefined,
      mileageRate: showMileage && mileageRate ? parseFloat(mileageRate) : undefined,
    };

    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="expense-form">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          data-testid="expense-date"
        />
        <Combobox
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={(v) => setCategory(v)}
          placeholder="Select category"
          label="Category"
          data-testid="expense-category"
        />
      </div>

      <Input
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What was this expense for?"
        data-testid="expense-description"
        required
      />

      <div className="grid grid-cols-3 gap-4">
        <Input
          label="Amount"
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          data-testid="expense-amount"
          required
        />
        <Combobox
          options={resolvedAccountCodeOptions}
          value={accountCode}
          onChange={(v) => setAccountCode(v)}
          placeholder="Select account"
          label="Account Code"
          data-testid="expense-account-code"
        />
        <Combobox
          options={resolvedTaxRateOptions}
          value={taxRate}
          onChange={(v) => setTaxRate(v)}
          label="Tax Rate"
          data-testid="expense-tax-rate"
        />
      </div>

      <Input
        label="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Additional notes"
        data-testid="expense-notes"
      />

      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm" data-testid="receipt-toggle">
          <input
            type="checkbox"
            checked={!!receiptUrl}
            onChange={() => {
              if (receiptUrl) setReceiptUrl(null);
            }}
            className="h-4 w-4 rounded border-gray-300"
            readOnly={!receiptUrl}
          />
          Receipt
        </label>
        <ReceiptUpload value={receiptUrl} onChange={setReceiptUrl} />
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm" data-testid="mileage-toggle">
          <input
            type="checkbox"
            checked={showMileage}
            onChange={(e) => setShowMileage(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          Mileage Claim
        </label>
        {showMileage && (
          <div className="space-y-3" data-testid="mileage-fields">
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Distance (km)"
                type="number"
                step="0.1"
                value={mileageKm}
                onChange={(e) => setMileageKm(e.target.value)}
                placeholder="0.0"
                data-testid="expense-mileage-km"
              />
              <Select
                label="Rate"
                selectId="mileage-rate-select"
                options={MILEAGE_RATE_OPTIONS}
                value={mileageRateMode}
                onChange={(e) => {
                  const val = e.target.value;
                  setMileageRateMode(val);
                  if (val !== 'custom') {
                    setMileageRate(val);
                  }
                }}
                data-testid="expense-mileage-rate-select"
              />
              {mileageRateMode === 'custom' && (
                <Input
                  label="Custom Rate ($/km)"
                  type="number"
                  step="0.01"
                  value={mileageRate}
                  onChange={(e) => setMileageRate(e.target.value)}
                  data-testid="expense-mileage-rate"
                />
              )}
            </div>
            {mileageCalcAmount > 0 && (
              <p className="text-sm text-gray-600" data-testid="mileage-calc-amount">
                {mileageKm} km x ${mileageRate}/km = ${mileageCalcAmount.toFixed(2)}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 z-10 bg-white border-t py-3 flex gap-2">
        <Button type="submit" loading={isLoading} data-testid="expense-submit-button">
          Save Expense
        </Button>
      </div>
    </form>
  );
}
