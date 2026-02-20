import { useMemo } from 'react';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';

interface MonthSummary {
  month: string;
  invoiced: number;
  paid: number;
  outstanding: number;
}

interface ActivitySummaryCardProps {
  contactId: string;
}

function generateMockMonthlyData(): MonthSummary[] {
  const months: MonthSummary[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = d.toLocaleDateString('en-NZ', { year: 'numeric', month: 'short' });
    const invoiced = Math.round(Math.random() * 5000 + 1000);
    const paid = Math.round(invoiced * (0.6 + Math.random() * 0.35));
    months.push({
      month: monthStr,
      invoiced,
      paid,
      outstanding: invoiced - paid,
    });
  }
  return months;
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function ActivitySummaryCard({ contactId }: ActivitySummaryCardProps) {
  const monthlyData = useMemo(() => generateMockMonthlyData(), [contactId]);

  const totals = useMemo(() => {
    return monthlyData.reduce(
      (acc, m) => ({
        invoiced: acc.invoiced + m.invoiced,
        paid: acc.paid + m.paid,
        outstanding: acc.outstanding + m.outstanding,
      }),
      { invoiced: 0, paid: 0, outstanding: 0 },
    );
  }, [monthlyData]);

  return (
    <Card data-testid="activity-summary-card">
      <CardHeader>
        <h3 className="text-sm font-semibold text-[#1a1a2e]">12-Month Activity Summary</h3>
      </CardHeader>
      <CardContent>
        {/* Totals */}
        <div className="mb-4 grid grid-cols-3 gap-4" data-testid="activity-totals">
          <div>
            <p className="text-xs text-[#6b7280]">Total Invoiced</p>
            <p className="text-lg font-semibold text-[#1a1a2e]" data-testid="total-invoiced">
              {formatCurrency(totals.invoiced)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#6b7280]">Total Paid</p>
            <p className="text-lg font-semibold text-green-600" data-testid="total-paid">
              {formatCurrency(totals.paid)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#6b7280]">Outstanding</p>
            <p className="text-lg font-semibold text-orange-500" data-testid="total-outstanding">
              {formatCurrency(totals.outstanding)}
            </p>
          </div>
        </div>

        {/* Monthly breakdown */}
        <div className="space-y-1" data-testid="monthly-breakdown">
          {monthlyData.map((m) => (
            <div
              key={m.month}
              className="flex items-center justify-between text-xs"
              data-testid={`month-row`}
            >
              <span className="w-20 text-[#6b7280]">{m.month}</span>
              <span className="w-24 text-right">{formatCurrency(m.invoiced)}</span>
              <span className="w-24 text-right text-green-600">{formatCurrency(m.paid)}</span>
              <span className="w-24 text-right text-orange-500">
                {formatCurrency(m.outstanding)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
