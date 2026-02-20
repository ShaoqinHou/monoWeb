import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { formatCurrency } from '@shared/calc/currency';
import { useRecentActivity } from '../hooks/useDashboardData';
import { Clock } from 'lucide-react';
import type { BadgeVariant } from '../../../components/ui/Badge';
import type { RecentActivityItem } from '../types';

const TYPE_LABEL: Record<RecentActivityItem['type'], string> = {
  payment_received: 'Payment In',
  payment_made: 'Payment Out',
  invoice_created: 'Invoice',
  bill_created: 'Bill',
};

const TYPE_BADGE_VARIANT: Record<RecentActivityItem['type'], BadgeVariant> = {
  payment_received: 'success',
  payment_made: 'error',
  invoice_created: 'info',
  bill_created: 'warning',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' });
}

export function RecentActivity() {
  const { data: activities, isLoading } = useRecentActivity();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#6b7280]" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-[#1a1a2e]">Recent Activity</h2>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div data-testid="activity-loading" className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        ) : (
          <ul className="space-y-3" data-testid="activity-list">
            {activities?.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge variant={TYPE_BADGE_VARIANT[item.type]}>
                      {TYPE_LABEL[item.type]}
                    </Badge>
                    <span className="text-xs text-[#6b7280]">{formatDate(item.date)}</span>
                  </div>
                  <p className="text-sm text-[#1a1a2e] truncate">{item.description}</p>
                </div>
                <span
                  className={`text-sm font-semibold whitespace-nowrap ${
                    item.amount >= 0 ? 'text-[#14b8a6]' : 'text-[#ef4444]'
                  }`}
                >
                  {formatCurrency(item.amount, item.currency)}
                </span>
              </li>
            ))}
            {activities?.length === 0 && (
              <li className="text-sm text-[#6b7280]">No recent activity</li>
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
