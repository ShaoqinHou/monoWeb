import { useState } from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import type { Bill } from '../types';

export interface BatchPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  bills: Bill[];
  onConfirm: (data: { billIds: string[]; paymentDate: string; accountCode: string }) => void;
  loading?: boolean;
}

const BANK_ACCOUNTS = [
  { value: 'business-cheque', label: 'Business Cheque Account' },
  { value: 'savings', label: 'Business Savings Account' },
  { value: 'credit-card', label: 'Credit Card' },
];

export function BatchPaymentDialog({
  open,
  onClose,
  bills,
  onConfirm,
  loading = false,
}: BatchPaymentDialogProps) {
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [accountCode, setAccountCode] = useState('business-cheque');

  const total = bills.reduce((sum, b) => sum + b.amountDue, 0);

  const handleConfirm = () => {
    onConfirm({
      billIds: bills.map((b) => b.id),
      paymentDate,
      accountCode,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Batch Payment"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} data-testid="batch-cancel-btn">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            loading={loading}
            disabled={bills.length === 0}
            data-testid="batch-confirm-btn"
          >
            Confirm Payment
          </Button>
        </>
      }
    >
      <div data-testid="batch-payment-dialog">
        <div className="mb-4">
          <h3 className="text-sm font-medium text-[#6b7280] mb-2">Bills to Pay</h3>
          <ul className="space-y-1" data-testid="batch-bill-list">
            {bills.map((bill) => (
              <li
                key={bill.id}
                className="flex justify-between text-sm py-1 border-b border-[#e5e7eb]"
                data-testid={`batch-bill-${bill.id}`}
              >
                <span>{bill.billNumber} — {bill.contactName}</span>
                <span className="font-medium">${bill.amountDue.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-4 flex justify-between items-center text-sm font-semibold border-t border-[#1a1a2e] pt-2">
          <span>Total</span>
          <span data-testid="batch-total">${total.toFixed(2)}</span>
        </div>

        <div className="space-y-3">
          <Input
            label="Payment Date"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            data-testid="batch-date-input"
          />
          <Select
            label="Bank Account"
            options={BANK_ACCOUNTS}
            value={accountCode}
            onChange={(e) => setAccountCode(e.target.value)}
            data-testid="batch-account-select"
          />
        </div>
      </div>
    </Dialog>
  );
}
