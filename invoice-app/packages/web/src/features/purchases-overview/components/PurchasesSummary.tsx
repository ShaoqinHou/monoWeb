import { Card, CardContent } from '../../../components/ui/Card';
import { formatCurrency } from '@shared/calc/currency';
import type { PurchasesSummaryData } from '../hooks/usePurchases';

interface PurchasesSummaryProps {
  data: PurchasesSummaryData | undefined;
  isLoading: boolean;
}

interface SummaryCardProps {
  label: string;
  value: string;
  variant?: 'default' | 'warning';
}

function SummaryCard({ label, value, variant = 'default' }: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="pt-4">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p
          className={`text-2xl font-bold mt-1 ${
            variant === 'warning' ? 'text-red-600' : 'text-gray-900'
          }`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

export function PurchasesSummary({ data, isLoading }: PurchasesSummaryProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="purchases-summary-loading">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="purchases-summary">
      <SummaryCard label="Total Purchases (YTD)" value={formatCurrency(data.totalPurchasesYTD)} />
      <SummaryCard label="Outstanding Bills" value={formatCurrency(data.outstandingBills)} />
      <SummaryCard label="Overdue Amount" value={formatCurrency(data.overdueAmount)} variant="warning" />
    </div>
  );
}
