import { useState } from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useStockAdjustment } from '../hooks/useStockAdjustment';
import { showToast } from '../../dashboard/components/ToastContainer';

const REASON_OPTIONS = [
  { value: 'stock_take', label: 'Stock Take' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'returned', label: 'Returned' },
  { value: 'other', label: 'Other' },
];

interface StockAdjustmentDialogProps {
  open: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  currentQuantity: number;
}

export function StockAdjustmentDialog({
  open,
  onClose,
  productId,
  productName,
  currentQuantity,
}: StockAdjustmentDialogProps) {
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('stock_take');
  const [notes, setNotes] = useState('');
  const adjustMutation = useStockAdjustment();

  const handleSubmit = () => {
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty === 0) return;

    adjustMutation.mutate(
      {
        id: productId,
        data: {
          quantity: qty,
          reason: reason as 'stock_take' | 'damaged' | 'returned' | 'other',
          notes: notes || undefined,
        },
      },
      {
        onSuccess: () => {
          showToast('success', 'Stock adjusted');
          setQuantity('');
          setNotes('');
          setReason('stock_take');
          onClose();
        },
        onError: (err: Error) => {
          showToast('error', err.message || 'Failed to adjust stock');
        },
      },
    );
  };

  const handleClose = () => {
    setQuantity('');
    setNotes('');
    setReason('stock_take');
    adjustMutation.reset();
    onClose();
  };

  const parsedQty = parseFloat(quantity);
  const newQuantity = isNaN(parsedQty) ? currentQuantity : currentQuantity + parsedQty;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Adjust Stock"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={adjustMutation.isPending}
            disabled={isNaN(parsedQty) || parsedQty === 0}
            data-testid="adjust-submit-btn"
          >
            Adjust
          </Button>
        </>
      }
    >
      <div className="space-y-4" data-testid="stock-adjustment-dialog">
        <p className="text-sm text-gray-600">
          Adjusting stock for <strong>{productName}</strong>
        </p>

        <div className="rounded bg-gray-50 p-3 text-sm">
          <span className="text-gray-500">Current quantity: </span>
          <span className="font-medium" data-testid="current-qty">{currentQuantity}</span>
        </div>

        <Input
          label="Quantity change"
          type="number"
          inputId="adjust-quantity"
          data-testid="adjust-quantity-input"
          placeholder="e.g. +10 or -5"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />

        <Select
          label="Reason"
          options={REASON_OPTIONS}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          selectId="adjust-reason"
          data-testid="adjust-reason-select"
        />

        <div>
          <label htmlFor="adjust-notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes (optional)
          </label>
          <textarea
            id="adjust-notes"
            data-testid="adjust-notes-input"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {!isNaN(parsedQty) && parsedQty !== 0 && (
          <div className="rounded bg-blue-50 p-3 text-sm" data-testid="new-qty-preview">
            <span className="text-blue-700">New quantity: </span>
            <span className="font-semibold text-blue-900">{newQuantity}</span>
          </div>
        )}

        {adjustMutation.isError && (
          <p className="text-sm text-red-600" data-testid="adjust-error">
            {adjustMutation.error?.message ?? 'Adjustment failed'}
          </p>
        )}
      </div>
    </Dialog>
  );
}
