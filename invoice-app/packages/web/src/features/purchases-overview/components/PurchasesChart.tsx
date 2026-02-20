import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { MonthlyPurchasesData } from '../hooks/usePurchases';

interface PurchasesChartProps {
  data: MonthlyPurchasesData[] | undefined;
  isLoading: boolean;
}

export function PurchasesChart({ data, isLoading }: PurchasesChartProps) {
  return (
    <Card data-testid="purchases-chart">
      <CardHeader>
        <h2 className="text-lg font-semibold text-gray-900">Monthly Purchases</h2>
        <p className="text-sm text-gray-500">Purchase expenses by month for the current year</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center" data-testid="purchases-chart-loading">
            <div className="h-64 w-full bg-gray-100 rounded animate-pulse" />
          </div>
        ) : data && data.length > 0 ? (
          <div className="h-64" data-testid="purchases-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Purchases']}
                  contentStyle={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                />
                <Bar dataKey="amount" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            No purchase data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
