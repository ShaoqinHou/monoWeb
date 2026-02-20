import { Button } from '../../../components/ui/Button';
import { nextStatuses, isEditable, canTransition } from '@shared/rules/invoice-status';
import type { BillStatusType } from '../types';

interface BillActionsProps {
  status: BillStatusType;
  onStatusChange: (newStatus: BillStatusType) => void;
  onEdit?: () => void;
  loading?: boolean;
}

const STATUS_BUTTON_LABELS: Record<string, { label: string; variant: 'primary' | 'secondary' | 'destructive' }> = {
  submitted: { label: 'Submit', variant: 'primary' },
  approved: { label: 'Approve', variant: 'primary' },
  paid: { label: 'Mark as Paid', variant: 'primary' },
  draft: { label: 'Revert to Draft', variant: 'secondary' },
  voided: { label: 'Void', variant: 'destructive' },
};

export function BillActions({ status, onStatusChange, onEdit, loading = false }: BillActionsProps) {
  const available = nextStatuses(status);
  const editable = isEditable(status);

  if (available.length === 0 && !editable) {
    return null;
  }

  return (
    <div className="flex items-center gap-2" data-testid="bill-actions">
      {editable && onEdit && (
        <Button variant="outline" onClick={onEdit} data-testid="bill-edit-btn">
          Edit
        </Button>
      )}
      {available.map((nextStatus) => {
        const config = STATUS_BUTTON_LABELS[nextStatus] ?? {
          label: nextStatus,
          variant: 'secondary' as const,
        };
        const valid = canTransition(status, nextStatus);
        return (
          <Button
            key={nextStatus}
            variant={config.variant}
            onClick={() => onStatusChange(nextStatus as BillStatusType)}
            disabled={!valid || loading}
            loading={loading}
            data-testid={`bill-action-${nextStatus}`}
          >
            {config.label}
          </Button>
        );
      })}
    </div>
  );
}
