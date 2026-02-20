import { useState, useMemo } from 'react';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { useCashFlow } from '../hooks/useDashboardData';
import { formatCurrency } from '@shared/calc/currency';
import { TrendingUp, Eye, EyeOff } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export function CashFlowChart() {
  const { data: cashFlow, isLoading } = useCashFlow();
  const [visible, setVisible] = useState(true);

  const hasData = cashFlow && cashFlow.some((m) => m.income > 0 || m.expenses > 0);

  const totals = useMemo(() => {
    if (!cashFlow) return { cashIn: 0, cashOut: 0, difference: 0 };
    const cashIn = cashFlow.reduce((sum, m) => sum + m.income, 0);
    const cashOut = cashFlow.reduce((sum, m) => sum + m.expenses, 0);
    return { cashIn, cashOut, difference: cashIn - cashOut };
  }, [cashFlow]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#6b7280]" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-[#1a1a2e]">Cash In / Out</h2>
          </div>
          <button
            onClick={() => setVisible((v) => !v)}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            aria-label={visible ? 'Hide cash flow chart' : 'Show cash flow chart'}
            data-testid="cashflow-toggle"
          >
            {visible ? <Eye className="h-4 w-4 text-[#6b7280]" /> : <EyeOff className="h-4 w-4 text-[#6b7280]" />}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div data-testid="cashflow-loading" className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded" />
          </div>
        ) : !visible ? (
          <div data-testid="cashflow-hidden" className="h-24 flex items-center justify-center">
            <p className="text-sm text-[#6b7280]">Chart hidden</p>
          </div>
        ) : hasData ? (
          <div>
            {/* Totals row */}
            <div className="flex gap-6 mb-3 text-sm" data-testid="cashflow-totals">
              <div>
                <span className="text-[#6b7280]">Cash in: </span>
                <span className="font-semibold text-[#14b8a6]" data-testid="cashflow-total-in">
                  {formatCurrency(totals.cashIn)}
                </span>
              </div>
              <div>
                <span className="text-[#6b7280]">Cash out: </span>
                <span className="font-semibold text-[#ef4444]" data-testid="cashflow-total-out">
                  {formatCurrency(totals.cashOut)}
                </span>
              </div>
              <div>
                <span className="text-[#6b7280]">Difference: </span>
                <span
                  className={`font-semibold ${totals.difference >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}
                  data-testid="cashflow-total-diff"
                >
                  {formatCurrency(totals.difference)}
                </span>
              </div>
            </div>

            <div data-testid="cashflow-chart" className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlow} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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
                  <Legend
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                  <Bar
                    dataKey="income"
                    name="Cash In"
                    fill="#14b8a6"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="expenses"
                    name="Cash Out"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div data-testid="cashflow-empty" className="h-48 flex items-center justify-center">
            <p className="text-sm text-[#6b7280]">No cash flow data yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
