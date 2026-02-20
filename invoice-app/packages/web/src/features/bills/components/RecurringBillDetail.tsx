import { Badge, type BadgeVariant } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import type { RecurringBill, RecurringBillStatus } from '../hooks/useRecurringBills';

interface RecurringBillDetailProps {
  bill: RecurringBill;
  onEdit: () => void;
  onPauseResume: (newStatus: 'active' | 'paused') => void;
  onGenerate: () => void;
  isUpdating?: boolean;
}

const STATUS_VARIANT: Record<RecurringBillStatus, BadgeVariant> = {
  active: 'success',
  paused: 'warning',
  completed: 'default',
};

const STATUS_LABEL: Record<RecurringBillStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
};

const FREQUENCY_LABEL: Record<string, string> = {
  weekly: 'Weekly',
  fortnightly: 'Fortnightly',
  monthly: 'Monthly',
  bimonthly: 'Bi-monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

export function RecurringBillDetail({
  bill,
  onEdit,
  onPauseResume,
  onGenerate,
  isUpdating = false,
}: RecurringBillDetailProps) {
  const canPauseResume = bill.status !== 'completed';
  const isPaused = bill.status === 'paused';

  return (
    <div className="space-y-6" data-testid="recurring-bill-detail">
      {/* Header row: status + actions */}
      <div className="flex items-center justify-between">
        <Badge
          variant={STATUS_VARIANT[bill.status] ?? 'default'}
          data-testid="rb-detail-status"
        >
          {STATUS_LABEL[bill.status] ?? bill.status}
        </Badge>

        {canPauseResume && (
          <div className="flex items-center gap-2" data-testid="rb-detail-actions">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPauseResume(isPaused ? 'active' : 'paused')}
              loading={isUpdating}
              data-testid="rb-pause-resume-btn"
            >
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onEdit}
              data-testid="rb-edit-btn"
            >
              Edit
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onGenerate}
              loading={isUpdating}
              data-testid="rb-generate-btn"
            >
              Generate Bill Now
            </Button>
          </div>
        )}
      </div>

      {/* Detail fields */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Template Name</h3>
          <p className="mt-1 text-sm text-gray-900" data-testid="rb-detail-template-name">
            {bill.templateName}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Supplier</h3>
          <p className="mt-1 text-sm text-gray-900" data-testid="rb-detail-contact">
            {bill.contactName}
          </p>
        </div>
      </div>

      {/* Schedule summary */}
      <div className="rounded-md border p-4" data-testid="rb-schedule-summary">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Schedule</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <span className="text-xs text-gray-500 block">Frequency</span>
            <span className="text-sm" data-testid="rb-detail-frequency">
              {FREQUENCY_LABEL[bill.frequency] ?? bill.frequency}
            </span>
          </div>
          <div>
            <span className="text-xs text-gray-500 block">Next Date</span>
            <span className="text-sm" data-testid="rb-detail-next-date">
              {bill.nextDate}
            </span>
          </div>
          <div>
            <span className="text-xs text-gray-500 block">End Date</span>
            <span className="text-sm" data-testid="rb-detail-end-date">
              {bill.endDate ?? 'No end date'}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-3">
          <div>
            <span className="text-xs text-gray-500 block">Days Until Due</span>
            <span className="text-sm" data-testid="rb-detail-days-until-due">
              {bill.daysUntilDue} days
            </span>
          </div>
          <div>
            <span className="text-xs text-gray-500 block">Times Generated</span>
            <span className="text-sm" data-testid="rb-detail-times-generated">
              {bill.timesGenerated}
            </span>
          </div>
          <div>
            <span className="text-xs text-gray-500 block">Created</span>
            <span className="text-sm" data-testid="rb-detail-created">
              {new Date(bill.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-72 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span data-testid="rb-detail-subtotal">NZD {bill.subTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax</span>
            <span data-testid="rb-detail-tax">NZD {bill.totalTax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Total</span>
            <span data-testid="rb-detail-total">NZD {bill.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
