import { useState } from 'react';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { Dialog } from '../../../../components/ui/Dialog';
import {
  useSplitTransaction,
  validateSplitTotal,
  MAX_SPLIT_LINES,
} from '../hooks/useSplitTransaction';
import type { SplitLine } from '../hooks/useSplitTransaction';

interface SplitTransactionDialogProps {
  transactionId: string;
  originalAmount: number;
  open: boolean;
  onClose: () => void;
}

function emptyLine(): SplitLine {
  return { accountCode: '', amount: 0, taxRate: '', description: '' };
}

export function SplitTransactionDialog({
  transactionId,
  originalAmount,
  open,
  onClose,
}: SplitTransactionDialogProps) {
  const [lines, setLines] = useState<SplitLine[]>([
    { ...emptyLine(), amount: originalAmount },
  ]);
  const mutation = useSplitTransaction();

  const validationError = validateSplitTotal(lines, originalAmount);
  const currentTotal = lines.reduce((sum, l) => sum + l.amount, 0);
  const remaining = originalAmount - currentTotal;

  const handleLineChange = (index: number, field: keyof SplitLine, value: string | number) => {
    setLines((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddLine = () => {
    if (lines.length < MAX_SPLIT_LINES) {
      setLines((prev) => [...prev, emptyLine()]);
    }
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length > 1) {
      setLines((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSave = () => {
    if (validationError) return;
    mutation.mutate(
      { transactionId, lines },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Split Transaction"
      className="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            loading={mutation.isPending}
            disabled={!!validationError}
            data-testid="split-save-btn"
          >
            Save Split
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Original Amount: <strong>${originalAmount.toFixed(2)}</strong></span>
          <span data-testid="split-remaining">
            Remaining: <strong className={Math.abs(remaining) > 0.01 ? 'text-red-600' : 'text-green-600'}>
              ${remaining.toFixed(2)}
            </strong>
          </span>
        </div>

        <div className="space-y-3" data-testid="split-lines">
          {lines.map((line, i) => (
            <div key={i} className="flex items-end gap-2 p-2 bg-gray-50 rounded" data-testid={`split-line-${i}`}>
              <Input
                label={i === 0 ? 'Account' : undefined}
                placeholder="Account code"
                value={line.accountCode}
                onChange={(e) => handleLineChange(i, 'accountCode', e.target.value)}
                className="w-28"
              />
              <Input
                label={i === 0 ? 'Amount' : undefined}
                type="number"
                step="0.01"
                value={line.amount || ''}
                onChange={(e) => handleLineChange(i, 'amount', parseFloat(e.target.value) || 0)}
                className="w-28"
              />
              <Input
                label={i === 0 ? 'Tax Rate' : undefined}
                placeholder="Tax rate"
                value={line.taxRate}
                onChange={(e) => handleLineChange(i, 'taxRate', e.target.value)}
                className="w-24"
              />
              <Input
                label={i === 0 ? 'Description' : undefined}
                placeholder="Description"
                value={line.description}
                onChange={(e) => handleLineChange(i, 'description', e.target.value)}
                className="flex-1"
              />
              {lines.length > 1 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveLine(i)}
                  aria-label="Remove line"
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>

        {lines.length < MAX_SPLIT_LINES && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAddLine}
            data-testid="add-split-line-btn"
          >
            Add Line
          </Button>
        )}

        {validationError && (
          <p className="text-sm text-red-600" role="alert" data-testid="split-validation-error">
            {validationError}
          </p>
        )}
      </div>
    </Dialog>
  );
}
