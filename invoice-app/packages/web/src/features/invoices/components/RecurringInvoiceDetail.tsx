import { Card, CardContent } from '../../../components/ui/Card';
import { Badge, type BadgeVariant } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Pencil, Pause, Play, Zap } from 'lucide-react';
import type { RecurringInvoice, RecurringStatus, RecurringFrequency } from '../hooks/useRecurringInvoices';

interface RecurringInvoiceDetailProps {
  invoice: RecurringInvoice;
  onEdit: () => void;
  onPauseResume: (newStatus: RecurringStatus) => void;
  onGenerate: () => void;
  isTransitioning?: boolean;
  isGenerating?: boolean;
}

const STATUS_VARIANT: Record<RecurringStatus, BadgeVariant> = {
  active: 'success',
  paused: 'warning',
  completed: 'default',
};

const STATUS_LABEL: Record<RecurringStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
};

const FREQUENCY_LABEL: Record<RecurringFrequency, string> = {
  weekly: 'Every week',
  fortnightly: 'Every 2 weeks',
  monthly: 'Every month',
  bimonthly: 'Every 2 months',
  quarterly: 'Every 3 months',
  yearly: 'Every year',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function RecurringInvoiceDetail({
  invoice,
  onEdit,
  onPauseResume,
  onGenerate,
  isTransitioning = false,
  isGenerating = false,
}: RecurringInvoiceDetailProps) {
  const canEdit = invoice.status !== 'completed';
  const canPause = invoice.status === 'active';
  const canResume = invoice.status === 'paused';
  const canGenerate = invoice.status === 'active';

  const scheduleSummary = `${FREQUENCY_LABEL[invoice.frequency]} starting ${formatDate(invoice.createdAt)}, next invoice ${formatDate(invoice.nextDate)}`;

  return (
    <div className="space-y-6" data-testid="recurring-invoice-detail">
      {/* Header: status + actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge
            variant={STATUS_VARIANT[invoice.status]}
            data-testid="recurring-status-badge"
          >
            {STATUS_LABEL[invoice.status]}
          </Badge>
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              data-testid="edit-recurring-button"
            >
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
          {canPause && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPauseResume('paused')}
              disabled={isTransitioning}
              loading={isTransitioning}
              data-testid="pause-recurring-button"
            >
              <Pause className="h-4 w-4 mr-1" />
              Pause
            </Button>
          )}
          {canResume && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPauseResume('active')}
              disabled={isTransitioning}
              loading={isTransitioning}
              data-testid="resume-recurring-button"
            >
              <Play className="h-4 w-4 mr-1" />
              Resume
            </Button>
          )}
          {canGenerate && (
            <Button
              variant="primary"
              size="sm"
              onClick={onGenerate}
              disabled={isGenerating}
              loading={isGenerating}
              data-testid="generate-invoice-button"
            >
              <Zap className="h-4 w-4 mr-1" />
              Generate Invoice Now
            </Button>
          )}
        </div>
      </div>

      {/* Schedule summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-md px-4 py-3" data-testid="schedule-summary">
        <p className="text-sm text-blue-800">{scheduleSummary}</p>
      </div>

      {/* Detail card */}
      <Card>
        <CardContent className="space-y-6 p-8">
          {/* Template + Contact */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500 mb-1">Template Name</p>
              <p className="font-medium text-gray-900" data-testid="detail-template-name">
                {invoice.templateName}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500 mb-1">Contact</p>
              <p className="font-medium text-gray-900" data-testid="detail-contact">
                {invoice.contactName}
              </p>
            </div>
          </div>

          {/* Schedule details */}
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Frequency</p>
              <p className="font-medium capitalize" data-testid="detail-frequency">
                {invoice.frequency}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Next Invoice Date</p>
              <p className="font-medium" data-testid="detail-next-date">
                {formatDate(invoice.nextDate)}
              </p>
            </div>
            <div>
              <p className="text-gray-500">End Date</p>
              <p className="font-medium" data-testid="detail-end-date">
                {invoice.endDate ? formatDate(invoice.endDate) : 'No end date'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Days Until Due</p>
              <p className="font-medium" data-testid="detail-days-until-due">
                {invoice.daysUntilDue} days
              </p>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-72 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span data-testid="detail-subtotal">
                  NZD {invoice.subTotal.toFixed(2)}
                </span>
              </div>
              {invoice.totalTax > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span data-testid="detail-tax">
                    NZD {invoice.totalTax.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold">
                <span>Total</span>
                <span data-testid="detail-total">
                  NZD {invoice.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Generation stats */}
          <div className="border-t border-gray-200 pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Times Generated</p>
                <p className="font-medium" data-testid="detail-times-generated">
                  {invoice.timesGenerated}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Created</p>
                <p className="font-medium" data-testid="detail-created-at">
                  {formatDate(invoice.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
