import { Badge, type BadgeVariant } from '../../../components/ui/Badge';
import type { InvoiceStatusType } from '../types';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatusType;
  className?: string;
}

const STATUS_CONFIG: Record<InvoiceStatusType, { label: string; variant: BadgeVariant }> = {
  draft: { label: 'Draft', variant: 'default' },
  submitted: { label: 'Awaiting Approval', variant: 'info' },
  approved: { label: 'Approved', variant: 'warning' },
  paid: { label: 'Paid', variant: 'success' },
  voided: { label: 'Voided', variant: 'error' },
};

export function InvoiceStatusBadge({ status, className }: InvoiceStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <Badge variant={config.variant} className={className} data-testid="invoice-status-badge">
      {config.label}
    </Badge>
  );
}

export { STATUS_CONFIG };
