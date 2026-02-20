import { useState, useCallback } from 'react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Dialog } from '../../../components/ui/Dialog';
import { formatCurrency } from '@shared/calc/currency';
import type { RecordPaymentData } from '../types';

interface RecordPaymentFormProps {
  billId: string;
  amountDue: number;
  currency: string;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: RecordPaymentData) => void;
  loading?: boolean;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function RecordPaymentForm({
  billId,
  amountDue,
  currency,
  open,
  onClose,
  onSubmit,
  loading = false,
}: RecordPaymentFormProps) {
  const [amount, setAmount] = useState(String(amountDue));
  const [date, setDate] = useState(todayISO());
  const [reference, setReference] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {};
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      errs.amount = 'Amount must be greater than 0';
    } else if (numAmount > amountDue) {
      errs.amount = `Amount cannot exceed ${formatCurrency(amountDue, currency)}`;
    }
    if (!date) errs.date = 'Date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [amount, amountDue, currency, date]);

  const handleSubmit = useCallback(() => {
    if (!validate()) return;
    onSubmit({
      billId,
      amount: parseFloat(amount),
      date,
      reference,
      bankAccount,
    });
  }, [validate, onSubmit, billId, amount, date, reference, bankAccount]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Record Payment"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} data-testid="payment-cancel-btn">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={loading}
            data-testid="payment-submit-btn"
          >
            Record Payment
          </Button>
        </>
      }
    >
      <div className="space-y-4" data-testid="record-payment-form">
        <div className="text-sm text-gray-500">
          Amount due: <span className="font-medium text-gray-900" data-testid="payment-amount-due">{formatCurrency(amountDue, currency)}</span>
        </div>
        <Input
          label="Amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0.01"
          step="0.01"
          error={errors.amount}
          data-testid="payment-amount-input"
        />
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          error={errors.date}
          data-testid="payment-date-input"
        />
        <Input
          label="Reference"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="e.g. CHQ-001"
          data-testid="payment-reference-input"
        />
        <Input
          label="Bank Account"
          value={bankAccount}
          onChange={(e) => setBankAccount(e.target.value)}
          placeholder="e.g. Business Cheque"
          data-testid="payment-bank-input"
        />
      </div>
    </Dialog>
  );
}
