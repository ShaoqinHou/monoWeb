import { Button } from '../../../components/ui/Button';
import { Dialog } from '../../../components/ui/Dialog';
import { useSendPaymentReceipt, type PaymentReceiptData } from '../hooks/useSendPaymentReceipt';

export interface PaymentReceiptDialogProps {
  open: boolean;
  onClose: () => void;
  payment: PaymentReceiptData | null;
}

function formatCurrency(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function PaymentReceiptDialog({ open, onClose, payment }: PaymentReceiptDialogProps) {
  const sendReceipt = useSendPaymentReceipt();

  if (!payment) return null;

  const handleSendReceipt = () => {
    sendReceipt.mutate(payment, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Payment Recorded"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} data-testid="receipt-skip">
            Skip
          </Button>
          <Button
            variant="primary"
            onClick={handleSendReceipt}
            loading={sendReceipt.isPending}
            data-testid="receipt-send"
          >
            Send Receipt
          </Button>
        </>
      }
    >
      <div className="space-y-3" data-testid="payment-receipt-details">
        <p className="text-sm text-[#6b7280]">
          Payment has been recorded. Would you like to send a receipt confirmation to the contact?
        </p>

        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-[#6b7280]">Invoice</dt>
          <dd className="font-medium text-[#1a1a2e]" data-testid="receipt-invoice-ref">
            {payment.invoiceNumber}
          </dd>

          <dt className="text-[#6b7280]">Contact</dt>
          <dd className="font-medium text-[#1a1a2e]" data-testid="receipt-contact">
            {payment.contactName}
          </dd>

          <dt className="text-[#6b7280]">Payment Amount</dt>
          <dd className="font-medium text-[#1a1a2e]" data-testid="receipt-amount">
            {formatCurrency(payment.paymentAmount, payment.currency)}
          </dd>

          <dt className="text-[#6b7280]">Payment Date</dt>
          <dd className="font-medium text-[#1a1a2e]" data-testid="receipt-date">
            {payment.paymentDate}
          </dd>

          <dt className="text-[#6b7280]">Remaining Balance</dt>
          <dd className="font-medium text-[#1a1a2e]" data-testid="receipt-balance">
            {formatCurrency(payment.remainingBalance, payment.currency)}
          </dd>

          <dt className="text-[#6b7280]">Email To</dt>
          <dd className="font-medium text-[#1a1a2e]" data-testid="receipt-email">
            {payment.contactEmail}
          </dd>
        </dl>

        {sendReceipt.isSuccess && (
          <p className="text-sm text-[#14b8a6]" data-testid="receipt-success">
            Receipt sent successfully.
          </p>
        )}
      </div>
    </Dialog>
  );
}
