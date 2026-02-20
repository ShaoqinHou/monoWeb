import { useState } from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { useBatchCreateCreditNotes, type CreditNoteItem } from '../hooks/useBatchCreditNotes';

export interface CreditableInvoice {
  id: string;
  invoiceNumber: string;
  contactName: string;
  total: number;
  amountDue: number;
}

export interface BatchCreditNoteDialogProps {
  open: boolean;
  onClose: () => void;
  invoices: CreditableInvoice[];
}

interface CreditConfig {
  invoiceId: string;
  creditType: 'full' | 'partial';
  amount: number;
  reason: string;
}

export function BatchCreditNoteDialog({ open, onClose, invoices }: BatchCreditNoteDialogProps) {
  const [configs, setConfigs] = useState<CreditConfig[]>(() =>
    invoices.map(inv => ({
      invoiceId: inv.id,
      creditType: 'full' as const,
      amount: inv.amountDue,
      reason: '',
    }))
  );
  const [showPreview, setShowPreview] = useState(false);
  const [result, setResult] = useState<{ created: number; failed: number } | null>(null);

  const mutation = useBatchCreateCreditNotes();

  const updateConfig = (invoiceId: string, update: Partial<CreditConfig>) => {
    setConfigs(prev =>
      prev.map(c => (c.invoiceId === invoiceId ? { ...c, ...update } : c))
    );
  };

  const totalCreditAmount = configs.reduce((sum, c) => sum + c.amount, 0);

  const handleCreateAll = async () => {
    const items: CreditNoteItem[] = configs.map(c => ({
      invoiceId: c.invoiceId,
      amount: c.creditType === 'partial' ? c.amount : undefined,
      reason: c.reason,
    }));

    try {
      const res = await mutation.mutateAsync({ items });
      setResult({ created: res.createdIds.length, failed: res.failed.length });
    } catch {
      setResult({ created: 0, failed: configs.length });
    }
  };

  const handleClose = () => {
    setShowPreview(false);
    setResult(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} title="Batch Create Credit Notes" className="max-w-2xl">
      <div className="space-y-4">
        {result ? (
          <div className="py-4 text-center space-y-2">
            <p className="text-lg font-semibold" data-testid="credit-result">
              {result.created} credit note(s) created
            </p>
            {result.failed > 0 && (
              <p className="text-sm text-[#ef4444]">{result.failed} failed</p>
            )}
          </div>
        ) : showPreview ? (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Preview Credit Notes</h3>
            <div className="border rounded divide-y max-h-60 overflow-y-auto">
              {configs.map(config => {
                const inv = invoices.find(i => i.id === config.invoiceId);
                return (
                  <div key={config.invoiceId} className="px-3 py-2 text-sm flex justify-between items-center">
                    <div>
                      <span className="font-medium">{inv?.invoiceNumber}</span>
                      <span className="text-[#6b7280] ml-2">{inv?.contactName}</span>
                    </div>
                    <Badge variant={config.creditType === 'full' ? 'info' : 'warning'}>
                      ${config.amount.toFixed(2)}
                    </Badge>
                  </div>
                );
              })}
            </div>
            <p className="text-sm font-medium">
              Total credit: ${totalCreditAmount.toFixed(2)}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-[#6b7280]">
              Configure credit notes for {invoices.length} invoice(s):
            </p>
            <div className="border rounded divide-y max-h-80 overflow-y-auto">
              {invoices.map(inv => {
                const config = configs.find(c => c.invoiceId === inv.id);
                return (
                  <div key={inv.id} className="px-3 py-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium text-sm">{inv.invoiceNumber}</span>
                        <span className="text-[#6b7280] text-sm ml-2">{inv.contactName}</span>
                      </div>
                      <span className="text-sm">Outstanding: ${inv.amountDue.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="radio"
                          name={`credit-type-${inv.id}`}
                          checked={config?.creditType === 'full'}
                          onChange={() => updateConfig(inv.id, { creditType: 'full', amount: inv.amountDue })}
                        />
                        Full credit
                      </label>
                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="radio"
                          name={`credit-type-${inv.id}`}
                          checked={config?.creditType === 'partial'}
                          onChange={() => updateConfig(inv.id, { creditType: 'partial' })}
                        />
                        Partial
                      </label>
                      {config?.creditType === 'partial' && (
                        <Input
                          type="number"
                          value={config.amount}
                          onChange={e => updateConfig(inv.id, { amount: Number(e.target.value) })}
                          className="w-24"
                          data-testid={`partial-amount-${inv.id}`}
                        />
                      )}
                    </div>
                    <Input
                      placeholder="Reason (optional)"
                      value={config?.reason ?? ''}
                      onChange={e => updateConfig(inv.id, { reason: e.target.value })}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-4 pt-4 border-t border-[#e5e7eb]">
        <Button variant="ghost" onClick={result ? handleClose : showPreview ? () => setShowPreview(false) : handleClose}>
          {result ? 'Close' : showPreview ? 'Back' : 'Cancel'}
        </Button>
        {!result && (
          <Button
            onClick={showPreview ? handleCreateAll : () => setShowPreview(true)}
            loading={mutation.isPending}
          >
            {showPreview ? 'Create All Credits' : 'Preview'}
          </Button>
        )}
      </div>
    </Dialog>
  );
}
