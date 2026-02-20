import { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Pagination } from '../../../components/patterns/Pagination';
import { SortableHeader } from '../../../components/patterns/SortableHeader';
import { usePagination } from '../../../lib/usePagination';
import { PurchaseOrderStatusBadge } from './PurchaseOrderStatusBadge';
import { Search, SlidersHorizontal, Columns3, Check, Paperclip } from 'lucide-react';
import type { PurchaseOrder } from '../hooks/usePurchaseOrders';

interface PurchaseOrderListProps {
  purchaseOrders: PurchaseOrder[];
  onPurchaseOrderClick: (id: string) => void;
  isLoading?: boolean;
}

export function PurchaseOrderList({ purchaseOrders, onPurchaseOrderClick, isLoading }: PurchaseOrderListProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const filtered = useMemo(() => {
    let result = purchaseOrders;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (po) =>
          po.poNumber.toLowerCase().includes(q) ||
          po.contactName.toLowerCase().includes(q) ||
          po.reference?.toLowerCase().includes(q),
      );
    }
    if (startDate) {
      result = result.filter((po) => po.date >= startDate);
    }
    if (endDate) {
      result = result.filter((po) => po.date <= endDate);
    }
    return result;
  }, [purchaseOrders, search, startDate, endDate]);

  const sorted = useMemo(() => {
    if (!sortField) return filtered;
    return [...filtered].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      switch (sortField) {
        case 'number':
          aVal = a.poNumber.toLowerCase();
          bVal = b.poNumber.toLowerCase();
          break;
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
        case 'deliveryDate':
          aVal = a.deliveryDate ? new Date(a.deliveryDate).getTime() : 0;
          bVal = b.deliveryDate ? new Date(b.deliveryDate).getTime() : 0;
          break;
        case 'total':
          aVal = a.total;
          bVal = b.total;
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
  }, [filtered, sortField, sortDir]);

  const { page, pageSize, total, pageData, onChange: onPageChange } = usePagination(sorted);

  if (isLoading) {
    return (
      <div className="py-12 text-center text-gray-500" data-testid="po-list-loading">
        Loading purchase orders...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search toolbar */}
      <div className="flex items-center gap-2" data-testid="po-search-toolbar">
        <div className="flex-1">
          <Input
            placeholder="Search purchase orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startIcon={<Search className="h-4 w-4" />}
            data-testid="po-search"
          />
        </div>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          data-testid="po-start-date"
          className="w-36"
          aria-label="Start date"
        />
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          data-testid="po-end-date"
          className="w-36"
          aria-label="End date"
        />
        <Button variant="outline" size="sm" data-testid="po-filter-btn">
          <SlidersHorizontal className="h-4 w-4 mr-1" />
          Filter
        </Button>
        <Button variant="outline" size="sm" data-testid="po-columns-btn">
          <Columns3 className="h-4 w-4 mr-1" />
          Columns
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center" data-testid="po-list-empty">
          <h3 className="text-lg font-medium text-gray-900">No purchase orders yet</h3>
          <p className="mt-1 text-sm text-gray-500">Create purchase orders to manage orders with your suppliers</p>
          <div className="mt-4">
            <Button variant="primary" size="sm" onClick={() => navigate({ to: '/purchases/purchase-orders/new' })}>
              New Purchase Order
            </Button>
          </div>
        </div>
      ) : (
        <>
          <Table data-testid="po-list-table">
            <TableHeader>
              <TableRow>
                <SortableHeader label="Number" field="number" currentSort={sortField} currentDirection={sortDir} onSort={(f, d) => { setSortField(f); setSortDir(d); }} />
                <SortableHeader label="Supplier" field="supplier" currentSort={sortField} currentDirection={sortDir} onSort={(f, d) => { setSortField(f); setSortDir(d); }} />
                <SortableHeader label="Reference" field="reference" currentSort={sortField} currentDirection={sortDir} onSort={(f, d) => { setSortField(f); setSortDir(d); }} />
                <SortableHeader label="Date raised" field="date" currentSort={sortField} currentDirection={sortDir} onSort={(f, d) => { setSortField(f); setSortDir(d); }} />
                <SortableHeader label="Delivery date" field="deliveryDate" currentSort={sortField} currentDirection={sortDir} onSort={(f, d) => { setSortField(f); setSortDir(d); }} />
                <SortableHeader label="Status" field="status" currentSort={sortField} currentDirection={sortDir} onSort={(f, d) => { setSortField(f); setSortDir(d); }} />
                <TableHead className="text-center">Sent</TableHead>
                <SortableHeader label="Amount" field="total" currentSort={sortField} currentDirection={sortDir} onSort={(f, d) => { setSortField(f); setSortDir(d); }} className="text-right" />
                <TableHead className="text-center">Files</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageData.map((po) => (
                <TableRow
                  key={po.id}
                  className="cursor-pointer"
                  onClick={() => onPurchaseOrderClick(po.id)}
                  data-testid={`po-row-${po.id}`}
                >
                  <TableCell className="font-medium">{po.poNumber}</TableCell>
                  <TableCell>{po.contactName}</TableCell>
                  <TableCell>{po.reference ?? '-'}</TableCell>
                  <TableCell>{po.date}</TableCell>
                  <TableCell>{po.deliveryDate ?? '-'}</TableCell>
                  <TableCell>
                    <PurchaseOrderStatusBadge status={po.status} />
                  </TableCell>
                  <TableCell className="text-center">
                    {po.status !== 'draft' ? (
                      <Check className="h-4 w-4 text-green-600 mx-auto" data-testid={`po-sent-${po.id}`} />
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {po.currency} {po.total.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Paperclip className="h-4 w-4 text-gray-400 mx-auto" data-testid={`po-files-${po.id}`} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onChange={onPageChange}
            data-testid="po-list-pagination"
          />
        </>
      )}
    </div>
  );
}
