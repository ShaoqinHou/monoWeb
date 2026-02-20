import { useState } from 'react';
import { Badge, type BadgeVariant } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Check, X, FileText } from 'lucide-react';
import type { QuoteStatus } from '../hooks/useQuotes';

interface QuoteWorkflowProps {
  status: QuoteStatus;
  onAccept: () => void;
  onDecline: (reason: string) => void;
  onConvertToInvoice: () => void;
  isAccepting?: boolean;
  isDeclining?: boolean;
  isConverting?: boolean;
}

const STATUS_VARIANT: Record<QuoteStatus, BadgeVariant> = {
  draft: 'default',
  sent: 'info',
  accepted: 'success',
  declined: 'error',
  expired: 'warning',
  invoiced: 'success',
};

const STATUS_LABEL: Record<QuoteStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  accepted: 'Accepted',
  declined: 'Declined',
  expired: 'Expired',
  invoiced: 'Invoiced',
};

const LIFECYCLE: QuoteStatus[] = ['draft', 'sent', 'accepted', 'invoiced'];

function getStepIndex(status: QuoteStatus): number {
  if (status === 'declined') return 2;
  if (status === 'expired') return 1;
  const idx = LIFECYCLE.indexOf(status);
  return idx >= 0 ? idx : 0;
}

export function QuoteWorkflow({
  status,
  onAccept,
  onDecline,
  onConvertToInvoice,
  isAccepting = false,
  isDeclining = false,
  isConverting = false,
}: QuoteWorkflowProps) {
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineInput, setShowDeclineInput] = useState(false);

  const currentStep = getStepIndex(status);

  const handleDecline = () => {
    if (!declineReason.trim()) return;
    onDecline(declineReason.trim());
    setDeclineReason('');
    setShowDeclineInput(false);
  };

  return (
    <div className="space-y-4" data-testid="quote-workflow">
      {/* Status badge */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-gray-700">Quote Status</span>
        <Badge variant={STATUS_VARIANT[status]} data-testid="quote-status-badge">
          {STATUS_LABEL[status]}
        </Badge>
      </div>

      {/* Lifecycle steps */}
      <div className="flex items-center gap-2" data-testid="quote-lifecycle">
        {LIFECYCLE.map((step, i) => {
          const isActive = i <= currentStep && status !== 'declined' && status !== 'expired';
          const isDeclinedStep = (status === 'declined') && i === 2;
          return (
            <div key={step} className="flex items-center gap-2">
              {i > 0 && (
                <div
                  className={`h-px w-8 ${isActive ? 'bg-[#0078c8]' : 'bg-gray-300'}`}
                />
              )}
              <div
                className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                  isDeclinedStep
                    ? 'bg-[#ef4444] text-white'
                    : isActive
                      ? 'bg-[#0078c8] text-white'
                      : 'bg-gray-200 text-gray-500'
                }`}
                data-testid={`lifecycle-${step}`}
              >
                {isDeclinedStep ? <X className="h-3 w-3" /> : i + 1}
              </div>
              <span className="text-xs text-gray-600 capitalize">{step}</span>
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {status === 'sent' && (
          <>
            <Button
              variant="primary"
              size="sm"
              onClick={onAccept}
              disabled={isAccepting}
              loading={isAccepting}
              data-testid="accept-quote-button"
            >
              <Check className="h-4 w-4 mr-1" />
              Accept
            </Button>
            {!showDeclineInput && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeclineInput(true)}
                data-testid="decline-toggle-button"
              >
                <X className="h-4 w-4 mr-1" />
                Decline
              </Button>
            )}
          </>
        )}

        {status === 'accepted' && (
          <Button
            variant="primary"
            size="sm"
            onClick={onConvertToInvoice}
            disabled={isConverting}
            loading={isConverting}
            data-testid="convert-to-invoice-button"
          >
            <FileText className="h-4 w-4 mr-1" />
            Convert to Invoice
          </Button>
        )}
      </div>

      {/* Decline reason input */}
      {showDeclineInput && (
        <div className="flex items-start gap-2" data-testid="decline-reason-section">
          <input
            type="text"
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder="Reason for declining..."
            className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078c8]"
            data-testid="decline-reason-input"
          />
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDecline}
            disabled={isDeclining || !declineReason.trim()}
            loading={isDeclining}
            data-testid="confirm-decline-button"
          >
            Decline
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowDeclineInput(false);
              setDeclineReason('');
            }}
            data-testid="cancel-decline-button"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
