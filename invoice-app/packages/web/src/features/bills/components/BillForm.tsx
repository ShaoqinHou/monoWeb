import { useState, useCallback } from 'react';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Combobox } from '../../../components/ui/Combobox';
import { Button } from '../../../components/ui/Button';
import { BillLineItems } from './BillLineItems';
import type { BillFormData, BillLineItemFormData, InvoiceAmountType, RecurrenceFrequency } from '../types';
import { RECURRENCE_OPTIONS, computeNextRecurrence } from '../types';

interface Supplier {
  id: string;
  name: string;
}

interface BillFormProps {
  suppliers: Supplier[];
  onSave: (data: BillFormData, action: 'draft' | 'submit') => void;
  loading?: boolean;
  initialData?: Partial<BillFormData>;
  currencyOptions?: Array<{ value: string; label: string; rate?: number }>;
  accountOptions?: Array<{ value: string; label: string }>;
  taxRateOptions?: Array<{ value: string; label: string }>;
  onCreateNewSupplier?: () => void;
}

const AMOUNT_TYPE_OPTIONS = [
  { value: 'exclusive', label: 'Tax Exclusive' },
  { value: 'inclusive', label: 'Tax Inclusive' },
  { value: 'no_tax', label: 'No Tax' },
];

const DEFAULT_CURRENCY_OPTIONS = [
  { value: 'NZD', label: 'NZD - New Zealand Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'EUR', label: 'EUR - Euro' },
];

const EXCHANGE_RATES: Record<string, number> = {
  NZD: 1.0,
  AUD: 0.92,
  USD: 0.61,
  GBP: 0.48,
  EUR: 0.56,
};

function defaultLineItem(): BillLineItemFormData {
  return {
    description: '',
    quantity: 1,
    unitPrice: 0,
    accountCode: '',
    taxRate: 15,
    discount: 0,
  };
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function plus30DaysISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

export function BillForm({ suppliers, onSave, loading = false, initialData, currencyOptions, accountOptions, taxRateOptions, onCreateNewSupplier }: BillFormProps) {
  const resolvedCurrencyOptions = currencyOptions && currencyOptions.length > 0 ? currencyOptions : DEFAULT_CURRENCY_OPTIONS;
  const [contactId, setContactId] = useState(initialData?.contactId ?? '');
  const [reference, setReference] = useState(initialData?.reference ?? '');
  const [amountType, setAmountType] = useState<InvoiceAmountType>(initialData?.amountType ?? 'exclusive');
  const [currency, setCurrency] = useState(initialData?.currency ?? 'NZD');
  const [exchangeRate, setExchangeRate] = useState(initialData?.exchangeRate ?? 1.0);
  const [date, setDate] = useState(initialData?.date ?? todayISO());
  const [dueDate, setDueDate] = useState(initialData?.dueDate ?? plus30DaysISO());
  const [recurrence, setRecurrence] = useState<RecurrenceFrequency>(initialData?.recurrence ?? 'none');
  const [lineItems, setLineItems] = useState<BillLineItemFormData[]>(
    initialData?.lineItems ?? [defaultLineItem()],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const nextRecurrenceDate = computeNextRecurrence(date, recurrence);

  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {};
    if (!contactId) errs.contactId = 'Please select a supplier';
    if (!date) errs.date = 'Date is required';
    if (!dueDate) errs.dueDate = 'Due date is required';
    if (lineItems.length === 0) errs.lineItems = 'At least one line item is required';
    const hasContent = lineItems.some((li) => li.description.trim() || li.unitPrice > 0);
    if (!hasContent) errs.lineItems = 'At least one line item must have a description or amount';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [contactId, date, dueDate, lineItems]);

  const handleSubmit = useCallback(
    (action: 'draft' | 'submit') => {
      if (!validate()) return;
      const data: BillFormData = {
        contactId,
        reference,
        amountType,
        currency,
        exchangeRate,
        date,
        dueDate,
        lineItems,
        recurrence,
      };
      onSave(data, action);
    },
    [contactId, reference, amountType, currency, exchangeRate, date, dueDate, lineItems, recurrence, onSave, validate],
  );

  const supplierOptions = suppliers.map((s) => ({ value: s.id, label: s.name }));

  return (
    <div className="space-y-6" data-testid="bill-form">
      {/* Supplier */}
      <div className="grid grid-cols-2 gap-4">
        <Combobox
          options={supplierOptions}
          value={contactId}
          onChange={(v) => setContactId(v)}
          onCreateNew={onCreateNewSupplier}
          placeholder="Select a supplier..."
          label="Supplier"
          error={errors.contactId}
          data-testid="bill-supplier-select"
        />
        <Input
          label="Reference"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="e.g. PO-2024-001"
          data-testid="bill-reference-input"
        />
      </div>

      {/* Date fields + amount type */}
      <div className="grid grid-cols-3 gap-4">
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          error={errors.date}
          data-testid="bill-date-input"
        />
        <Input
          label="Due Date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          error={errors.dueDate}
          data-testid="bill-due-date-input"
        />
        <Select
          label="Amount Type"
          selectId="bill-amount-type"
          options={AMOUNT_TYPE_OPTIONS}
          value={amountType}
          onChange={(e) => setAmountType(e.target.value as InvoiceAmountType)}
          data-testid="bill-amount-type-select"
        />
      </div>

      {/* Currency */}
      <div className="grid grid-cols-3 gap-4">
        <Select
          label="Currency"
          selectId="bill-currency"
          options={resolvedCurrencyOptions}
          value={currency}
          onChange={(e) => {
            const newCurrency = e.target.value;
            setCurrency(newCurrency);
            const matchedOption = resolvedCurrencyOptions.find(o => o.value === newCurrency);
            setExchangeRate(matchedOption?.rate ?? EXCHANGE_RATES[newCurrency] ?? 1.0);
          }}
          data-testid="bill-currency-select"
        />
        {currency !== 'NZD' && (
          <>
            <Input
              label="Exchange Rate"
              type="number"
              value={String(exchangeRate)}
              onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 1.0)}
              data-testid="exchange-rate-input"
              step="0.0001"
              min="0.0001"
            />
            <div className="flex items-end">
              <p className="text-sm text-gray-500 pb-2" data-testid="exchange-rate-text">
                1 {currency} = {(1 / exchangeRate).toFixed(4)} NZD
              </p>
            </div>
          </>
        )}
      </div>

      {/* Recurrence */}
      <div className="grid grid-cols-3 gap-4">
        <Select
          label="Repeat"
          selectId="bill-recurrence"
          options={RECURRENCE_OPTIONS}
          value={recurrence}
          onChange={(e) => setRecurrence(e.target.value as RecurrenceFrequency)}
          data-testid="bill-recurrence-select"
        />
        {nextRecurrenceDate && (
          <div className="col-span-2 flex items-end">
            <p className="text-sm text-gray-500 pb-2" data-testid="next-recurrence-date">
              Next recurrence: {nextRecurrenceDate}
            </p>
          </div>
        )}
      </div>

      {/* Line items */}
      {errors.lineItems && (
        <p className="text-sm text-red-500" role="alert" data-testid="line-items-error">
          {errors.lineItems}
        </p>
      )}
      <BillLineItems
        lineItems={lineItems}
        amountType={amountType}
        onChange={setLineItems}
        accountOptions={accountOptions}
        taxRateOptions={taxRateOptions}
      />

      {/* Actions */}
      <div className="sticky bottom-0 z-10 bg-white flex items-center gap-3 pt-4 border-t">
        <Button
          variant="secondary"
          onClick={() => handleSubmit('draft')}
          loading={loading}
          data-testid="save-draft-btn"
        >
          Save as Draft
        </Button>
        <Button
          variant="primary"
          onClick={() => handleSubmit('submit')}
          loading={loading}
          data-testid="submit-bill-btn"
        >
          Submit
        </Button>
      </div>
    </div>
  );
}
