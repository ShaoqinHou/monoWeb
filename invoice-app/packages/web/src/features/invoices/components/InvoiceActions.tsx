import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Dialog } from '../../../components/ui/Dialog';
import { nextStatuses, canTransition } from '@xero-replica/shared';
import type { InvoiceStatusType } from '../types';

interface InvoiceActionsProps {
  status: InvoiceStatusType;
  onTransition: (newStatus: InvoiceStatusType) => void;
  isPending?: boolean;
}

const ACTION_LABELS: Record<InvoiceStatusType, string> = {
  draft: 'Revert to Draft',
  submitted: 'Submit for Approval',
  approved: 'Approve',
  paid: 'Mark as Paid',
  voided: 'Void',
};

const ACTION_VARIANTS: Record<InvoiceStatusType, 'primary' | 'secondary' | 'destructive'> = {
  draft: 'secondary',
  submitted: 'primary',
  approved: 'primary',
  paid: 'primary',
  voided: 'destructive',
};

export function InvoiceActions({ status, onTransition, isPending = false }: InvoiceActionsProps) {
  const [confirmStatus, setConfirmStatus] = useState<InvoiceStatusType | null>(null);

  const available = nextStatuses(status);

  if (available.length === 0) {
    return null;
  }

  const handleConfirm = () => {
    if (confirmStatus && canTransition(status, confirmStatus)) {
      onTransition(confirmStatus);
      setConfirmStatus(null);
    }
  };

  return (
    <div data-testid="invoice-actions">
      <div className="flex items-center gap-2">
        {available.map((nextStatus) => (
          <Button
            key={nextStatus}
            variant={ACTION_VARIANTS[nextStatus]}
            onClick={() => setConfirmStatus(nextStatus)}
            disabled={isPending}
            loading={isPending && confirmStatus === nextStatus}
            data-testid={`action-${nextStatus}`}
          >
            {ACTION_LABELS[nextStatus]}
          </Button>
        ))}
      </div>

      <Dialog
        open={confirmStatus !== null}
        onClose={() => setConfirmStatus(null)}
        title="Confirm Status Change"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmStatus(null)}>
              Cancel
            </Button>
            <Button
              variant={confirmStatus === 'voided' ? 'destructive' : 'primary'}
              onClick={handleConfirm}
              loading={isPending}
              data-testid="confirm-transition"
            >
              {confirmStatus ? ACTION_LABELS[confirmStatus] : 'Confirm'}
            </Button>
          </>
        }
      >
        <p className="text-gray-600">
          Are you sure you want to change this invoice status from{' '}
          <strong className="text-gray-900">{ACTION_LABELS[status] ? status : status}</strong>{' '}
          to{' '}
          <strong className="text-gray-900">{confirmStatus ?? ''}</strong>?
        </p>
      </Dialog>
    </div>
  );
}
