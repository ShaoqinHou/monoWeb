import { Card, CardContent } from '../../../components/ui/Card';
import { formatCurrency } from '../../../../../shared/calc/currency';
import type { FinancialSummary } from '../types';

interface ContactFinancialSummaryProps {
  summary: FinancialSummary;
  isLoading?: boolean;
}

export function ContactFinancialSummary({
  summary,
  isLoading = false,
}: ContactFinancialSummaryProps) {
  if (isLoading) {
    return (
      <div className="py-8 text-center text-[#6b7280]" data-testid="financial-loading">
        Loading financial summary...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="financial-summary">
      {/* Total Invoiced */}
      <Card>
        <CardContent>
          <div className="space-y-1 py-2">
            <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">
              Total Invoiced
            </p>
            <p className="text-2xl font-bold text-[#1a1a2e]" data-testid="total-invoiced">
              {formatCurrency(summary.totalInvoiced)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Total Billed */}
      <Card>
        <CardContent>
          <div className="space-y-1 py-2">
            <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">
              Total Billed
            </p>
            <p className="text-2xl font-bold text-[#1a1a2e]" data-testid="total-billed">
              {formatCurrency(summary.totalBilled)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Outstanding */}
      <Card>
        <CardContent>
          <div className="space-y-1 py-2">
            <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">
              Outstanding
            </p>
            <p
              className={`text-2xl font-bold ${summary.outstanding > 0 ? 'text-[#f59e0b]' : 'text-[#1a1a2e]'}`}
              data-testid="total-outstanding"
            >
              {formatCurrency(summary.outstanding)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Overdue */}
      <Card>
        <CardContent>
          <div className="space-y-1 py-2">
            <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">
              Overdue
            </p>
            <p
              className={`text-2xl font-bold ${summary.overdue > 0 ? 'text-[#ef4444]' : 'text-[#1a1a2e]'}`}
              data-testid="total-overdue"
            >
              {formatCurrency(summary.overdue)}
            </p>
            {summary.overdueCount > 0 && (
              <p className="text-xs text-[#ef4444]" data-testid="overdue-count">
                {summary.overdueCount} invoice{summary.overdueCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
