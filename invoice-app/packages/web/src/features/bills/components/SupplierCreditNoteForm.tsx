import { useState, useCallback } from 'react';
import { Input } from '../../../components/ui/Input';
import { Combobox } from '../../../components/ui/Combobox';
import { Button } from '../../../components/ui/Button';

interface Supplier {
  id: string;
  name: string;
}

interface SupplierCreditNoteFormData {
  contactId: string;
  date: string;
  reference: string;
  subTotal: number;
  totalTax: number;
  total: number;
}

interface SupplierCreditNoteFormProps {
  suppliers: Supplier[];
  onSave: (data: SupplierCreditNoteFormData) => void;
  loading?: boolean;
  onCreateNew?: () => void;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function SupplierCreditNoteForm({ suppliers, onSave, loading = false, onCreateNew }: SupplierCreditNoteFormProps) {
  const [contactId, setContactId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState('');
  const [taxRate, setTaxRate] = useState('15');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const parsedAmount = parseFloat(amount) || 0;
  const parsedTaxRate = parseFloat(taxRate) || 0;
  const taxAmount = Math.round(parsedAmount * parsedTaxRate) / 100;
  const total = Math.round((parsedAmount + taxAmount) * 100) / 100;

  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {};
    if (!contactId) errs.contactId = 'Please select a supplier';
    if (!date) errs.date = 'Date is required';
    if (parsedAmount <= 0) errs.amount = 'Amount must be positive';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [contactId, date, parsedAmount]);

  const handleSubmit = useCallback(() => {
    if (!validate()) return;
    onSave({
      contactId,
      date,
      reference,
      subTotal: parsedAmount,
      totalTax: taxAmount,
      total,
    });
  }, [contactId, date, reference, parsedAmount, taxAmount, total, validate, onSave]);

  const supplierOptions = suppliers.map((s) => ({ value: s.id, label: s.name }));

  return (
    <div className="space-y-6" data-testid="supplier-credit-note-form">
      <h2 className="text-lg font-semibold">New Supplier Credit Note (Debit Note)</h2>

      <div className="grid grid-cols-2 gap-4">
        <Combobox
          options={supplierOptions}
          value={contactId}
          onChange={(v) => setContactId(v)}
          placeholder="Select a supplier..."
          label="Supplier"
          error={errors.contactId}
          onCreateNew={onCreateNew}
          data-testid="scn-supplier-select"
        />
        <Input
          label="Reference"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="e.g. DN-001"
          data-testid="scn-reference-input"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          error={errors.date}
          data-testid="scn-date-input"
        />
        <Input
          label="Amount (excl. tax)"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={errors.amount}
          placeholder="0.00"
          data-testid="scn-amount-input"
        />
        <Input
          label="Tax Rate (%)"
          type="number"
          step="0.1"
          value={taxRate}
          onChange={(e) => setTaxRate(e.target.value)}
          data-testid="scn-tax-rate-input"
        />
      </div>

      <div className="text-sm text-gray-600 space-y-1" data-testid="scn-totals">
        <p>Tax: ${taxAmount.toFixed(2)}</p>
        <p className="font-semibold">Total: ${total.toFixed(2)}</p>
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <Button
          variant="primary"
          onClick={handleSubmit}
          loading={loading}
          data-testid="scn-save-btn"
        >
          Save Credit Note
        </Button>
      </div>
    </div>
  );
}
