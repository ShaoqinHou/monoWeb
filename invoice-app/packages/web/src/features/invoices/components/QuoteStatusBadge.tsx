import { Badge, type BadgeVariant } from '../../../components/ui/Badge';
import type { QuoteStatus } from '../hooks/useQuotes';

interface QuoteStatusBadgeProps {
  status: QuoteStatus;
  className?: string;
}

const STATUS_CONFIG: Record<QuoteStatus, { label: string; variant: BadgeVariant }> = {
  draft: { label: 'Draft', variant: 'default' },
  sent: { label: 'Sent', variant: 'info' },
  accepted: { label: 'Accepted', variant: 'success' },
  declined: { label: 'Declined', variant: 'error' },
  expired: { label: 'Expired', variant: 'warning' },
  invoiced: { label: 'Invoiced', variant: 'success' },
};

export function QuoteStatusBadge({ status, className }: QuoteStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <Badge variant={config.variant} className={className} data-testid="quote-status-badge">
      {config.label}
    </Badge>
  );
}

export { STATUS_CONFIG };
