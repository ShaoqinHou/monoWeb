import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
} from '../../../components/ui/Table';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Pagination } from '../../../components/patterns/Pagination';
import { SortableHeader } from '../../../components/patterns/SortableHeader';
import { usePagination } from '../../../lib/usePagination';
import { BillRow } from './BillRow';
import { Search, SlidersHorizontal, Columns3, MoreHorizontal } from 'lucide-react';
import { formatCurrency } from '@shared/calc/currency';
import { NotImplemented } from '../../../components/patterns/NotImplemented';
import type { Bill, RecurrenceFrequency } from '../types';

type DateType = 'any' | 'bill_date' | 'due_date' | 'paid_date';

interface BillListProps {
  bills: Bill[];
  recurrenceMap?: Map<string, RecurrenceFrequency>;
  onBillClick?: (bill: Bill) => void;
  onBulkApprove?: (ids: string[]) => void;
  onBulkDelete?: (ids: string[]) => void;
  bulkApproveLoading?: boolean;
  bulkDeleteLoading?: boolean;
}

export function BillList({
  bills,
  recurrenceMap,
  onBillClick,
  onBulkApprove,
  onBulkDelete,
  bulkApproveLoading,
  bulkDeleteLoading,
}: BillListProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateType, setDateType] = useState<DateType>('any');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showToolbarMenu, setShowToolbarMenu] = useState(false);
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const hasBulkActions = !!(onBulkApprove || onBulkDelete);

  const visibleBills = useMemo(() => {
    if (!search.trim()) return bills;
    const query = search.toLowerCase();
    return bills.filter(
      (b) =>
        b.billNumber?.toLowerCase().includes(query) ||
        b.contactName.toLowerCase().includes(query) ||
        b.reference?.toLowerCase().includes(query),
    );
  }, [bills, search]);

  const sortedBills = useMemo(() => {
    if (!sortField) return visibleBills;
    return [...visibleBills].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      switch (sortField) {
        case 'supplier':
          aVal = a.contactName.toLowerCase();
          bVal = b.contactName.toLowerCase();
          break;
        case 'reference':
          aVal = (a.reference ?? '').toLowerCase();
          bVal = (b.reference ?? '').toLowerCase();
          break;
        case 'date':
          aVal = new Date(a.date).getTime();
          bVal = new Date(b.date).getTime();
          break;
        case 'dueDate':
          aVal = new Date(a.dueDate).getTime();
          bVal = new Date(b.dueDate).getTime();
          break;
        case 'total':
          aVal = a.total;
          bVal = b.total;
          break;
        case 'amountDue':
          aVal = a.amountDue;
          bVal = b.amountDue;
          break;
        case 'status':
          aVal = a.status.toLowerCase();
          bVal = b.status.toLowerCase();
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [visibleBills, sortField, sortDir]);

  // Pagination
  const { page, pageSize, total, pageData, onChange: onPageChange } = usePagination(sortedBills);

  // Compute total amount for display
  const listTotal = useMemo(() => {
    return visibleBills.reduce((sum, b) => sum + b.total, 0);
  }, [visibleBills]);

  const currency = bills[0]?.currency ?? 'NZD';

  const handleSelect = useCallback((billId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(billId);
      } else {
        next.delete(billId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedIds(new Set(pageData.map((b) => b.id)));
      } else {
        setSelectedIds(new Set());
      }
    },
    [pageData],
  );

  const selectedCount = selectedIds.size;
  const allSelected = pageData.length > 0 && selectedCount === pageData.length;

  const handleBulkApprove = useCallback(() => {
    if (onBulkApprove && selectedCount > 0) {
      onBulkApprove(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  }, [onBulkApprove, selectedIds, selectedCount]);

  const handleBulkDelete = useCallback(() => {
    if (onBulkDelete && selectedCount > 0) {
      onBulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  }, [onBulkDelete, selectedIds, selectedCount]);

  const colSpan = hasBulkActions ? 9 : 8;

  return (
    <div className="space-y-4">
      {/* Toolbar row: search + date filters + Filter + Columns + overflow menu */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Enter a contact, amount, or reference"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startIcon={<Search className="h-4 w-4" />}
            data-testid="bill-search"
          />
        </div>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          data-testid="bill-start-date"
          aria-label="Start date"
          className="w-36"
        />
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          data-testid="bill-end-date"
          aria-label="End date"
          className="w-36"
        />
        <select
          value={dateType}
          onChange={(e) => setDateType(e.target.value as DateType)}
          data-testid="bill-date-type"
          aria-label="Date type"
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="any">Any date</option>
          <option value="bill_date">Bill date</option>
          <option value="due_date">Due date</option>
          <option value="paid_date">Paid date</option>
        </select>
        <Button variant="outline" size="sm" data-testid="bill-filter-btn">
          <SlidersHorizontal className="h-4 w-4 mr-1" />
          Filter
        </Button>
        <Button variant="outline" size="sm" data-testid="bill-columns-btn">
          <Columns3 className="h-4 w-4 mr-1" />
          Columns
        </Button>
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowToolbarMenu(!showToolbarMenu)}
            data-testid="bill-toolbar-overflow"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          {showToolbarMenu && (
            <div
              className="absolute right-0 top-full mt-1 w-40 rounded-md border bg-white shadow-lg z-10"
              data-testid="bill-toolbar-menu"
            >
              <NotImplemented label="Export — not yet implemented">
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                  onClick={() => setShowToolbarMenu(false)}
                >
                  Export
                </button>
              </NotImplemented>
              <NotImplemented label="Import — not yet implemented">
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                  onClick={() => setShowToolbarMenu(false)}
                >
                  Import
                </button>
              </NotImplemented>
            </div>
          )}
        </div>
      </div>

      {/* Items count + total display (Xero format: "44 items | 7,429.21 NZD") */}
      <div className="text-sm text-gray-600" data-testid="bill-list-summary">
        <span data-testid="bill-items-count">
          {visibleBills.length} {visibleBills.length === 1 ? 'item' : 'items'} | {formatCurrency(listTotal, currency)}
        </span>
      </div>

      {/* Bulk actions bar */}
      {hasBulkActions && selectedCount > 0 && (
        <div
          className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2"
          data-testid="bulk-actions-bar"
        >
          <span className="text-sm font-medium text-blue-700" data-testid="selected-count">
            {selectedCount} selected
          </span>
          {onBulkApprove && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleBulkApprove}
              loading={bulkApproveLoading}
              data-testid="bulk-approve-btn"
            >
              Approve
            </Button>
          )}
          {onBulkDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              loading={bulkDeleteLoading}
              data-testid="bulk-delete-btn"
            >
              Delete
            </Button>
          )}
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            {hasBulkActions && (
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  data-testid="select-all-checkbox"
                  aria-label="Select all bills"
                />
              </TableHead>
            )}
            <TableHead>View</TableHead>
            <SortableHeader label="From" field="supplier" currentSort={sortField} currentDirection={sortDir} onSort={(f, d) => { setSortField(f); setSortDir(d); }} />
            <SortableHeader label="Status" field="status" currentSort={sortField} currentDirection={sortDir} onSort={(f, d) => { setSortField(f); setSortDir(d); }} />
            <SortableHeader label="Reference" field="reference" currentSort={sortField} currentDirection={sortDir} onSort={(f, d) => { setSortField(f); setSortDir(d); }} />
            <SortableHeader label="Date" field="date" currentSort={sortField} currentDirection={sortDir} onSort={(f, d) => { setSortField(f); setSortDir(d); }} />
            <SortableHeader label="Due date" field="dueDate" currentSort={sortField} currentDirection={sortDir} onSort={(f, d) => { setSortField(f); setSortDir(d); }} />
            <SortableHeader label="Paid" field="total" currentSort={sortField} currentDirection={sortDir} onSort={(f, d) => { setSortField(f); setSortDir(d); }} className="text-right" />
            <SortableHeader label="Due" field="amountDue" currentSort={sortField} currentDirection={sortDir} onSort={(f, d) => { setSortField(f); setSortDir(d); }} className="text-right" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageData.length === 0 ? (
            <TableRow>
              <td colSpan={colSpan}>
                <div className="py-12 text-center" data-testid="bills-empty">
                  <h3 className="text-lg font-medium text-gray-900">No bills yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Track money you owe to suppliers</p>
                  <div className="mt-4">
                    <Button variant="primary" size="sm" onClick={() => navigate({ to: '/purchases/bills/new' })}>
                      New Bill
                    </Button>
                  </div>
                </div>
              </td>
            </TableRow>
          ) : (
            pageData.map((bill) => (
              <BillRow
                key={bill.id}
                bill={bill}
                recurrence={recurrenceMap?.get(bill.id)}
                selected={selectedIds.has(bill.id)}
                onSelect={hasBulkActions ? handleSelect : undefined}
                onClick={onBillClick}
              />
            ))
          )}
        </TableBody>
      </Table>
      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onChange={onPageChange}
        data-testid="bill-list-pagination"
      />
    </div>
  );
}
