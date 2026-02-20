import { Badge } from '../../../components/ui/Badge';
import { formatCurrency } from '../../../../../shared/calc/currency';
import type { ContactActivity as ContactActivityType } from '../types';

interface ContactActivityProps {
  activities: ContactActivityType[];
  isLoading?: boolean;
}

function getActivityIcon(type: ContactActivityType['type']): string {
  switch (type) {
    case 'invoice':
      return 'INV';
    case 'bill':
      return 'BILL';
    case 'payment':
      return 'PMT';
    default:
      return '?';
  }
}

function getStatusBadgeVariant(
  status: ContactActivityType['status'],
): 'success' | 'warning' | 'error' | 'default' {
  switch (status) {
    case 'paid':
      return 'success';
    case 'unpaid':
      return 'warning';
    case 'overdue':
      return 'error';
    case 'partial':
      return 'warning';
    default:
      return 'default';
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function ContactActivity({ activities, isLoading = false }: ContactActivityProps) {
  if (isLoading) {
    return (
      <div className="py-8 text-center text-[#6b7280]" data-testid="activity-loading">
        Loading activity...
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="py-8 text-center text-[#6b7280]" data-testid="activity-empty">
        No activity found for this contact.
      </div>
    );
  }

  return (
    <div className="space-y-0" data-testid="activity-timeline">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start gap-4 border-b border-[#e5e7eb] py-3 last:border-0"
          data-testid={`activity-${activity.id}`}
        >
          {/* Type badge */}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-[#6b7280] shrink-0">
            {getActivityIcon(activity.type)}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#1a1a2e]">
              {activity.description}
            </p>
            <p className="text-xs text-[#6b7280] mt-0.5">
              {formatDate(activity.date)}
            </p>
          </div>

          {/* Amount + Status */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm font-medium text-[#1a1a2e]">
              {formatCurrency(activity.amount)}
            </span>
            <Badge variant={getStatusBadgeVariant(activity.status)}>
              {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
