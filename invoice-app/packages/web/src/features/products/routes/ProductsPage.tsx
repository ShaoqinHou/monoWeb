import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { showToast } from '../../dashboard/components/ToastContainer';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Pagination } from '../../../components/patterns/Pagination';
import { usePagination } from '../../../lib/usePagination';
import { ProductList } from '../components/ProductList';
import { ProductForm } from '../components/ProductForm';
import { StockAdjustmentDialog } from '../components/StockAdjustmentDialog';
import { StockMovementLog } from '../components/StockMovementLog';
import {
  useProducts,
  useProduct,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from '../hooks/useProducts';
import { useAccounts } from '../../accounting/hooks/useAccounts';
import { useTaxRates } from '../../accounting/hooks/useTaxRates';
import { Plus, Search, Upload, Download, MoreHorizontal, SlidersHorizontal, Columns3, X, Filter } from 'lucide-react';
import type { CreateProduct } from '@xero-replica/shared';
import { NotImplemented } from '../../../components/patterns/NotImplemented';

const ALL_COLUMNS = ['code', 'name', 'costPrice', 'salePrice', 'quantity'] as const;
const COLUMN_LABELS: Record<string, string> = {
  code: 'Code',
  name: 'Name',
  costPrice: 'Cost price',
  salePrice: 'Sale price',
  quantity: 'Quantity',
};

/* ════════════════════════════════════════════
   ProductsPage — List of all products
   ════════════════════════════════════════════ */
export function ProductsPage() {
  const { data: products = [], isLoading } = useProducts();
  const [search, setSearch] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [moreActionsOpen, setMoreActionsOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(ALL_COLUMNS));
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    let result = products;

    // Only show active products when the Active filter tag is on
    if (showActiveOnly) {
      result = result.filter((p) => p.isActive);
    }

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.code.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q),
      );
    }

    return result;
  }, [products, search, showActiveOnly]);

  const handleSelect = (id: string) => {
    navigate({ to: '/sales/products/$productId', params: { productId: id } });
  };

  const handleNew = () => {
    navigate({ to: '/sales/products/new' as string });
  };

  const handleImport = () => {
    // Stub: will open import dialog in future
  };

  const handleExport = () => {
    // Stub: will trigger CSV export in future
  };

  const handleEdit = (id: string) => {
    navigate({ to: '/sales/products/$productId', params: { productId: id } });
  };

  const handleDelete = (id: string) => {
    navigate({ to: '/sales/products/$productId', params: { productId: id } });
  };

  const handleBulkAction = useCallback((action: string) => {
    // Stub actions: adjustment, archive, delete
    if (action === 'delete') {
      for (const id of selectedIds) {
        navigate({ to: '/sales/products/$productId', params: { productId: id } });
      }
    }
    setSelectedIds(new Set());
  }, [selectedIds, navigate]);

  const toggleColumn = (col: string) => {
    const next = new Set(visibleColumns);
    if (next.has(col)) {
      next.delete(col);
    } else {
      next.add(col);
    }
    setVisibleColumns(next);
  };

  const { page, pageSize, total, pageData, onChange: onPaginationChange } = usePagination(filtered);

  return (
    <PageContainer
      title="Products and services"
      actions={
        <div className="flex items-center gap-2">
          <NotImplemented label="Import — not yet implemented">
            <Button variant="outline" onClick={handleImport} data-testid="import-products-button">
              <Upload className="h-4 w-4 mr-1" />
              Import
            </Button>
          </NotImplemented>
          <NotImplemented label="Export — not yet implemented">
            <Button variant="outline" onClick={handleExport} data-testid="export-products-button">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </NotImplemented>
          <Button onClick={handleNew} data-testid="new-product-button">
            <Plus className="h-4 w-4 mr-1" />
            New item
          </Button>
          <NotImplemented label="Settings — not yet implemented">
            <Button variant="outline" data-testid="other-options-button" aria-label="Settings">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </NotImplemented>
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setMoreActionsOpen((v) => !v)}
              data-testid="more-actions-button"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            {moreActionsOpen && (
              <div
                className="absolute right-0 z-10 mt-1 w-40 rounded-md border bg-white py-1 shadow-lg"
                data-testid="more-actions-menu"
              >
                <NotImplemented label="Copy to all — not yet implemented">
                  <button
                    className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                    onClick={() => setMoreActionsOpen(false)}
                  >
                    Copy to all
                  </button>
                </NotImplemented>
              </div>
            )}
          </div>
        </div>
      }
    >
      {isLoading ? (
        <div className="py-12 text-center text-gray-500" data-testid="products-loading">
          Loading products...
        </div>
      ) : (
        <div className="space-y-4">
          {/* Search + Filter + Columns + Active tag */}
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              startIcon={<Search className="h-4 w-4" />}
              data-testid="search-products"
              className="max-w-sm"
            />
            <NotImplemented label="Filter — not yet implemented">
              <Button variant="outline" size="sm" data-testid="filter-products-button">
                <Filter className="h-4 w-4 mr-1" />
                Filter
              </Button>
            </NotImplemented>
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setColumnsOpen((v) => !v)}
                data-testid="columns-button"
              >
                <Columns3 className="h-4 w-4 mr-1" />
                Columns
              </Button>
              {columnsOpen && (
                <div
                  className="absolute left-0 z-10 mt-1 w-48 rounded-md border bg-white py-1 shadow-lg"
                  data-testid="columns-picker"
                >
                  {ALL_COLUMNS.map((col) => (
                    <label key={col} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visibleColumns.has(col)}
                        onChange={() => toggleColumn(col)}
                        className="h-4 w-4 rounded border-gray-300"
                        data-testid={`column-toggle-${col}`}
                      />
                      {COLUMN_LABELS[col]}
                    </label>
                  ))}
                </div>
              )}
            </div>
            {showActiveOnly ? (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 hover:bg-blue-200 transition-colors"
                data-testid="active-filter-tag"
                onClick={() => setShowActiveOnly(false)}
                title="Click to show all products"
              >
                Active
                <X className="h-3 w-3" />
              </button>
            ) : (
              <button
                type="button"
                className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors"
                data-testid="active-filter-tag"
                onClick={() => setShowActiveOnly(true)}
                title="Click to show active products only"
              >
                All
              </button>
            )}
          </div>

          {/* Bulk actions bar — always visible like Xero */}
          <div className="flex items-center gap-3 px-1 py-2" data-testid="product-bulk-actions-bar">
            <span className="text-sm text-gray-500" data-testid="product-selected-count">
              {selectedIds.size > 0 ? `${selectedIds.size} item${selectedIds.size > 1 ? 's' : ''} selected` : 'No items selected'}
            </span>
            <NotImplemented label="Adjustment — not yet implemented">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('adjustment')}
                disabled={selectedIds.size === 0}
                data-testid="product-bulk-adjustment"
              >
                Adjustment
              </Button>
            </NotImplemented>
            <NotImplemented label="Archive — not yet implemented">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('archive')}
                disabled={selectedIds.size === 0}
                data-testid="product-bulk-archive"
              >
                Archive
              </Button>
            </NotImplemented>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('delete')}
              disabled={selectedIds.size === 0}
              data-testid="product-bulk-delete"
            >
              Delete
            </Button>
          </div>

          <ProductList
            products={pageData}
            onSelect={handleSelect}
            onEdit={handleEdit}
            onDelete={handleDelete}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            visibleColumns={visibleColumns}
          />
          {total > 0 && (
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              onChange={onPaginationChange}
              className="mt-4"
            />
          )}
        </div>
      )}
    </PageContainer>
  );
}

/* ════════════════════════════════════════════
   ProductCreatePage — New product
   ════════════════════════════════════════════ */
export function ProductCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateProduct();
  const { data: accountsRaw = [] } = useAccounts();
  const { data: taxRatesRaw = [] } = useTaxRates();
  const accountOptions = accountsRaw.map((a) => ({ value: a.code, label: a.code, description: a.name }));
  const taxRateOptions = taxRatesRaw.map((tr) => ({ value: String(tr.rate), label: tr.name }));

  const handleSubmit = (data: CreateProduct) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        showToast('success', 'Product created');
        navigate({ to: '/sales/products' });
      },
      onError: (error: Error) => {
        showToast('error', error.message || 'Failed to create product');
      },
    });
  };

  return (
    <PageContainer
      title="New Product"
      breadcrumbs={[
        { label: 'Products and services', href: '/sales/products' },
        { label: 'New Product' },
      ]}
    >
      <ProductForm
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending}
        accountOptions={accountOptions}
        taxRateOptions={taxRateOptions}
        onCreateNewAccount={() => navigate({ to: '/accounting/chart-of-accounts' as string })}
      />
    </PageContainer>
  );
}

/* ════════════════════════════════════════════
   ProductDetailPage — View a single product
   ════════════════════════════════════════════ */
export function ProductDetailPage() {
  const { productId } = useParams({ from: '/sales/products/$productId' });
  const { data: product, isLoading } = useProduct(productId);
  const deleteMutation = useDeleteProduct();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const updateMutation = useUpdateProduct();
  const { data: accountsRaw = [] } = useAccounts();
  const { data: taxRatesRaw = [] } = useTaxRates();
  const accountOptions = accountsRaw.map((a) => ({ value: a.code, label: a.code, description: a.name }));
  const taxRateOptions = taxRatesRaw.map((tr) => ({ value: String(tr.rate), label: tr.name }));

  const handleDelete = () => {
    deleteMutation.mutate(productId, {
      onSuccess: () => {
        showToast('success', 'Product deleted');
        navigate({ to: '/sales/products' });
      },
      onError: (err: Error) => {
        showToast('error', err.message || 'Failed to delete product');
      },
    });
  };

  const handleUpdate = (data: CreateProduct) => {
    updateMutation.mutate(
      { id: productId, data },
      {
        onSuccess: () => {
          showToast('success', 'Product saved');
          setEditing(false);
        },
        onError: (error: Error) => {
          showToast('error', error.message || 'Failed to save product');
        },
      },
    );
  };

  if (isLoading) {
    return (
      <PageContainer
        title="Product"
        breadcrumbs={[{ label: 'Products and services', href: '/sales/products' }]}
      >
        <div className="py-12 text-center text-gray-500" data-testid="product-detail-loading">
          Loading product...
        </div>
      </PageContainer>
    );
  }

  if (!product) {
    return (
      <PageContainer
        title="Product"
        breadcrumbs={[{ label: 'Products and services', href: '/sales/products' }]}
      >
        <div className="py-12 text-center text-gray-500" data-testid="product-not-found">
          Product not found
        </div>
      </PageContainer>
    );
  }

  if (editing) {
    return (
      <PageContainer
        title={`Edit ${product.name}`}
        breadcrumbs={[
          { label: 'Products and services', href: '/sales/products' },
          { label: product.name },
          { label: 'Edit' },
        ]}
      >
        <ProductForm
          initialData={{
            ...product,
            description: product.description ?? undefined,
            accountCode: product.accountCode ?? undefined,
          }}
          onSubmit={handleUpdate}
          isLoading={updateMutation.isPending}
          accountOptions={accountOptions}
          taxRateOptions={taxRateOptions}
          onCreateNewAccount={() => navigate({ to: '/accounting/chart-of-accounts' as string })}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={product.name}
      breadcrumbs={[
        { label: 'Products and services', href: '/sales/products' },
        { label: product.name },
      ]}
    >
      <div className="space-y-6" data-testid="product-detail">
        <div className="grid grid-cols-2 gap-4 rounded-md border p-4">
          <div>
            <p className="text-sm text-gray-500">Code</p>
            <p className="font-medium" data-testid="product-detail-code">{product.code}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="font-medium" data-testid="product-detail-name">{product.name}</p>
          </div>
          {product.description && (
            <div className="col-span-2">
              <p className="text-sm text-gray-500">Description</p>
              <p className="font-medium" data-testid="product-detail-description">
                {product.description}
              </p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500">Sale price</p>
            <p className="font-medium" data-testid="product-detail-sale-price">
              ${product.salePrice.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Cost price</p>
            <p className="font-medium" data-testid="product-detail-purchase-price">
              ${product.purchasePrice.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Tax Rate</p>
            <p className="font-medium">{product.taxRate}%</p>
          </div>
          {product.isTracked && (
            <div>
              <p className="text-sm text-gray-500">Quantity on Hand</p>
              <p className="font-medium" data-testid="product-detail-quantity">
                {product.quantityOnHand}
              </p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500">Sold</p>
            <p className="font-medium">{product.isSold ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Purchased</p>
            <p className="font-medium">{product.isPurchased ? 'Yes' : 'No'}</p>
          </div>
        </div>

        <div className="flex gap-2" data-testid="product-actions">
          <Button
            variant="outline"
            onClick={() => setEditing(true)}
            data-testid="product-edit-button"
          >
            Edit
          </Button>
          {product.isTracked && (
            <Button
              variant="outline"
              onClick={() => setAdjustOpen(true)}
              data-testid="adjust-stock-button"
            >
              Adjust Stock
            </Button>
          )}
          <Button
            variant="destructive"
            onClick={handleDelete}
            loading={deleteMutation.isPending}
            data-testid="product-delete-button"
          >
            Delete
          </Button>
        </div>

        {product.isTracked && (
          <div data-testid="stock-movements-section">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Stock Movements</h3>
            <StockMovementLog productId={productId} />
          </div>
        )}

        {product.isTracked && (
          <StockAdjustmentDialog
            open={adjustOpen}
            onClose={() => setAdjustOpen(false)}
            productId={productId}
            productName={product.name}
            currentQuantity={product.quantityOnHand}
          />
        )}
      </div>
    </PageContainer>
  );
}
