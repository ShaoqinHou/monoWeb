import { Badge, type BadgeVariant } from '../../../components/ui/Badge';
import type { ExpenseStatusType } from '@xero-replica/shared';

interface ExpenseStatusBadgeProps {
  status: ExpenseStatusType;
  className?: string;
}

const STATUS_CONFIG: Record<ExpenseStatusType, { label: string; variant: BadgeVariant }> = {
  draft: { label: 'Draft', variant: 'default' },
  submitted: { label: 'Submitted', variant: 'info' },
  approved: { label: 'Approved', variant: 'warning' },
  reimbursed: { label: 'Reimbursed', variant: 'success' },
  declined: { label: 'Declined', variant: 'error' },
};

export function ExpenseStatusBadge({ status, className }: ExpenseStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <Badge variant={config.variant} className={className} data-testid="expense-status-badge">
      {config.label}
    </Badge>
  );
}
