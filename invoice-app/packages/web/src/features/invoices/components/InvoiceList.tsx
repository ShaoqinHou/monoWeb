import { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
} from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button'; // kept for empty state CTA
import { SortableHeader } from '../../../components/patterns/SortableHeader';
import { InvoiceRow } from './InvoiceRow';
import type { Invoice, RecurringSchedule } from '../types';

interface InvoiceListProps {
  invoices: Invoice[];
  onInvoiceClick: (id: string) => void;
  recurringMap?: Map<string, RecurringSchedule>;
  creditNoteIds?: Set<string>;
  onBulkAction?: (action: BulkActionType, ids: string[]) => void;
}

export type BulkActionType = 'approve' | 'send' | 'delete';

export function InvoiceList({
  invoices,
  onInvoiceClick,
  recurringMap,
  creditNoteIds,
  onBulkAction,
}: InvoiceListProps) {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(sortedInvoices.map((inv) => inv.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleBulkAction = (action: BulkActionType) => {
    if (selectedIds.size === 0 || !onBulkAction) return;
    onBulkAction(action, Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleSort = (field: string, direction: 'asc' | 'desc') => {
    setSortField(field);
    setSortDir(direction);
  };

  const sortedInvoices = useMemo(() => {
    if (!sortField) return invoices;
    return [...invoices].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      switch (sortField) {
        case 'number':
          aVal = a.invoiceNumber ?? '';
          bVal = b.invoiceNumber ?? '';
          break;
        case 'contact':
          aVal = a.contactName ?? '';
          bVal = b.contactName ?? '';
          break;
        case 'date':
          aVal = a.date ?? '';
          bVal = b.date ?? '';
          break;
        case 'dueDate':
          aVal = a.dueDate ?? '';
          bVal = b.dueDate ?? '';
          break;
        case 'total':
          aVal = a.total ?? 0;
          bVal = b.total ?? 0;
          break;
        case 'amountDue':
          aVal = a.amountDue ?? 0;
          bVal = b.amountDue ?? 0;
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [invoices, sortField, sortDir]);

  if (invoices.length === 0) {
    return (
      <div className="py-12 text-center" data-testid="invoice-list-empty">
        <h3 className="text-lg font-medium text-gray-900">No invoices yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Create your first invoice to start billing customers
        </p>
        <div className="mt-4">
          <Button variant="primary" size="sm" onClick={() => navigate({ to: '/sales/invoices/new' })}>
            New Invoice
          </Button>
        </div>
      </div>
    );
  }

  const allSelected = sortedInvoices.length > 0 && selectedIds.size === sortedInvoices.length;

  return (
    <div>
      {selectedIds.size > 0 && (
        <div className="mb-2 flex items-center gap-2 rounded-md bg-blue-50 px-3 py-2" data-testid="bulk-actions-bar">
          <span className="text-sm font-medium text-blue-800">
            {selectedIds.size} selected
          </span>
          <Button variant="outline" size="sm" onClick={() => handleBulkAction('approve')} data-testid="bulk-approve">
            Approve
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleBulkAction('delete')} data-testid="bulk-delete">
            Delete
          </Button>
        </div>
      )}
      <Table data-testid="invoice-list-table">
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
                data-testid="select-all-checkbox"
              />
            </TableHead>
            <SortableHeader label="Number" field="number" currentSort={sortField} currentDirection={sortDir} onSort={handleSort} />
            <TableHead>Ref</TableHead>
            <SortableHeader label="To" field="contact" currentSort={sortField} currentDirection={sortDir} onSort={handleSort} />
            <SortableHeader label="Date" field="date" currentSort={sortField} currentDirection={sortDir} onSort={handleSort} />
            <SortableHeader label="Due Date" field="dueDate" currentSort={sortField} currentDirection={sortDir} onSort={handleSort} />
            <TableHead className="text-right">Paid</TableHead>
            <SortableHeader label="Due" field="amountDue" currentSort={sortField} currentDirection={sortDir} onSort={handleSort} className="text-right" />
            <TableHead>Status</TableHead>
            <TableHead>Sent</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedInvoices.map((invoice) => (
            <InvoiceRow
              key={invoice.id}
              invoice={invoice}
              onClick={onInvoiceClick}
              recurring={recurringMap?.get(invoice.id)}
              isCreditNote={creditNoteIds?.has(invoice.id)}
              selected={selectedIds.has(invoice.id)}
              onSelect={handleSelect}
            />
          ))}
        </TableBody>
      </Table>
      <div className="mt-2 text-sm text-gray-500" data-testid="invoice-item-count">
        {invoices.length} {invoices.length === 1 ? 'item' : 'items'}
      </div>
    </div>
  );
}
