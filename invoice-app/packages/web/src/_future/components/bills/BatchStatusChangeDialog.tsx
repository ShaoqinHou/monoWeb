import { useState } from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import {
  useBatchBillStatusChange,
  getValidTargetStatuses,
} from '../hooks/useBatchStatusChange';
import type { BillStatusType } from '../types';

export interface StatusChangeItem {
  id: string;
  reference: string;
  currentStatus: BillStatusType;
  contactName: string;
}

export interface BatchStatusChangeDialogProps {
  open: boolean;
  onClose: () => void;
  items: StatusChangeItem[];
}

const STATUS_LABELS: Record<BillStatusType, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  paid: 'Paid',
  voided: 'Voided',
};

const STATUS_VARIANTS: Record<BillStatusType, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  draft: 'default',
  submitted: 'info',
  approved: 'success',
  paid: 'success',
  voided: 'error',
};

export function BatchStatusChangeDialog({ open, onClose, items }: BatchStatusChangeDialogProps) {
  const currentStatuses = [...new Set(items.map(i => i.currentStatus))];
  const validTargets = getValidTargetStatuses(currentStatuses);

  const [targetStatus, setTargetStatus] = useState<BillStatusType | ''>('');
  const [result, setResult] = useState<{ succeeded: number; failed: number } | null>(null);

  const mutation = useBatchBillStatusChange();

  const handleApply = async () => {
    if (!targetStatus) return;
    try {
      const res = await mutation.mutateAsync({
        billIds: items.map(i => i.id),
        targetStatus: targetStatus as BillStatusType,
      });
      setResult({ succeeded: res.succeeded.length, failed: res.failed.length });
    } catch {
      setResult({ succeeded: 0, failed: items.length });
    }
  };

  const handleClose = () => {
    setTargetStatus('');
    setResult(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} title="Change Status" className="max-w-lg">
      <div className="space-y-4">
        {result ? (
          <div className="py-4 text-center space-y-2">
            <p className="text-lg font-semibold" data-testid="status-change-result">
              {result.succeeded} updated successfully
            </p>
            {result.failed > 0 && (
              <p className="text-sm text-[#ef4444]">{result.failed} failed</p>
            )}
          </div>
        ) : (
          <>
            {validTargets.length > 0 ? (
              <Select
                label="New Status"
                options={validTargets.map(s => ({ value: s, label: STATUS_LABELS[s] }))}
                value={targetStatus}
                onChange={e => setTargetStatus(e.target.value as BillStatusType)}
                placeholder="Select a status..."
                data-testid="target-status-select"
              />
            ) : (
              <p className="text-sm text-[#ef4444]">
                No valid status transitions available for the selected items.
              </p>
            )}

            <div className="border rounded divide-y max-h-60 overflow-y-auto">
              {items.map(item => (
                <div key={item.id} className="px-3 py-2 text-sm flex justify-between items-center">
                  <div>
                    <span className="font-medium">{item.reference || item.id.slice(0, 8)}</span>
                    <span className="text-[#6b7280] ml-2">{item.contactName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={STATUS_VARIANTS[item.currentStatus]}>
                      {STATUS_LABELS[item.currentStatus]}
                    </Badge>
                    {targetStatus && (
                      <>
                        <span className="text-[#6b7280]" aria-label="changes to">&rarr;</span>
                        <Badge variant={STATUS_VARIANTS[targetStatus as BillStatusType]}>
                          {STATUS_LABELS[targetStatus as BillStatusType]}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-[#e5e7eb]">
        <Button variant="ghost" onClick={handleClose}>
          {result ? 'Close' : 'Cancel'}
        </Button>
        {!result && validTargets.length > 0 && (
          <Button
            onClick={handleApply}
            disabled={!targetStatus}
            loading={mutation.isPending}
            data-testid="apply-status-change"
          >
            Apply to All
          </Button>
        )}
      </div>
    </Dialog>
  );
}
