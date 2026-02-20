import { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { showToast } from '../../dashboard/components/ToastContainer';
import { useUnbilledItems } from '../hooks/useUnbilledItems';
import { useCreateProjectInvoice } from '../hooks/useCreateProjectInvoice';

export interface InvoiceFromProjectDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
}

interface DisplayEntry {
  id: string;
  type: 'time' | 'expense';
  description: string;
  date: string;
  amount: number;
  hours?: number;
}

export function InvoiceFromProjectDialog({ open, onClose, projectId }: InvoiceFromProjectDialogProps) {
  const { data: unbilledData, isLoading } = useUnbilledItems(projectId);
  const createInvoiceMutation = useCreateProjectInvoice(projectId);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);

  const entries: DisplayEntry[] = useMemo(() => {
    if (!unbilledData) return [];
    const items: DisplayEntry[] = [
      ...unbilledData.timeEntries.map((t) => ({
        id: t.id,
        type: 'time' as const,
        description: t.description,
        date: t.date,
        amount: t.amount,
        hours: t.hours,
      })),
      ...unbilledData.expenses.map((e) => ({
        id: e.id,
        type: 'expense' as const,
        description: e.description,
        date: e.date,
        amount: e.amount,
      })),
    ];
    return items;
  }, [unbilledData]);

  // Select all by default once data loads
  if (entries.length > 0 && !initialized) {
    setSelected(new Set(entries.map((e) => e.id)));
    setInitialized(true);
  }

  if (!open) return null;

  function toggleEntry(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === entries.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(entries.map((e) => e.id)));
    }
  }

  const total = entries.filter((e) => selected.has(e.id)).reduce((s, e) => s + e.amount, 0);

  function handleCreate() {
    const selectedEntries = entries.filter((e) => selected.has(e.id));
    const timeEntryIds = selectedEntries.filter((e) => e.type === 'time').map((e) => e.id);
    const expenseIds = selectedEntries.filter((e) => e.type === 'expense').map((e) => e.id);

    createInvoiceMutation.mutate(
      { timeEntryIds, expenseIds },
      {
        onSuccess: () => {
          showToast('success', 'Invoice created');
          onClose();
        },
        onError: (err: Error) => showToast('error', err.message || 'Failed to create invoice'),
      },
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-label="Create invoice from project"
    >
      <div className="relative w-full max-w-2xl rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#1a1a2e]">Create Invoice from Project</h2>
          <button
            onClick={onClose}
            className="rounded-sm p-1 text-[#6b7280] hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 max-h-96 overflow-auto">
          {isLoading ? (
            <p className="text-sm text-[#6b7280]" data-testid="unbilled-loading">Loading unbilled items...</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-[#6b7280]" data-testid="no-unbilled">No unbilled items found for this project.</p>
          ) : (
            <>
              <p className="text-sm text-[#6b7280] mb-4">
                Select unbilled time entries and expenses to include in the invoice.
              </p>
              <table className="w-full text-sm" data-testid="unbilled-table">
                <thead>
                  <tr className="border-b border-[#e5e7eb]">
                    <th className="py-2 pr-2 text-left">
                      <input
                        type="checkbox"
                        checked={selected.size === entries.length}
                        onChange={toggleAll}
                        aria-label="Select all"
                      />
                    </th>
                    <th className="py-2 px-2 text-left text-xs font-semibold text-[#6b7280] uppercase">Type</th>
                    <th className="py-2 px-2 text-left text-xs font-semibold text-[#6b7280] uppercase">Description</th>
                    <th className="py-2 px-2 text-left text-xs font-semibold text-[#6b7280] uppercase">Date</th>
                    <th className="py-2 pl-2 text-right text-xs font-semibold text-[#6b7280] uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-b border-[#e5e7eb] last:border-0">
                      <td className="py-2 pr-2">
                        <input
                          type="checkbox"
                          checked={selected.has(entry.id)}
                          onChange={() => toggleEntry(entry.id)}
                          aria-label={`Select ${entry.description}`}
                        />
                      </td>
                      <td className="py-2 px-2 capitalize text-[#6b7280]">{entry.type}</td>
                      <td className="py-2 px-2 text-[#1a1a2e]">{entry.description}</td>
                      <td className="py-2 px-2 text-[#6b7280]">{entry.date}</td>
                      <td className="py-2 pl-2 text-right text-[#1a1a2e]">${entry.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#e5e7eb] px-6 py-4">
          <span className="text-sm font-semibold text-[#1a1a2e]" data-testid="unbilled-total">
            Total: ${total.toFixed(2)}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-md border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-medium text-[#1a1a2e] hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={selected.size === 0 || createInvoiceMutation.isPending}
              className="rounded-md bg-[#0078c8] px-4 py-2 text-sm font-medium text-white hover:bg-[#006bb3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              data-testid="create-invoice-btn"
            >
              {createInvoiceMutation.isPending ? 'Creating...' : `Create Invoice (${selected.size} items)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
