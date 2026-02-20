import { useState } from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Dialog } from '../../../components/ui/Dialog';
import { formatCurrency } from '@shared/calc/currency';
import { PayslipCard } from './PayslipCard';
import type { PayRun } from '../types';
import type { BadgeVariant } from '../../../components/ui/Badge';

interface PayRunDetailProps {
  payRun: PayRun;
  onPost: () => void;
  posting?: boolean;
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

export function PayRunDetail({ payRun, onPost, posting = false }: PayRunDetailProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handlePost = () => {
    setShowConfirm(false);
    onPost();
  };

  return (
    <div className="space-y-6" data-testid="pay-run-detail">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#1a1a2e]">
            Pay Run: {formatDate(payRun.periodStart)} - {formatDate(payRun.periodEnd)}
          </h2>
          <p className="text-sm text-[#6b7280]">Pay Date: {formatDate(payRun.payDate)}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={STATUS_VARIANTS[payRun.status]}>
            {STATUS_LABELS[payRun.status]}
          </Badge>
          {payRun.status === 'draft' && (
            <Button
              size="sm"
              onClick={() => setShowConfirm(true)}
              loading={posting}
              disabled={posting}
            >
              Post Pay Run
            </Button>
          )}
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent>
            <p className="text-sm text-[#6b7280]">Total Gross</p>
            <p className="text-xl font-bold text-[#1a1a2e]">{formatCurrency(payRun.totalGross)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-[#6b7280]">Total Tax/Deductions</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(payRun.totalTax)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-[#6b7280]">Total Net</p>
            <p className="text-xl font-bold text-[#14b8a6]">{formatCurrency(payRun.totalNet)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Payslips */}
      <div>
        <h3 className="text-lg font-semibold text-[#1a1a2e] mb-3">
          Payslips ({payRun.payslips?.length ?? payRun.employees.length})
        </h3>
        {payRun.payslips && payRun.payslips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {payRun.payslips.map((ps) => (
              <PayslipCard key={ps.id} payslip={ps} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {payRun.employees.map((emp) => (
              <Card key={emp.employeeId} data-testid={`payslip-${emp.employeeId}`}>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-[#1a1a2e]">{emp.employeeName}</h4>
                    <span className="text-sm font-bold text-[#1a1a2e]">{formatCurrency(emp.net)}</span>
                  </div>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-[#6b7280]">Gross</dt>
                      <dd>{formatCurrency(emp.gross)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[#6b7280]">Tax</dt>
                      <dd className="text-red-600">-{formatCurrency(emp.tax)}</dd>
                    </div>
                    <div className="flex justify-between font-semibold border-t border-[#e5e7eb] pt-1 mt-1">
                      <dt>Net</dt>
                      <dd>{formatCurrency(emp.net)}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Post confirmation dialog */}
      <Dialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Post Pay Run"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={handlePost} loading={posting}>
              Confirm Post
            </Button>
          </>
        }
      >
        <p className="text-sm text-[#6b7280]">
          Are you sure you want to post this pay run? This will finalize all payslips
          for the period {formatDate(payRun.periodStart)} - {formatDate(payRun.periodEnd)}.
          This action cannot be undone.
        </p>
      </Dialog>
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
