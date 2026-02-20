import { useState, useMemo } from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import type { FixedAsset } from '../hooks/useFixedAssets';
import type { DisposalMethod } from '../hooks/useAssetDisposal';

interface AssetDisposalDialogProps {
  open: boolean;
  onClose: () => void;
  asset: FixedAsset;
  onConfirm: (data: { date: string; price: number; method: DisposalMethod }) => void;
  isSubmitting?: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
  }).format(amount);
}

const DISPOSAL_METHOD_OPTIONS = [
  { value: 'sold', label: 'Sold' },
  { value: 'scrapped', label: 'Scrapped' },
  { value: 'lost', label: 'Lost' },
];

export function AssetDisposalDialog({
  open,
  onClose,
  asset,
  onConfirm,
  isSubmitting,
}: AssetDisposalDialogProps) {
  const [date, setDate] = useState('');
  const [price, setPrice] = useState('');
  const [method, setMethod] = useState<DisposalMethod>('sold');

  const gainLoss = useMemo(() => {
    const disposalPrice = parseFloat(price) || 0;
    const bookValue = asset.purchasePrice - asset.accumulatedDepreciation;
    return disposalPrice - bookValue;
  }, [price, asset.purchasePrice, asset.accumulatedDepreciation]);

  const handleSubmit = () => {
    onConfirm({
      date,
      price: parseFloat(price) || 0,
      method,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Dispose Asset: ${asset.name}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} data-testid="cancel-disposal-btn">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={!date}
            data-testid="confirm-disposal-btn"
          >
            Confirm Disposal
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Disposal Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          data-testid="disposal-date-input"
        />

        <Input
          label="Disposal Price"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0.00"
          data-testid="disposal-price-input"
        />

        <Select
          label="Disposal Method"
          options={DISPOSAL_METHOD_OPTIONS}
          value={method}
          onChange={(e) => setMethod(e.target.value as DisposalMethod)}
          data-testid="disposal-method-select"
        />

        {/* Gain/Loss Preview */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4" data-testid="gain-loss-preview">
          <p className="text-xs font-semibold uppercase text-[#6b7280]">Gain / Loss on Disposal</p>
          <p className="text-sm text-[#6b7280] mt-1" data-testid="book-value-display">
            Book Value: {formatCurrency(asset.purchasePrice - asset.accumulatedDepreciation)}
          </p>
          <p
            className={`mt-2 text-lg font-bold ${gainLoss >= 0 ? 'text-[#14b8a6]' : 'text-[#ef4444]'}`}
            data-testid="gain-loss-amount"
          >
            {gainLoss >= 0 ? 'Gain' : 'Loss'}: {formatCurrency(Math.abs(gainLoss))}
          </p>
        </div>
      </div>
    </Dialog>
  );
}
