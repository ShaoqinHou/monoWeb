import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Dialog } from '../../../components/ui/Dialog';
import { formatCurrency } from '@xero-replica/shared';

export interface PaymentRecord {
  amount: number;
  date: string;
  reference: string;
}

export interface RecordPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onRecord: (payment: PaymentRecord) => void;
  amountDue: number;
  currency: string;
  existingPayments?: PaymentRecord[];
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function RecordPaymentDialog({
  open,
  onClose,
  onRecord,
  amountDue,
  currency,
  existingPayments = [],
}: RecordPaymentDialogProps) {
  const [amount, setAmount] = useState(amountDue.toString());
  const [date, setDate] = useState(todayStr());
  const [reference, setReference] = useState('');

  const parsedAmount = parseFloat(amount) || 0;
  const isOverpayment = parsedAmount > amountDue;
  const overpaymentAmount = isOverpayment ? parsedAmount - amountDue : 0;
  const remaining = amountDue - parsedAmount;

  const handleRecord = () => {
    onRecord({ amount: parsedAmount, date, reference });
    onClose();
  };

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Record Payment"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} data-testid="payment-cancel-button">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleRecord}
            disabled={parsedAmount <= 0}
            data-testid="payment-record-button"
          >
            Record Payment
          </Button>
        </>
      }
    >
      <div className="space-y-4" data-testid="record-payment-dialog">
        <div className="text-sm text-gray-600">
          Amount Due: <span className="font-semibold" data-testid="payment-amount-due">{formatCurrency(amountDue, currency)}</span>
        </div>

        <Input
          label="Payment Amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          data-testid="payment-amount-input"
        />

        <Input
          label="Payment Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          data-testid="payment-date-input"
        />

        <Input
          label="Reference"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Optional payment reference"
          data-testid="payment-reference-input"
        />

        {parsedAmount > 0 && parsedAmount < amountDue && (
          <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800" data-testid="partial-payment-info">
            Remaining after payment: <span className="font-semibold" data-testid="remaining-amount">{formatCurrency(remaining, currency)}</span>
          </div>
        )}

        {isOverpayment && (
          <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800" data-testid="overpayment-warning">
            This will create an overpayment of <span className="font-semibold" data-testid="overpayment-amount">{formatCurrency(overpaymentAmount, currency)}</span>
          </div>
        )}

        {existingPayments.length > 0 && (
          <div data-testid="existing-payments">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Previous Payments</h4>
            <ul className="space-y-1">
              {existingPayments.map((p, i) => (
                <li key={i} className="flex justify-between text-sm text-gray-600 border-b border-gray-100 py-1" data-testid={`existing-payment-${i}`}>
                  <span>{p.date} {p.reference && `(${p.reference})`}</span>
                  <span className="font-medium">{formatCurrency(p.amount, currency)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Dialog>
  );
}
