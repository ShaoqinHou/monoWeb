import { Badge, type BadgeVariant } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Zap, Calendar, Clock, RefreshCw, Building2 } from 'lucide-react';
import type { RecurringBillScheduleInfo as ScheduleInfo } from '../hooks/useRecurringBillGeneration';

interface RecurringBillScheduleInfoProps {
  schedule: ScheduleInfo;
  onGenerateNow: () => void;
  isGenerating?: boolean;
}

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  active: 'success',
  paused: 'warning',
  completed: 'default',
};

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function RecurringBillScheduleInfo({
  schedule,
  onGenerateNow,
  isGenerating = false,
}: RecurringBillScheduleInfoProps) {
  const canGenerate = schedule.status === 'active';

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3" data-testid="recurring-bill-schedule-info">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Bill Schedule</h3>
        <Badge
          variant={STATUS_VARIANT[schedule.status] ?? 'default'}
          data-testid="bill-schedule-status-badge"
        >
          {STATUS_LABEL[schedule.status] ?? schedule.status}
        </Badge>
      </div>

      {/* Supplier */}
      <div className="flex items-center gap-2 text-sm">
        <Building2 className="h-4 w-4 text-gray-400" />
        <span className="text-gray-500">Supplier:</span>
        <span className="font-medium" data-testid="bill-schedule-supplier">
          {schedule.supplierName}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="flex items-start gap-2">
          <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
          <div>
            <p className="text-gray-500">Next Run</p>
            <p className="font-medium" data-testid="bill-schedule-next-date">
              {formatDate(schedule.nextDate)}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <RefreshCw className="h-4 w-4 text-gray-400 mt-0.5" />
          <div>
            <p className="text-gray-500">Frequency</p>
            <p className="font-medium capitalize" data-testid="bill-schedule-frequency">
              {schedule.frequency}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
          <div>
            <p className="text-gray-500">Last Generated</p>
            <p className="font-medium" data-testid="bill-schedule-last-generated">
              {schedule.lastGeneratedDate
                ? formatDate(schedule.lastGeneratedDate)
                : 'Never'}
            </p>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500" data-testid="bill-schedule-generation-count">
        Generated {schedule.timesGenerated} time{schedule.timesGenerated !== 1 ? 's' : ''}
      </div>

      {canGenerate && (
        <Button
          variant="outline"
          size="sm"
          onClick={onGenerateNow}
          disabled={isGenerating}
          loading={isGenerating}
          data-testid="generate-bill-now-button"
        >
          <Zap className="h-4 w-4 mr-1" />
          Generate Now
        </Button>
      )}
    </div>
  );
}
