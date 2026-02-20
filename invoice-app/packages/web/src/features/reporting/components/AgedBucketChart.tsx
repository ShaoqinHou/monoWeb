import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { AgedBucket } from '../types';

interface AgedBucketChartProps {
  buckets: AgedBucket[];
}

const BUCKET_COLORS = [
  '#14b8a6', // Current - teal
  '#0078c8', // 1-30 - blue
  '#f59e0b', // 31-60 - amber
  '#f97316', // 61-90 - orange
  '#ef4444', // 90+ - red
];

/**
 * Bar chart showing aged report buckets (Current, 1-30, 31-60, 61-90, 90+).
 * Each bucket gets a color indicating urgency.
 */
export function AgedBucketChart({ buckets }: AgedBucketChartProps) {
  const chartData = buckets.map((bucket) => ({
    name: bucket.label,
    amount: bucket.amount,
    count: bucket.count,
  }));

  return (
    <div data-testid="aged-bucket-chart" className="w-full h-72 mb-6">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" fontSize={12} />
          <YAxis
            fontSize={12}
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(value: number) => [
              `$${value.toLocaleString('en-NZ', { minimumFractionDigits: 2 })}`,
              'Amount',
            ]}
          />
          <Bar dataKey="amount" name="Amount" radius={[4, 4, 0, 0]}>
            {chartData.map((_entry, index) => (
              <Cell key={index} fill={BUCKET_COLORS[index % BUCKET_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
