import type { BillStatusType } from '../types';
import type { PurchaseOrderStatus } from '../hooks/usePurchaseOrders';

type SupportedStatus = BillStatusType | PurchaseOrderStatus;

interface ApprovalProgressProps {
  status: SupportedStatus;
  variant?: 'bill' | 'purchase-order';
}

const BILL_STEPS: { key: string; label: string }[] = [
  { key: 'draft', label: 'Draft' },
  { key: 'submitted', label: 'Awaiting Approval' },
  { key: 'approved', label: 'Approved' },
  { key: 'paid', label: 'Paid' },
];

const PO_STEPS: { key: string; label: string }[] = [
  { key: 'draft', label: 'Draft' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'approved', label: 'Approved' },
];

function stepIndex(status: string, steps: { key: string }[]): number {
  return steps.findIndex((s) => s.key === status);
}

export function ApprovalProgress({ status, variant = 'bill' }: ApprovalProgressProps) {
  // Voided / rejected states
  if (status === 'voided') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3" data-testid="approval-progress">
        <p className="text-sm font-medium text-red-700">This bill has been voided</p>
      </div>
    );
  }

  const steps = variant === 'purchase-order' ? PO_STEPS : BILL_STEPS;
  const currentIdx = stepIndex(status, steps);

  // Handle rejected PO — show as a special state
  if (currentIdx === -1) {
    return (
      <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3" data-testid="approval-progress">
        <p className="text-sm font-medium text-orange-700" data-testid="approval-status-label">
          Status: {status}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3" data-testid="approval-progress">
      <div className="flex items-center justify-between">
        {steps.map((step, i) => {
          const isCompleted = i < currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <div key={step.key} className="flex items-center gap-2">
              {i > 0 && (
                <div
                  className={`h-0.5 w-8 ${isCompleted ? 'bg-teal-500' : 'bg-gray-200'}`}
                  aria-hidden="true"
                />
              )}
              <div className="flex items-center gap-1.5">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                    isCompleted
                      ? 'bg-teal-500 text-white'
                      : isCurrent
                        ? 'border-2 border-teal-500 text-teal-600'
                        : 'border border-gray-300 text-gray-400'
                  }`}
                  data-testid={`step-${step.key}`}
                >
                  {isCompleted ? '\u2713' : i + 1}
                </div>
                <span
                  className={`text-xs font-medium ${
                    isCurrent ? 'text-teal-600' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
