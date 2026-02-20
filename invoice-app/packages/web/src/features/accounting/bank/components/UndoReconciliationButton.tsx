import { useState } from 'react';
import { Button } from '../../../../components/ui/Button';
import { Dialog } from '../../../../components/ui/Dialog';
import { showToast } from '../../../dashboard/components/ToastContainer';
import { useUndoReconciliation } from '../hooks/useUndoReconciliation';

export interface UndoReconciliationButtonProps {
  transactionId: string;
  transactionDescription?: string;
  onSuccess?: () => void;
}

export function UndoReconciliationButton({
  transactionId,
  transactionDescription,
  onSuccess,
}: UndoReconciliationButtonProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const mutation = useUndoReconciliation();

  const handleConfirm = async () => {
    try {
      await mutation.mutateAsync(transactionId);
      setConfirmOpen(false);
      showToast('success', 'Reconciliation undone');
      onSuccess?.();
    } catch (err) {
      const error = err as Error;
      showToast('error', error.message || 'Failed to undo reconciliation');
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setConfirmOpen(true)}
      >
        Undo
      </Button>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Undo Reconciliation"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirm}
              loading={mutation.isPending}
            >
              Undo Reconciliation
            </Button>
          </>
        }
      >
        <p className="text-sm text-[#6b7280]">
          Are you sure you want to undo the reconciliation
          {transactionDescription ? ` for "${transactionDescription}"` : ''}?
          This will unmatch the transaction and return it to the bank feed.
        </p>
      </Dialog>
    </>
  );
}
