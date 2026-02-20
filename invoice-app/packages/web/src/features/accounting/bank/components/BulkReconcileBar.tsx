import { Button } from '../../../../components/ui/Button';
import { showToast } from '../../../dashboard/components/ToastContainer';
import { useBulkReconcile } from '../hooks/useBulkReconcile';

interface BulkReconcileBarProps {
  selectedIds: string[];
  totalAmount: number;
  onClearSelection: () => void;
  onSuccess?: () => void;
}

export function BulkReconcileBar({
  selectedIds,
  totalAmount,
  onClearSelection,
  onSuccess,
}: BulkReconcileBarProps) {
  const mutation = useBulkReconcile();

  if (selectedIds.length === 0) {
    return null;
  }

  const handleReconcileAll = () => {
    mutation.mutate(selectedIds, {
      onSuccess: () => {
        onClearSelection();
        showToast('success', 'Transactions reconciled');
        onSuccess?.();
      },
      onError: (err: Error) => {
        showToast('error', err.message || 'Failed to reconcile transactions');
      },
    });
  };

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 rounded-lg bg-white px-6 py-3 shadow-lg border border-gray-200"
      data-testid="bulk-reconcile-bar"
    >
      <span className="text-sm text-gray-700" data-testid="bulk-selected-count">
        {selectedIds.length} transaction{selectedIds.length !== 1 ? 's' : ''} selected
      </span>
      <span className="text-sm font-medium text-gray-900" data-testid="bulk-total-amount">
        Total: ${totalAmount.toFixed(2)}
      </span>
      <Button
        variant="primary"
        size="sm"
        onClick={handleReconcileAll}
        loading={mutation.isPending}
        data-testid="reconcile-all-btn"
      >
        Reconcile All
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearSelection}
        data-testid="cancel-selection-btn"
      >
        Cancel
      </Button>
    </div>
  );
}
