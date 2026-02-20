import { useState, useCallback } from 'react';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Combobox } from '../../../components/ui/Combobox';
import { Button } from '../../../components/ui/Button';
import { BillLineItems } from './BillLineItems';
import type { BillLineItemFormData, InvoiceAmountType } from '../types';
import type { RecurringBillFrequency } from '../hooks/useRecurringBills';

interface Supplier {
  id: string;
  name: string;
}

export interface RecurringBillFormData {
  templateName: string;
  contactId: string;
  contactName: string;
  frequency: RecurringBillFrequency;
  nextDate: string;
  endDate: string;
  reference: string;
  amountType: InvoiceAmountType;
  lineItems: BillLineItemFormData[];
}

interface RecurringBillFormProps {
  suppliers: Supplier[];
  onSave: (data: RecurringBillFormData) => void;
  loading?: boolean;
  initialData?: Partial<RecurringBillFormData>;
  onCreateNew?: () => void;
}

const FREQUENCY_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'fortnightly', label: 'Fortnightly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'bimonthly', label: 'Bi-monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

const AMOUNT_TYPE_OPTIONS = [
  { value: 'exclusive', label: 'Tax Exclusive' },
  { value: 'inclusive', label: 'Tax Inclusive' },
  { value: 'no_tax', label: 'No Tax' },
];

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

export function RecurringBillForm({ suppliers, onSave, loading = false, initialData, onCreateNew }: RecurringBillFormProps) {
  const [templateName, setTemplateName] = useState(initialData?.templateName ?? '');
  const [contactId, setContactId] = useState(initialData?.contactId ?? '');
  const [contactName, setContactName] = useState(initialData?.contactName ?? '');
  const [frequency, setFrequency] = useState<RecurringBillFrequency>(initialData?.frequency ?? 'monthly');
  const [nextDate, setNextDate] = useState(initialData?.nextDate ?? todayISO());
  const [endDate, setEndDate] = useState(initialData?.endDate ?? '');
  const [reference, setReference] = useState(initialData?.reference ?? '');
  const [amountType, setAmountType] = useState<InvoiceAmountType>(initialData?.amountType ?? 'exclusive');
  const [lineItems, setLineItems] = useState<BillLineItemFormData[]>(
    initialData?.lineItems ?? [defaultLineItem()],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const supplierOptions = suppliers.map((s) => ({ value: s.id, label: s.name }));

  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {};
    if (!templateName.trim()) errs.templateName = 'Template name is required';
    if (!contactId) errs.contactId = 'Please select a supplier';
    if (!nextDate) errs.nextDate = 'Next bill date is required';
    if (lineItems.length === 0) errs.lineItems = 'At least one line item is required';
    const hasContent = lineItems.some((li) => li.description.trim() || li.unitPrice > 0);
    if (!hasContent) errs.lineItems = 'At least one line item must have a description or amount';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [templateName, contactId, nextDate, lineItems]);

  const handleSave = useCallback(() => {
    if (!validate()) return;
    const selectedSupplier = suppliers.find((s) => s.id === contactId);
    const data: RecurringBillFormData = {
      templateName,
      contactId,
      contactName: selectedSupplier?.name ?? contactName,
      frequency,
      nextDate,
      endDate,
      reference,
      amountType,
      lineItems,
    };
    onSave(data);
  }, [templateName, contactId, contactName, suppliers, frequency, nextDate, endDate, reference, amountType, lineItems, onSave, validate]);

  return (
    <div className="space-y-6" data-testid="recurring-bill-form">
      {/* Template name */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Template Name"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder="e.g. Monthly Office Rent"
          error={errors.templateName}
          data-testid="rb-template-name"
        />
        <Combobox
          options={supplierOptions}
          value={contactId}
          onChange={(v) => {
            setContactId(v);
            const supplier = suppliers.find((s) => s.id === v);
            if (supplier) setContactName(supplier.name);
          }}
          placeholder="Select a supplier..."
          label="Supplier / Contact"
          error={errors.contactId}
          onCreateNew={onCreateNew}
          data-testid="rb-contact-name"
        />
      </div>

      {/* Schedule fields */}
      <div className="grid grid-cols-3 gap-4">
        <Select
          label="Frequency"
          selectId="rb-frequency"
          options={FREQUENCY_OPTIONS}
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as RecurringBillFrequency)}
          data-testid="rb-frequency-select"
        />
        <Input
          label="Next Bill Date"
          type="date"
          value={nextDate}
          onChange={(e) => setNextDate(e.target.value)}
          error={errors.nextDate}
          data-testid="rb-next-date"
        />
        <Input
          label="End Date (optional)"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          data-testid="rb-end-date"
        />
      </div>

      {/* Reference + Amount Type */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Reference"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="e.g. PO-2024-001"
          data-testid="rb-reference"
        />
        <Select
          label="Amount Type"
          selectId="rb-amount-type"
          options={AMOUNT_TYPE_OPTIONS}
          value={amountType}
          onChange={(e) => setAmountType(e.target.value as InvoiceAmountType)}
          data-testid="rb-amount-type-select"
        />
      </div>

      {/* Line items */}
      {errors.lineItems && (
        <p className="text-sm text-red-500" role="alert" data-testid="rb-line-items-error">
          {errors.lineItems}
        </p>
      )}
      <BillLineItems
        lineItems={lineItems}
        amountType={amountType}
        onChange={setLineItems}
      />

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t">
        <Button
          variant="primary"
          onClick={handleSave}
          loading={loading}
          data-testid="rb-save-btn"
        >
          Save
        </Button>
      </div>
    </div>
  );
}
