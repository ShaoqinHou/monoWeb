import { Button } from '../../../components/ui/Button';
import type { PurchaseOrderStatus } from '../hooks/usePurchaseOrders';

export interface ApprovePOButtonProps {
  purchaseOrderId: string;
  currentStatus: PurchaseOrderStatus;
  onApproved: (id: string) => void;
  onRejected?: (id: string) => void;
  loading?: boolean;
  rejectLoading?: boolean;
}

export function ApprovePOButton({
  purchaseOrderId,
  currentStatus,
  onApproved,
  onRejected,
  loading = false,
  rejectLoading = false,
}: ApprovePOButtonProps) {
  const canApprove = currentStatus === 'submitted';

  if (!canApprove) {
    return null;
  }

  return (
    <div className="flex items-center gap-2" data-testid="po-approval-actions">
      <Button
        onClick={() => onApproved(purchaseOrderId)}
        loading={loading}
        data-testid="approve-po-btn"
      >
        Approve
      </Button>
      {onRejected && (
        <Button
          variant="destructive"
          onClick={() => onRejected(purchaseOrderId)}
          loading={rejectLoading}
          data-testid="reject-po-btn"
        >
          Reject
        </Button>
      )}
    </div>
  );
}
