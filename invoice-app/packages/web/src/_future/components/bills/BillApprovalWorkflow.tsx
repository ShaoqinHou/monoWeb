import { useState } from 'react';
import { Badge, type BadgeVariant } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Send, Check, X, Clock } from 'lucide-react';
import type { BillApprovalHistoryEntry, BillApprovalStatus } from '../hooks/useBillApproval';

interface BillApprovalWorkflowProps {
  status: BillApprovalStatus;
  history: BillApprovalHistoryEntry[];
  onSubmitForApproval: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
  isSubmitting?: boolean;
  isApproving?: boolean;
  isRejecting?: boolean;
  isApprover?: boolean;
}

const STATUS_VARIANT: Record<BillApprovalStatus, BadgeVariant> = {
  draft: 'default',
  submitted: 'info',
  approved: 'success',
  rejected: 'error',
};

const STATUS_LABEL: Record<BillApprovalStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted for Approval',
  approved: 'Approved',
  rejected: 'Rejected',
};

const STEPS: BillApprovalStatus[] = ['draft', 'submitted', 'approved'];

function formatTimestamp(ts: string): string {
  return new Date(ts).toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStepIndex(status: BillApprovalStatus): number {
  if (status === 'rejected') return 1;
  return STEPS.indexOf(status);
}

export function BillApprovalWorkflow({
  status,
  history,
  onSubmitForApproval,
  onApprove,
  onReject,
  isSubmitting = false,
  isApproving = false,
  isRejecting = false,
  isApprover = false,
}: BillApprovalWorkflowProps) {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const currentStep = getStepIndex(status);

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    onReject(rejectReason.trim());
    setRejectReason('');
    setShowRejectInput(false);
  };

  return (
    <div className="space-y-4" data-testid="bill-approval-workflow">
      {/* Status badge */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-gray-700">Approval Status</span>
        <Badge variant={STATUS_VARIANT[status]} data-testid="bill-approval-status-badge">
          {STATUS_LABEL[status]}
        </Badge>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-2" data-testid="bill-approval-steps">
        {STEPS.map((step, i) => {
          const isActive = i <= currentStep && status !== 'rejected';
          const isRejected = status === 'rejected' && i === 1;
          return (
            <div key={step} className="flex items-center gap-2">
              {i > 0 && (
                <div
                  className={`h-px w-8 ${isActive ? 'bg-[#0078c8]' : 'bg-gray-300'}`}
                />
              )}
              <div
                className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                  isRejected
                    ? 'bg-[#ef4444] text-white'
                    : isActive
                      ? 'bg-[#0078c8] text-white'
                      : 'bg-gray-200 text-gray-500'
                }`}
                data-testid={`bill-step-${step}`}
              >
                {isRejected ? <X className="h-3 w-3" /> : i + 1}
              </div>
              <span className="text-xs text-gray-600 capitalize">{step}</span>
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {status === 'draft' && (
          <Button
            variant="primary"
            size="sm"
            onClick={onSubmitForApproval}
            disabled={isSubmitting}
            loading={isSubmitting}
            data-testid="submit-bill-for-approval-button"
          >
            <Send className="h-4 w-4 mr-1" />
            Submit for Approval
          </Button>
        )}

        {status === 'submitted' && isApprover && (
          <>
            <Button
              variant="primary"
              size="sm"
              onClick={onApprove}
              disabled={isApproving}
              loading={isApproving}
              data-testid="approve-bill-button"
            >
              <Check className="h-4 w-4 mr-1" />
              Approve
            </Button>
            {!showRejectInput && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowRejectInput(true)}
                data-testid="reject-bill-toggle-button"
              >
                <X className="h-4 w-4 mr-1" />
                Reject
              </Button>
            )}
          </>
        )}
      </div>

      {/* Reject reason input */}
      {showRejectInput && (
        <div className="flex items-start gap-2" data-testid="bill-reject-reason-section">
          <input
            type="text"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection..."
            className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078c8]"
            data-testid="bill-reject-reason-input"
          />
          <Button
            variant="destructive"
            size="sm"
            onClick={handleReject}
            disabled={isRejecting || !rejectReason.trim()}
            loading={isRejecting}
            data-testid="confirm-bill-reject-button"
          >
            Reject
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowRejectInput(false);
              setRejectReason('');
            }}
            data-testid="cancel-bill-reject-button"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Approval history */}
      {history.length > 0 && (
        <div className="border-t border-gray-200 pt-3" data-testid="bill-approval-history">
          <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Approval History</h4>
          <div className="space-y-2">
            {history.map((entry) => (
              <div key={entry.id} className="flex items-start gap-2 text-sm" data-testid="bill-history-entry">
                <Clock className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium">{entry.userName}</span>
                  <span className="text-gray-500">
                    {' '}
                    {entry.action === 'submitted' && 'submitted for approval'}
                    {entry.action === 'approved' && 'approved'}
                    {entry.action === 'rejected' && 'rejected'}
                  </span>
                  {entry.notes && (
                    <span className="text-gray-500"> &mdash; {entry.notes}</span>
                  )}
                  <p className="text-xs text-gray-400">{formatTimestamp(entry.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
