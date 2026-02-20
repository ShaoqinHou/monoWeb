import { useState } from 'react';
import { Badge } from '../../../../components/ui/Badge';
import {
  useReconciliationSummary,
  getReconciliationStatus,
} from '../hooks/useReconciliationSummary';
import type { DateRange, ReconciliationStatus } from '../hooks/useReconciliationSummary';

type DatePreset = 'this-month' | 'last-month' | 'custom';

function getPresetDateRange(preset: DatePreset): DateRange | undefined {
  const now = new Date();
  if (preset === 'this-month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      start: start.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0],
    };
  }
  if (preset === 'last-month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  }
  return undefined;
}

function getStatusBadgeVariant(status: ReconciliationStatus) {
  switch (status) {
    case 'reconciled':
      return 'success' as const;
    case 'partial':
      return 'warning' as const;
    case 'discrepancy':
      return 'error' as const;
  }
}

function getStatusLabel(status: ReconciliationStatus) {
  switch (status) {
    case 'reconciled':
      return 'Fully Reconciled';
    case 'partial':
      return 'Partially Reconciled';
    case 'discrepancy':
      return 'Large Discrepancy';
  }
}

export function ReconciliationSummary() {
  const [preset, setPreset] = useState<DatePreset>('this-month');
  const dateRange = getPresetDateRange(preset);
  const { data: summaries, isLoading } = useReconciliationSummary(dateRange);

  return (
    <div data-testid="reconciliation-summary" className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Reconciliation Summary</h3>
        <div className="flex gap-2">
          {(['this-month', 'last-month', 'custom'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={`px-3 py-1 text-sm rounded ${
                preset === p
                  ? 'bg-[#0078c8] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              data-testid={`date-filter-${p}`}
            >
              {p === 'this-month' ? 'This Month' : p === 'last-month' ? 'Last Month' : 'Custom'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div data-testid="summary-loading">Loading...</div>
      ) : !summaries || summaries.length === 0 ? (
        <div data-testid="summary-empty" className="text-gray-500 text-sm">
          No bank accounts found
        </div>
      ) : (
        <div className="space-y-3">
          {summaries.map((summary) => {
            const status = getReconciliationStatus(summary);
            return (
              <div
                key={summary.accountId}
                className="flex items-center justify-between p-4 rounded-lg border bg-white"
                data-testid={`account-summary-${summary.accountId}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{summary.accountName}</span>
                    <Badge variant={getStatusBadgeVariant(status)}>
                      {getStatusLabel(status)}
                    </Badge>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>Statement: ${summary.statementBalance.toFixed(2)}</span>
                    <span>Xero: ${summary.xeroBalance.toFixed(2)}</span>
                    <span className={Math.abs(summary.difference) > 0.01 ? 'text-red-600 font-medium' : ''}>
                      Difference: ${summary.difference.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="text-green-600" data-testid={`reconciled-count-${summary.accountId}`}>
                    {summary.reconciledCount} reconciled
                  </div>
                  <div className="text-orange-500" data-testid={`unreconciled-count-${summary.accountId}`}>
                    {summary.unreconciledCount} unreconciled
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
