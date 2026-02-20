import { useNavigate } from '@tanstack/react-router';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { formatCurrency } from '@shared/calc/currency';
import type { PayRun } from '../types';
import type { BadgeVariant } from '../../../components/ui/Badge';

interface PayRunListProps {
  payRuns: PayRun[];
  showNotFiledBadge?: boolean;
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

export function PayRunList({ payRuns, showNotFiledBadge }: PayRunListProps) {
  const navigate = useNavigate();

  return (
    <div data-testid="pay-run-list">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Period</TableHead>
            <TableHead>Pay Date</TableHead>
            <TableHead className="text-right">Employees</TableHead>
            <TableHead className="text-right">Total Gross</TableHead>
            <TableHead className="text-right">Total Net</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payRuns.length === 0 ? (
            <TableRow>
              <td colSpan={6} className="px-4 py-8 text-center text-[#6b7280]">
                No pay runs found
              </td>
            </TableRow>
          ) : (
            payRuns.map((pr) => (
              <TableRow
                key={pr.id}
                className="cursor-pointer"
                data-testid={`pay-run-row-${pr.id}`}
                onClick={() => navigate({ to: '/payroll/pay-runs/$payRunId', params: { payRunId: pr.id } })}
              >
                <TableCell>
                  {formatDate(pr.periodStart)} - {formatDate(pr.periodEnd)}
                </TableCell>
                <TableCell>{formatDate(pr.payDate)}</TableCell>
                <TableCell className="text-right">{pr.employees.length}</TableCell>
                <TableCell className="text-right">{formatCurrency(pr.totalGross)}</TableCell>
                <TableCell className="text-right">{formatCurrency(pr.totalNet)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant={STATUS_VARIANTS[pr.status]}>
                      {STATUS_LABELS[pr.status]}
                    </Badge>
                    {showNotFiledBadge && pr.status === 'draft' && (
                      <Badge variant="error" data-testid={`not-filed-badge-${pr.id}`}>
                        Not Filed
                      </Badge>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
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
