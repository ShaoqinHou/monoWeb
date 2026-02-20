import { useMemo } from 'react';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { useCashFlow } from '../hooks/useDashboardData';
import { formatCurrency } from '@shared/calc/currency';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export function ProfitLossChart() {
  const { data: cashFlow, isLoading } = useCashFlow();

  const plData = cashFlow?.map((m) => ({
    month: m.month,
    revenue: m.income,
    expenses: m.expenses,
  }));

  const hasData = plData && plData.some((m) => m.revenue > 0 || m.expenses > 0);

  const ytdMetrics = useMemo(() => {
    if (!plData) return null;
    const totalRevenue = plData.reduce((sum, m) => sum + m.revenue, 0);
    const totalExpenses = plData.reduce((sum, m) => sum + m.expenses, 0);
    const netProfit = totalRevenue - totalExpenses;
    // Mock prior year comparison
    const priorYearProfit = netProfit * 0.85;
    const changePercent = priorYearProfit !== 0
      ? ((netProfit - priorYearProfit) / Math.abs(priorYearProfit)) * 100
      : 0;
    return { ytd: netProfit, changePercent };
  }, [plData]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#6b7280]" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-[#1a1a2e]">Profit & Loss</h2>
          </div>
          {ytdMetrics && (
            <div className="flex items-center gap-2" data-testid="profit-loss-ytd">
              <span className="text-lg font-bold text-[#1a1a2e]" data-testid="profit-loss-ytd-amount">
                {formatCurrency(ytdMetrics.ytd)}
              </span>
              <div className="flex items-center gap-0.5">
                {ytdMetrics.changePercent >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-[#10b981]" data-testid="profit-loss-trend-up" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-[#ef4444]" data-testid="profit-loss-trend-down" />
                )}
                <span
                  className={`text-xs font-medium ${ytdMetrics.changePercent >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}
                  data-testid="profit-loss-change-pct"
                >
                  {ytdMetrics.changePercent >= 0 ? '+' : ''}
                  {ytdMetrics.changePercent.toFixed(1)}% vs prior year
                </span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div data-testid="profit-loss-loading" className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded" />
          </div>
        ) : hasData ? (
          <div data-testid="profit-loss-chart" className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={plData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value: number) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '13px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#0078c8"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  name="Expenses"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div data-testid="profit-loss-empty" className="h-48 flex items-center justify-center">
            <p className="text-sm text-[#6b7280]">No profit & loss data yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
