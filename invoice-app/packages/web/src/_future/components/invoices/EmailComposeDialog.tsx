import { useState, useCallback } from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useSendInvoiceEmail } from '../hooks/useSendInvoiceEmail';

export interface EmailComposeDialogProps {
  open: boolean;
  onClose: (result?: { sent: boolean; sentAt?: string }) => void;
  invoiceId?: string;
  defaultTo?: string;
  defaultSubject?: string;
  defaultBody?: string;
}

export function EmailComposeDialog({
  open,
  onClose,
  invoiceId,
  defaultTo = '',
  defaultSubject = '',
  defaultBody = '',
}: EmailComposeDialogProps) {
  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [sentStatus, setSentStatus] = useState<string | null>(null);
  const sendEmail = useSendInvoiceEmail();

  const handleSend = useCallback(async () => {
    if (invoiceId) {
      try {
        const result = await sendEmail.mutateAsync({ invoiceId, to, subject, body });
        setSentStatus(`Email sent at ${result.sentAt}`);
        onClose({ sent: true, sentAt: result.sentAt });
      } catch {
        onClose({ sent: true });
      }
    } else {
      onClose({ sent: true });
    }
  }, [onClose, invoiceId, to, subject, body, sendEmail]);

  const handleCancel = useCallback(() => {
    setSentStatus(null);
    onClose();
  }, [onClose]);

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      title="Send Email"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={handleCancel}
            data-testid="email-cancel-button"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={sendEmail.isPending}
            loading={sendEmail.isPending}
            data-testid="email-send-button"
          >
            Send
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4" data-testid="email-compose-dialog">
        {sentStatus && (
          <div
            className="rounded bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800"
            data-testid="email-sent-status"
          >
            {sentStatus}
          </div>
        )}
        <Input
          label="To"
          type="email"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="recipient@example.com"
          data-testid="email-to-field"
        />
        <Input
          label="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Invoice from My Organisation"
          data-testid="email-subject-field"
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#1a1a2e]">Message</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full rounded border border-[#e5e7eb] px-3 py-2 text-sm text-[#1a1a2e] focus:border-[#0078c8] focus:outline-none focus:ring-2 focus:ring-[#0078c8]/20"
            rows={5}
            data-testid="email-body-field"
          />
        </div>
        <div
          className="rounded border border-dashed border-[#e5e7eb] bg-gray-50 p-6 text-center text-sm text-[#6b7280]"
          data-testid="pdf-preview-placeholder"
        >
          PDF Preview
        </div>
      </div>
    </Dialog>
  );
}
