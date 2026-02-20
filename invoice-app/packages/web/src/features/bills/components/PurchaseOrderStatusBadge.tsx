import { Badge, type BadgeVariant } from '../../../components/ui/Badge';
import type { PurchaseOrderStatus } from '../hooks/usePurchaseOrders';

interface PurchaseOrderStatusBadgeProps {
  status: PurchaseOrderStatus;
  className?: string;
}

const STATUS_CONFIG: Record<PurchaseOrderStatus, { label: string; variant: BadgeVariant }> = {
  draft: { label: 'Draft', variant: 'default' },
  submitted: { label: 'Submitted', variant: 'info' },
  approved: { label: 'Approved', variant: 'warning' },
  billed: { label: 'Billed', variant: 'success' },
  closed: { label: 'Closed', variant: 'default' },
};

export function PurchaseOrderStatusBadge({ status, className }: PurchaseOrderStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <Badge variant={config.variant} className={className} data-testid="po-status-badge">
      {config.label}
    </Badge>
  );
}

export { STATUS_CONFIG };
