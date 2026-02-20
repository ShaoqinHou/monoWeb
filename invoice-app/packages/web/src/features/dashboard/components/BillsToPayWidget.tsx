import { Link } from '@tanstack/react-router';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { formatCurrency } from '@shared/calc/currency';
import { useBillSummary } from '../hooks/useDashboardData';
import { Receipt, AlertTriangle } from 'lucide-react';
import type { BadgeVariant } from '../../../components/ui/Badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  draft: 'default',
  submitted: 'info',
  approved: 'warning',
  overdue: 'error',
};

const BILLS_AGING_DATA = [
  { label: 'Older', amount: 4100 },
  { label: 'This week', amount: 2200 },
  { label: 'Next week', amount: 1500 },
  { label: '2 weeks', amount: 800 },
  { label: '3 weeks', amount: 600 },
];

export function BillsToPayWidget() {
  const { data: summary, isLoading } = useBillSummary();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-[#6b7280]" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-[#1a1a2e]">Bills you need to pay</h2>
          </div>
          {summary && (
            <span className="text-lg font-bold text-[#1a1a2e]">
              {formatCurrency(summary.totalOutstanding, summary.currency)}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div data-testid="bills-loading" className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
          </div>
        ) : summary && summary.byStatus.length > 0 ? (
          <div className="space-y-4">
            {/* Overdue warning banner */}
            {summary.overdueCount > 0 && (
              <Link
                to="/reporting/aged-payables"
                className="flex items-center gap-2 rounded-lg bg-[#ef4444]/5 border border-[#ef4444]/20 px-3 py-2 hover:bg-[#ef4444]/10 transition-colors"
                data-testid="bills-overdue-banner"
              >
                <AlertTriangle className="h-4 w-4 text-[#ef4444]" aria-hidden="true" />
                <span className="text-sm text-[#ef4444] font-medium">
                  {summary.overdueCount} overdue
                  {' '}({formatCurrency(summary.totalOverdue, summary.currency)})
                </span>
                <span className="text-xs text-[#ef4444]/70 ml-auto">View aged payables</span>
              </Link>
            )}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" data-testid="bills-status-grid">
              {summary.byStatus.map((item) => (
                <Link
                  key={item.status}
                  to="/purchases/bills"
                  search={{ status: item.status }}
                  className="block rounded-lg border border-[#e5e7eb] p-3 hover:bg-gray-50 transition-colors"
                  data-testid={`bill-status-${item.status}`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Badge variant={STATUS_BADGE_VARIANT[item.status] ?? 'default'}>
                      {item.count}
                    </Badge>
                    <span className="text-xs text-[#6b7280]">{item.label}</span>
                  </div>
                  <p className="text-sm font-semibold text-[#1a1a2e]">
                    {formatCurrency(item.total, summary.currency)}
                  </p>
                </Link>
              ))}
            </div>

            {/* Bills aging bar chart */}
            <div data-testid="bills-aging-chart" className="h-40 mt-2">
              <p className="text-xs font-medium text-[#6b7280] mb-1">Bill aging</p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={BILLS_AGING_DATA} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']}
                    contentStyle={{ borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                  />
                  <Bar dataKey="amount" fill="#ef4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#6b7280]" data-testid="bills-empty">
            No bills yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}
