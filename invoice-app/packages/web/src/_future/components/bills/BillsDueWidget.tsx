import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { useBillsDue, computeBillsDueTotals, type DueBill } from '../hooks/useBillsDue';

function formatCurrency(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface SectionProps {
  title: string;
  bills: DueBill[];
  variant: 'error' | 'warning' | 'info';
  testId: string;
}

function DueSection({ title, bills, variant, testId }: SectionProps) {
  const [expanded, setExpanded] = useState(false);
  const { count, total } = computeBillsDueTotals(bills);

  if (count === 0) return null;

  return (
    <div className="border border-[#e5e7eb] rounded-lg p-4" data-testid={testId}>
      <button
        className="flex items-center justify-between w-full text-left"
        onClick={() => setExpanded(!expanded)}
        data-testid={`${testId}-toggle`}
      >
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-[#1a1a2e]">{title}</h3>
          <Badge variant={variant}>{count}</Badge>
        </div>
        <span className="font-semibold text-[#1a1a2e]">
          {formatCurrency(total, 'NZD')}
        </span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-2" data-testid={`${testId}-details`}>
          {bills.map((bill) => (
            <div
              key={bill.id}
              className="flex items-center justify-between py-2 border-t border-[#e5e7eb]"
              data-testid={`bill-due-${bill.id}`}
            >
              <div>
                <span className="font-medium text-sm">{bill.billNumber}</span>
                <span className="text-sm text-[#6b7280] ml-2">{bill.contactName}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">
                  {formatCurrency(bill.amountDue, bill.currency)}
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  data-testid={`pay-now-${bill.id}`}
                >
                  Pay Now
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function BillsDueWidget() {
  const { data, isLoading } = useBillsDue();

  if (isLoading) {
    return <p data-testid="loading">Loading...</p>;
  }

  if (!data) return null;

  const hasAny = data.today.length > 0 || data.thisWeek.length > 0 || data.thisMonth.length > 0;

  return (
    <div data-testid="bills-due-widget">
      <h2 className="text-lg font-semibold text-[#1a1a2e] mb-4">Bills Due</h2>

      {!hasAny ? (
        <p className="text-[#6b7280] text-sm py-8 text-center" data-testid="no-bills-due">
          No upcoming bills due.
        </p>
      ) : (
        <div className="space-y-3">
          <DueSection title="Due Today" bills={data.today} variant="error" testId="due-today" />
          <DueSection title="Due This Week" bills={data.thisWeek} variant="warning" testId="due-this-week" />
          <DueSection title="Due This Month" bills={data.thisMonth} variant="info" testId="due-this-month" />
        </div>
      )}
    </div>
  );
}
