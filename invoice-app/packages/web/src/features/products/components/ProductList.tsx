import { useState, useRef, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '../../../components/ui/Button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { SortableHeader, type SortDirection } from '../../../components/patterns/SortableHeader';
import { MoreHorizontal } from 'lucide-react';
import type { Product } from '@xero-replica/shared';

type SortField = 'code' | 'name' | 'purchasePrice' | 'salePrice' | 'quantityOnHand';

interface ProductListProps {
  products: Product[];
  onSelect: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  visibleColumns?: Set<string>;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
  }).format(amount);
}

const ALL_COLUMNS = ['code', 'name', 'costPrice', 'salePrice', 'quantity'] as const;
const DEFAULT_COLUMNS = new Set<string>(ALL_COLUMNS);

/* ---- Per-row actions dropdown ---- */
function ActionsDropdown({
  productId,
  onEdit,
  onDelete,
  onDuplicate,
}: {
  productId: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref} data-testid={`product-actions-${productId}`}>
      <button
        className="rounded p-1 hover:bg-gray-100 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        data-testid={`product-actions-trigger-${productId}`}
        aria-label="Actions"
      >
        <MoreHorizontal className="h-4 w-4 text-gray-500" />
      </button>
      {open && (
        <div
          className="absolute right-0 z-10 mt-1 w-40 rounded-md border bg-white py-1 shadow-lg"
          data-testid={`product-actions-menu-${productId}`}
        >
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(productId);
              setOpen(false);
            }}
            data-testid={`product-action-edit-${productId}`}
          >
            Edit
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate?.(productId);
              setOpen(false);
            }}
            data-testid={`product-action-duplicate-${productId}`}
          >
            Duplicate
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(productId);
              setOpen(false);
            }}
            data-testid={`product-action-delete-${productId}`}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export function ProductList({ products, onSelect, onEdit, onDelete, onDuplicate, selectedIds, onSelectionChange, visibleColumns }: ProductListProps) {
  const navigate = useNavigate();
  const showCheckboxes = !!onSelectionChange;
  const cols = visibleColumns ?? DEFAULT_COLUMNS;
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

  const handleSort = (field: string, direction: SortDirection) => {
    setSortField(field as SortField);
    setSortDir(direction);
  };

  const sorted = sortField
    ? [...products].sort((a, b) => {
        let cmp = 0;
        if (sortField === 'code') cmp = a.code.localeCompare(b.code);
        else if (sortField === 'name') cmp = a.name.localeCompare(b.name);
        else if (sortField === 'purchasePrice') cmp = a.purchasePrice - b.purchasePrice;
        else if (sortField === 'salePrice') cmp = a.salePrice - b.salePrice;
        else if (sortField === 'quantityOnHand') cmp = a.quantityOnHand - b.quantityOnHand;
        return sortDir === 'asc' ? cmp : -cmp;
      })
    : products;

  if (products.length === 0) {
    return (
      <div className="py-12 text-center" data-testid="product-list-empty">
        <h3 className="text-lg font-medium text-gray-900">No products or services yet</h3>
        <p className="mt-1 text-sm text-gray-500">Add items you buy and sell to speed up invoicing</p>
        <div className="mt-4">
          <Button variant="primary" size="sm" onClick={() => navigate({ to: '/sales/products/new' as string })}>
            New Item
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Table data-testid="product-list-table" aria-label="List of items with cost price, sale price and quantity">
      <TableHeader>
        <TableRow>
          {showCheckboxes && (
            <TableHead className="w-10">
              <input
                type="checkbox"
                checked={products.length > 0 && (selectedIds?.size ?? 0) === products.length}
                onChange={(e) => {
                  if (e.target.checked) {
                    onSelectionChange?.(new Set(products.map((p) => p.id)));
                  } else {
                    onSelectionChange?.(new Set());
                  }
                }}
                data-testid="product-select-all"
                className="h-4 w-4 rounded border-gray-300"
              />
            </TableHead>
          )}
          {cols.has('code') && (
            <SortableHeader label="Code" field="code" currentSort={sortField ?? ''} currentDirection={sortDir} onSort={handleSort} data-testid="sort-code" />
          )}
          {cols.has('name') && (
            <SortableHeader label="Name" field="name" currentSort={sortField ?? ''} currentDirection={sortDir} onSort={handleSort} data-testid="sort-name" />
          )}
          {cols.has('costPrice') && (
            <SortableHeader label="Cost price" field="purchasePrice" currentSort={sortField ?? ''} currentDirection={sortDir} onSort={handleSort} className="text-right" data-testid="sort-purchasePrice" />
          )}
          {cols.has('salePrice') && (
            <SortableHeader label="Sale price" field="salePrice" currentSort={sortField ?? ''} currentDirection={sortDir} onSort={handleSort} className="text-right" data-testid="sort-salePrice" />
          )}
          {cols.has('quantity') && (
            <SortableHeader label="Quantity" field="quantityOnHand" currentSort={sortField ?? ''} currentDirection={sortDir} onSort={handleSort} className="text-right" data-testid="sort-quantityOnHand" />
          )}
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((product) => (
          <TableRow
            key={product.id}
            className="cursor-pointer"
            onClick={() => onSelect(product.id)}
            data-testid={`product-row-${product.id}`}
          >
            {showCheckboxes && (
              <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedIds?.has(product.id) ?? false}
                  onChange={(e) => {
                    const next = new Set(selectedIds);
                    if (e.target.checked) {
                      next.add(product.id);
                    } else {
                      next.delete(product.id);
                    }
                    onSelectionChange?.(next);
                  }}
                  data-testid={`product-checkbox-${product.id}`}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </TableCell>
            )}
            {cols.has('code') && (
              <TableCell className="font-medium">{product.code}</TableCell>
            )}
            {cols.has('name') && (
              <TableCell>{product.name}</TableCell>
            )}
            {cols.has('costPrice') && (
              <TableCell className="text-right">
                {product.isPurchased ? formatCurrency(product.purchasePrice) : '-'}
              </TableCell>
            )}
            {cols.has('salePrice') && (
              <TableCell className="text-right">
                {product.isSold ? formatCurrency(product.salePrice) : '-'}
              </TableCell>
            )}
            {cols.has('quantity') && (
              <TableCell className="text-right">
                {product.isTracked ? product.quantityOnHand : '-'}
              </TableCell>
            )}
            <TableCell>
              <ActionsDropdown
                productId={product.id}
                onEdit={onEdit}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
