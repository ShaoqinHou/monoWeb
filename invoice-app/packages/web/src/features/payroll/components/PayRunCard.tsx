import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { formatCurrency } from '@shared/calc/currency';
import type { PayRun } from '../types';
import type { BadgeVariant } from '../../../components/ui/Badge';

interface PayRunCardProps {
  payRun: PayRun;
}

const STATUS_VARIANTS: Record<PayRun['status'], BadgeVariant> = {
  draft: 'warning',
  posted: 'info',
  paid: 'success',
};

const STATUS_LABELS: Record<PayRun['status'], string> = {
  draft: 'Draft',
  posted: 'Posted',
  paid: 'Paid',
};

export function PayRunCard({ payRun }: PayRunCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      data-testid={`pay-run-card-${payRun.id}`}
      className="cursor-pointer"
      onClick={() => navigate({ to: '/payroll/pay-runs/$payRunId', params: { payRunId: payRun.id } })}
    >
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#6b7280]">
              {formatDate(payRun.periodStart)} - {formatDate(payRun.periodEnd)}
            </p>
            <p className="text-sm font-medium text-[#1a1a2e]">
              Pay Date: {formatDate(payRun.payDate)}
            </p>
          </div>
          <Badge variant={STATUS_VARIANTS[payRun.status]}>
            {STATUS_LABELS[payRun.status]}
          </Badge>
        </div>
        <div className="mt-3 flex items-center gap-6 text-sm">
          <div>
            <span className="text-[#6b7280]">Employees: </span>
            <span className="font-medium">{payRun.employees.length}</span>
          </div>
          <div>
            <span className="text-[#6b7280]">Gross: </span>
            <span className="font-medium">{formatCurrency(payRun.totalGross)}</span>
          </div>
          <div>
            <span className="text-[#6b7280]">Net: </span>
            <span className="font-medium">{formatCurrency(payRun.totalNet)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
