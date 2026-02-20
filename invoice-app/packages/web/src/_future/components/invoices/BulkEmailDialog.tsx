import { useState, useCallback } from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useBulkEmail } from '../hooks/useBulkEmail';

export interface BulkEmailDialogProps {
  open: boolean;
  onClose: (result?: { sent: boolean; sentCount?: number }) => void;
  invoiceIds: string[];
}

export function BulkEmailDialog({
  open,
  onClose,
  invoiceIds,
}: BulkEmailDialogProps) {
  const [subject, setSubject] = useState('Invoice from My Organisation');
  const [sentCount, setSentCount] = useState<number | null>(null);
  const bulkEmail = useBulkEmail();

  const handleSendAll = useCallback(async () => {
    try {
      const result = await bulkEmail.mutateAsync({ invoiceIds, subject });
      setSentCount(result.sentCount);
      onClose({ sent: true, sentCount: result.sentCount });
    } catch {
      onClose({ sent: true });
    }
  }, [onClose, invoiceIds, subject, bulkEmail]);

  const handleCancel = useCallback(() => {
    setSentCount(null);
    onClose();
  }, [onClose]);

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      title="Send Invoices by Email"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={handleCancel}
            data-testid="bulk-email-cancel-button"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSendAll}
            disabled={bulkEmail.isPending}
            loading={bulkEmail.isPending}
            data-testid="bulk-email-send-button"
          >
            Send All ({invoiceIds.length})
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4" data-testid="bulk-email-dialog">
        {sentCount !== null && (
          <div
            className="rounded bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800"
            data-testid="bulk-email-sent-count"
          >
            Successfully sent {sentCount} emails
          </div>
        )}
        <Input
          label="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Invoice from My Organisation"
          data-testid="bulk-email-subject-field"
        />

        <div>
          <label className="text-sm font-medium text-[#1a1a2e]">
            Invoices to send ({invoiceIds.length})
          </label>
          <ul
            className="mt-2 max-h-48 overflow-y-auto rounded border border-[#e5e7eb] divide-y divide-[#e5e7eb]"
            data-testid="bulk-email-invoice-list"
          >
            {invoiceIds.map((id) => (
              <li
                key={id}
                className="px-3 py-2 text-sm text-[#1a1a2e]"
                data-testid={`bulk-email-invoice-${id}`}
              >
                {id}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Dialog>
  );
}
