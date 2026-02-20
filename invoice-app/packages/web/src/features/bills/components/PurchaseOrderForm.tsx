import { useState, useCallback, useMemo } from 'react';
import { Input } from '../../../components/ui/Input';
import { Combobox } from '../../../components/ui/Combobox';
import { Button } from '../../../components/ui/Button';
import { BillLineItems } from './BillLineItems';
import type { BillLineItemFormData, InvoiceAmountType } from '../types';

export interface PurchaseOrderFormData {
  contactId: string;
  contactName: string;
  date: string;
  deliveryDate: string;
  deliveryAddress: string;
  reference: string;
  lineItems: BillLineItemFormData[];
}

interface Supplier {
  id: string;
  name: string;
}

interface ComboboxOption {
  value: string;
  label: string;
}

interface PurchaseOrderFormProps {
  onSave: (data: PurchaseOrderFormData, action: 'draft' | 'submit') => void;
  loading?: boolean;
  initialData?: Partial<PurchaseOrderFormData>;
  suppliers?: Supplier[];
  onCreateNew?: () => void;
  accountOptions?: ComboboxOption[];
  taxRateOptions?: ComboboxOption[];
}

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

function plus14DaysISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

export function PurchaseOrderForm({ onSave, loading = false, initialData, suppliers = [], onCreateNew, accountOptions, taxRateOptions }: PurchaseOrderFormProps) {
  const [contactId, setContactId] = useState(initialData?.contactId ?? '');
  const [contactName, setContactName] = useState(initialData?.contactName ?? '');
  const [date, setDate] = useState(initialData?.date ?? todayISO());
  const [deliveryDate, setDeliveryDate] = useState(initialData?.deliveryDate ?? plus14DaysISO());
  const [deliveryAddress, setDeliveryAddress] = useState(initialData?.deliveryAddress ?? '');
  const [reference, setReference] = useState(initialData?.reference ?? '');
  const [lineItems, setLineItems] = useState<BillLineItemFormData[]>(
    initialData?.lineItems ?? [defaultLineItem()],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const amountType: InvoiceAmountType = 'exclusive';

  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {};
    if (!contactId.trim()) errs.contactName = 'Supplier is required';
    if (!date) errs.date = 'Order date is required';
    if (lineItems.length === 0) errs.lineItems = 'At least one line item is required';
    const hasContent = lineItems.some((li) => li.description.trim() || li.unitPrice > 0);
    if (!hasContent) errs.lineItems = 'At least one line item must have a description or amount';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [contactId, date, lineItems]);

  const handleSubmit = useCallback(
    (action: 'draft' | 'submit') => {
      if (!validate()) return;
      const data: PurchaseOrderFormData = {
        contactId,
        contactName,
        date,
        deliveryDate,
        deliveryAddress,
        reference,
        lineItems,
      };
      onSave(data, action);
    },
    [contactId, contactName, date, deliveryDate, deliveryAddress, reference, lineItems, onSave, validate],
  );

  const supplierOptions = useMemo(() => {
    const opts = suppliers.map((s) => ({ value: s.id, label: s.name }));
    // Ensure the initial supplier appears as an option even if not in suppliers list
    const initialId = initialData?.contactId;
    const initialName = initialData?.contactName;
    if (initialId && initialName && !opts.find((o) => o.value === initialId)) {
      opts.unshift({ value: initialId, label: initialName });
    }
    return opts;
  }, [suppliers, initialData?.contactId, initialData?.contactName]);

  return (
    <div className="space-y-6" data-testid="po-form">
      {/* Supplier / Reference */}
      <div className="grid grid-cols-2 gap-4">
        <Combobox
          options={supplierOptions}
          value={contactId}
          onChange={(v) => {
            setContactId(v);
            const found = supplierOptions.find((o) => o.value === v);
            setContactName(found?.label ?? '');
          }}
          onCreateNew={onCreateNew}
          placeholder="Select a supplier..."
          label="Supplier"
          error={errors.contactName}
          data-testid="po-supplier-input"
        />
        <Input
          label="Reference"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="e.g. PO-2024-001"
          data-testid="po-reference-input"
        />
      </div>

      {/* Date fields */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Order Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          error={errors.date}
          data-testid="po-date-input"
        />
        <Input
          label="Delivery Date"
          type="date"
          value={deliveryDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
          data-testid="po-delivery-date-input"
        />
      </div>

      {/* Delivery address */}
      <Input
        label="Delivery Address"
        value={deliveryAddress}
        onChange={(e) => setDeliveryAddress(e.target.value)}
        placeholder="Enter delivery address..."
        data-testid="po-delivery-address-input"
      />

      {/* Line items */}
      {errors.lineItems && (
        <p className="text-sm text-red-500" role="alert" data-testid="po-line-items-error">
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
      <div className="sticky bottom-0 z-10 bg-white flex items-center gap-3 pt-4 border-t py-3">
        <Button
          variant="secondary"
          onClick={() => handleSubmit('draft')}
          loading={loading}
          data-testid="po-save-draft-btn"
        >
          Save as Draft
        </Button>
        <Button
          variant="primary"
          onClick={() => handleSubmit('submit')}
          loading={loading}
          data-testid="po-submit-btn"
        >
          Submit
        </Button>
      </div>
    </div>
  );
}
