import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ProfitAndLossReport } from '../types';

interface ProfitLossChartProps {
  data: ProfitAndLossReport;
}

/**
 * Bar chart showing Revenue vs Expenses vs Net Profit summary.
 */
export function ProfitLossChart({ data }: ProfitLossChartProps) {
  const chartData = [
    {
      name: 'Revenue',
      amount: data.totalRevenue,
    },
    {
      name: 'Cost of Sales',
      amount: data.totalCostOfSales,
    },
    {
      name: 'Gross Profit',
      amount: data.grossProfit,
    },
    {
      name: 'Expenses',
      amount: data.totalOperatingExpenses,
    },
    {
      name: 'Net Profit',
      amount: data.netProfit,
    },
  ];

  return (
    <div data-testid="profit-loss-chart" className="w-full h-72 mb-6">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" fontSize={12} />
          <YAxis fontSize={12} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            formatter={(value: number) => [`$${value.toLocaleString('en-NZ', { minimumFractionDigits: 2 })}`, 'Amount']}
          />
          <Legend />
          <Bar dataKey="amount" fill="#0078c8" name="Amount" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
