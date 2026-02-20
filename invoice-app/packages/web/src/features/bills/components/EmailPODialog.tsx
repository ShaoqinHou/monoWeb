import { useState } from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

export interface EmailPODialogProps {
  open: boolean;
  onClose: () => void;
  purchaseOrderId: string;
  supplierEmail?: string;
  poNumber?: string;
  onSend: (data: { to: string; subject: string; body: string }) => void;
  loading?: boolean;
}

export function EmailPODialog({
  open,
  onClose,
  purchaseOrderId: _purchaseOrderId,
  supplierEmail = '',
  poNumber = '',
  onSend,
  loading = false,
}: EmailPODialogProps) {
  const [to, setTo] = useState(supplierEmail);
  const [subject, setSubject] = useState(poNumber ? `Purchase Order ${poNumber}` : 'Purchase Order');
  const [body, setBody] = useState(
    'Please find attached purchase order for your reference.',
  );
  const [error, setError] = useState('');

  const handleSend = () => {
    if (!to.trim()) {
      setError('Recipient email is required');
      return;
    }
    setError('');
    onSend({ to, subject, body });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Email Purchase Order"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} data-testid="email-cancel-btn">
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            loading={loading}
            data-testid="email-send-btn"
          >
            Send
          </Button>
        </>
      }
    >
      <div data-testid="email-po-dialog" className="space-y-3">
        <Input
          label="To"
          type="email"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="supplier@example.com"
          error={error || undefined}
          data-testid="email-to-input"
        />
        <Input
          label="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          data-testid="email-subject-input"
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#1a1a2e]">Message</label>
          <textarea
            className="w-full rounded border border-[#e5e7eb] px-3 py-2 text-sm text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#0078c8]/20 focus:border-[#0078c8] min-h-[100px]"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            data-testid="email-body-input"
            rows={4}
          />
        </div>
        <div
          className="rounded border border-dashed border-[#e5e7eb] bg-gray-50 p-4 text-center text-sm text-[#6b7280]"
          data-testid="email-pdf-preview"
        >
          PDF Preview Placeholder
        </div>
      </div>
    </Dialog>
  );
}
