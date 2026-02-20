import { useState, useMemo } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Dialog } from '../../../components/ui/Dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { previewDepreciation } from '../hooks/useDepreciation';
import type { DepreciationEntry } from '../hooks/useDepreciation';
import type { FixedAsset } from '../hooks/useFixedAssets';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
  }).format(amount);
}

interface DepreciationRunnerProps {
  assets: FixedAsset[];
  onRun: (period: string, entries: DepreciationEntry[]) => void;
  isRunning?: boolean;
}

export function DepreciationRunner({ assets, onRun, isRunning }: DepreciationRunnerProps) {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const preview = useMemo(() => {
    if (!open) return null;
    return previewDepreciation(assets, period);
  }, [assets, period, open]);

  const handleRun = () => {
    if (preview && preview.entries.length > 0) {
      onRun(period, preview.entries);
      setOpen(false);
    }
  };

  return (
    <>
      <Button
        variant="primary"
        onClick={() => setOpen(true)}
        data-testid="run-depreciation-btn"
      >
        Run Depreciation
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Run Depreciation"
        className="max-w-2xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRun}
              loading={isRunning}
              disabled={!preview || preview.entries.length === 0}
              data-testid="confirm-depreciation-btn"
            >
              Post Journal Entries
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Period"
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            data-testid="depreciation-period"
          />

          {preview && preview.entries.length === 0 && (
            <p className="text-sm text-gray-500" data-testid="no-depreciation">
              No assets eligible for depreciation.
            </p>
          )}

          {preview && preview.entries.length > 0 && (
            <>
              <Table data-testid="depreciation-preview-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Debit</TableHead>
                    <TableHead>Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.entries.map((entry) => (
                    <TableRow key={entry.assetId}>
                      <TableCell className="font-medium">{entry.assetName}</TableCell>
                      <TableCell className="text-right">{formatCurrency(entry.amount)}</TableCell>
                      <TableCell className="text-gray-500">{entry.debitAccount}</TableCell>
                      <TableCell className="text-gray-500">{entry.creditAccount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="text-right font-semibold text-gray-900" data-testid="total-depreciation">
                Total: {formatCurrency(preview.totalDepreciation)}
              </div>
            </>
          )}
        </div>
      </Dialog>
    </>
  );
}
