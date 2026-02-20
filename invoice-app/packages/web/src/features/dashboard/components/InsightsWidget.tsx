import { Card, CardContent } from '../../../components/ui/Card';
import { useDashboardInsights } from '../hooks/useDashboardInsights';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function TrendIndicator({ changePercent, label }: { changePercent: number; label: string }) {
  const isUp = changePercent > 0;
  const isDown = changePercent < 0;
  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
  const colorClass = isUp ? 'text-green-600' : isDown ? 'text-red-600' : 'text-[#6b7280]';
  const sign = isUp ? '+' : '';

  return (
    <div className="flex items-center gap-1.5" data-testid={`trend-${label}`}>
      <Icon className={`h-4 w-4 ${colorClass}`} />
      <span className={`text-sm font-medium ${colorClass}`}>
        {sign}{changePercent}% vs last month
      </span>
    </div>
  );
}

export function InsightsWidget() {
  const { data, isLoading } = useDashboardInsights();

  return (
    <Card data-testid="insights-widget">
      <CardContent>
        <h2 className="text-base font-semibold text-[#1a1a2e] mb-4">Insights</h2>
        {isLoading && <p className="text-sm text-[#6b7280]">Loading insights...</p>}
        {data && (
          <div className="space-y-4">
            {/* Revenue */}
            <div data-testid="insight-revenue">
              <p className="text-sm text-[#6b7280]">Revenue</p>
              <p className="text-lg font-semibold text-[#1a1a2e]">
                {formatCurrency(data.revenue.thisMonth)}
              </p>
              <TrendIndicator changePercent={data.revenue.changePercent} label="revenue" />
            </div>

            {/* Expenses */}
            <div data-testid="insight-expenses">
              <p className="text-sm text-[#6b7280]">Expenses</p>
              <p className="text-lg font-semibold text-[#1a1a2e]">
                {formatCurrency(data.expenses.thisMonth)}
              </p>
              <TrendIndicator changePercent={data.expenses.changePercent} label="expenses" />
            </div>

            {/* Cash Position */}
            <div data-testid="insight-cash-position">
              <p className="text-sm text-[#6b7280]">Cash Position</p>
              <p
                className={`text-lg font-semibold ${
                  data.cashPosition >= 0 ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {formatCurrency(data.cashPosition)}
              </p>
            </div>

            {/* Top Debtors */}
            {data.topDebtors.length > 0 && (
              <div data-testid="insight-top-debtors">
                <p className="text-sm text-[#6b7280] mb-2">Top Outstanding Debtors</p>
                <ul className="space-y-1">
                  {data.topDebtors.map((debtor) => (
                    <li
                      key={debtor.name}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-[#1a1a2e]">{debtor.name}</span>
                      <span className="text-[#6b7280] font-medium">
                        {formatCurrency(debtor.total)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
