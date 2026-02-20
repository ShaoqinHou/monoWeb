import { useState, useCallback } from 'react';
import { Input } from '../../../components/ui/Input';
import { Combobox } from '../../../components/ui/Combobox';
import { Button } from '../../../components/ui/Button';

interface Supplier {
  id: string;
  name: string;
}

export interface SupplierPrepaymentData {
  contactId: string;
  amount: number;
  date: string;
  reference: string;
}

interface SupplierPrepaymentFormProps {
  suppliers: Supplier[];
  onSave: (data: SupplierPrepaymentData) => void;
  loading?: boolean;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function SupplierPrepaymentForm({ suppliers, onSave, loading = false }: SupplierPrepaymentFormProps) {
  const [contactId, setContactId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [reference, setReference] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {};
    if (!contactId) errs.contactId = 'Please select a supplier';
    if (!date) errs.date = 'Date is required';
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) errs.amount = 'Amount must be positive';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [contactId, date, amount]);

  const handleSubmit = useCallback(() => {
    if (!validate()) return;
    onSave({
      contactId,
      amount: parseFloat(amount),
      date,
      reference,
    });
  }, [contactId, amount, date, reference, validate, onSave]);

  const supplierOptions = suppliers.map((s) => ({ value: s.id, label: s.name }));

  return (
    <div className="space-y-6" data-testid="supplier-prepayment-form">
      <h2 className="text-lg font-semibold">Record Supplier Prepayment</h2>

      <div className="grid grid-cols-2 gap-4">
        <Combobox
          options={supplierOptions}
          value={contactId}
          onChange={(v) => setContactId(v)}
          placeholder="Select a supplier..."
          label="Supplier"
          error={errors.contactId}
          data-testid="prepay-supplier-select"
        />
        <Input
          label="Reference"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="e.g. PREPAY-001"
          data-testid="prepay-reference-input"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          error={errors.date}
          data-testid="prepay-date-input"
        />
        <Input
          label="Amount"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={errors.amount}
          placeholder="0.00"
          data-testid="prepay-amount-input"
        />
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <Button
          variant="primary"
          onClick={handleSubmit}
          loading={loading}
          data-testid="prepay-save-btn"
        >
          Record Prepayment
        </Button>
      </div>
    </div>
  );
}
