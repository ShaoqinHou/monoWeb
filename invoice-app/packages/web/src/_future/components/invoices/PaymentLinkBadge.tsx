import { useState, useCallback } from 'react';
import { Badge } from '../../../components/ui/Badge';

export interface PaymentLinkBadgeProps {
  invoiceId: string;
  className?: string;
}

export function PaymentLinkBadge({ invoiceId, className }: PaymentLinkBadgeProps) {
  const [copied, setCopied] = useState(false);
  const paymentUrl = `https://pay.xero.com/${invoiceId}`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(paymentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for environments without clipboard API
      setCopied(false);
    }
  }, [paymentUrl]);

  return (
    <div
      className={`inline-flex items-center gap-2 ${className ?? ''}`}
      data-testid="payment-link-badge"
    >
      <Badge variant="info">
        <span data-testid="payment-link-url" className="font-mono text-xs">
          {paymentUrl}
        </span>
      </Badge>
      <button
        onClick={handleCopy}
        className="rounded px-2 py-1 text-xs font-medium text-[#0078c8] hover:bg-[#0078c8]/5 transition-colors"
        data-testid="copy-link-button"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}
