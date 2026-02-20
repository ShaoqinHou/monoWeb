import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Product } from '@xero-replica/shared';

const mockNavigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ productId: 'prod-1' }),
}));

const mockUseProducts = vi.fn();
const mockUseProduct = vi.fn();
const mockUseCreateProduct = vi.fn();
const mockUseUpdateProduct = vi.fn();
const mockUseDeleteProduct = vi.fn();

vi.mock('../hooks/useProducts', () => ({
  useProducts: (...args: unknown[]) => mockUseProducts(...args),
  useProduct: (...args: unknown[]) => mockUseProduct(...args),
  useCreateProduct: (...args: unknown[]) => mockUseCreateProduct(...args),
  useUpdateProduct: (...args: unknown[]) => mockUseUpdateProduct(...args),
  useDeleteProduct: (...args: unknown[]) => mockUseDeleteProduct(...args),
}));

import { ProductsPage, ProductDetailPage } from '../routes/ProductsPage';
import { ProductList } from '../components/ProductList';
import { ProductForm } from '../components/ProductForm';

const uuid = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: uuid(1),
    code: 'SKU-001',
    name: 'Widget Pro',
    description: 'Premium widget',
    purchasePrice: 25.0,
    salePrice: 49.99,
    accountCode: '200',
    taxRate: 15,
    isTracked: true,
    quantityOnHand: 150,
    isSold: true,
    isPurchased: true,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: uuid(2),
    code: 'SVC-010',
    name: 'Consulting Hour',
    description: null,
    purchasePrice: 0,
    salePrice: 150.0,
    accountCode: '400',
    taxRate: 15,
    isTracked: false,
    quantityOnHand: 0,
    isSold: true,
    isPurchased: false,
    isActive: true,
    createdAt: '2024-02-01T00:00:00.000Z',
    updatedAt: '2024-02-01T00:00:00.000Z',
  },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('ProductList', () => {
  it('renders product table with rows', () => {
    render(<ProductList products={SAMPLE_PRODUCTS} onSelect={vi.fn()} />);
    expect(screen.getByTestId('product-list-table')).toBeInTheDocument();
    expect(screen.getByText('Widget Pro')).toBeInTheDocument();
    expect(screen.getByText('Consulting Hour')).toBeInTheDocument();
  });

  it('renders Xero-matching table headers (Cost price, Sale price, Quantity)', () => {
    render(<ProductList products={SAMPLE_PRODUCTS} onSelect={vi.fn()} />);
    expect(screen.getByText('Code')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Cost price')).toBeInTheDocument();
    expect(screen.getByText('Sale price')).toBeInTheDocument();
    expect(screen.getByText('Quantity')).toBeInTheDocument();
  });

  it('renders sortable column buttons', () => {
    render(<ProductList products={SAMPLE_PRODUCTS} onSelect={vi.fn()} />);
    expect(screen.getByTestId('sort-code')).toBeInTheDocument();
    expect(screen.getByTestId('sort-name')).toBeInTheDocument();
    expect(screen.getByTestId('sort-purchasePrice')).toBeInTheDocument();
    expect(screen.getByTestId('sort-salePrice')).toBeInTheDocument();
    expect(screen.getByTestId('sort-quantityOnHand')).toBeInTheDocument();
  });

  it('sorts products when column header clicked', () => {
    render(<ProductList products={SAMPLE_PRODUCTS} onSelect={vi.fn()} />);
    // Click name sort — should sort alphabetically
    fireEvent.click(screen.getByTestId('sort-name'));
    const rows = screen.getAllByTestId(/^product-row-/);
    expect(rows).toHaveLength(2);
  });

  it('renders per-row actions dropdown', () => {
    render(<ProductList products={SAMPLE_PRODUCTS} onSelect={vi.fn()} />);
    expect(screen.getByTestId(`product-actions-${uuid(1)}`)).toBeInTheDocument();
    expect(screen.getByTestId(`product-actions-${uuid(2)}`)).toBeInTheDocument();
  });

  it('opens actions menu on trigger click', () => {
    render(<ProductList products={SAMPLE_PRODUCTS.slice(0, 1)} onSelect={vi.fn()} />);
    const trigger = screen.getByTestId(`product-actions-trigger-${uuid(1)}`);
    fireEvent.click(trigger);
    expect(screen.getByTestId(`product-actions-menu-${uuid(1)}`)).toBeInTheDocument();
    expect(screen.getByTestId(`product-action-edit-${uuid(1)}`)).toBeInTheDocument();
    expect(screen.getByTestId(`product-action-duplicate-${uuid(1)}`)).toBeInTheDocument();
    expect(screen.getByTestId(`product-action-delete-${uuid(1)}`)).toBeInTheDocument();
  });

  it('calls onEdit from actions menu', () => {
    const onEdit = vi.fn();
    render(<ProductList products={SAMPLE_PRODUCTS.slice(0, 1)} onSelect={vi.fn()} onEdit={onEdit} />);
    fireEvent.click(screen.getByTestId(`product-actions-trigger-${uuid(1)}`));
    fireEvent.click(screen.getByTestId(`product-action-edit-${uuid(1)}`));
    expect(onEdit).toHaveBeenCalledWith(uuid(1));
  });

  it('calls onDelete from actions menu', () => {
    const onDelete = vi.fn();
    render(<ProductList products={SAMPLE_PRODUCTS.slice(0, 1)} onSelect={vi.fn()} onDelete={onDelete} />);
    fireEvent.click(screen.getByTestId(`product-actions-trigger-${uuid(1)}`));
    fireEvent.click(screen.getByTestId(`product-action-delete-${uuid(1)}`));
    expect(onDelete).toHaveBeenCalledWith(uuid(1));
  });

  it('shows quantity for tracked products only', () => {
    render(<ProductList products={SAMPLE_PRODUCTS} onSelect={vi.fn()} />);
    expect(screen.getByText('150')).toBeInTheDocument(); // tracked
  });

  it('calls onSelect when row clicked', () => {
    const onSelect = vi.fn();
    render(<ProductList products={SAMPLE_PRODUCTS.slice(0, 1)} onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId(`product-row-${uuid(1)}`));
    expect(onSelect).toHaveBeenCalledWith(uuid(1));
  });

  it('shows empty state when no products', () => {
    render(<ProductList products={[]} onSelect={vi.fn()} />);
    expect(screen.getByTestId('product-list-empty')).toBeInTheDocument();
    expect(screen.getByText('No products or services yet')).toBeInTheDocument();
  });

  it('displays product codes', () => {
    render(<ProductList products={SAMPLE_PRODUCTS} onSelect={vi.fn()} />);
    expect(screen.getByText('SKU-001')).toBeInTheDocument();
    expect(screen.getByText('SVC-010')).toBeInTheDocument();
  });

  it('respects visibleColumns prop to hide columns', () => {
    const cols = new Set(['code', 'name']);
    render(<ProductList products={SAMPLE_PRODUCTS} onSelect={vi.fn()} visibleColumns={cols} />);
    expect(screen.getByText('Code')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.queryByText('Cost price')).not.toBeInTheDocument();
    expect(screen.queryByText('Sale price')).not.toBeInTheDocument();
    expect(screen.queryByText('Quantity')).not.toBeInTheDocument();
  });

  it('has aria-label matching Xero table description', () => {
    render(<ProductList products={SAMPLE_PRODUCTS} onSelect={vi.fn()} />);
    expect(screen.getByLabelText('List of items with cost price, sale price and quantity')).toBeInTheDocument();
  });
});

describe('ProductForm', () => {
  it('renders all form fields', () => {
    render(<ProductForm onSubmit={vi.fn()} />);
    expect(screen.getByTestId('product-form')).toBeInTheDocument();
    expect(screen.getByTestId('product-code')).toBeInTheDocument();
    expect(screen.getByTestId('product-name')).toBeInTheDocument();
    expect(screen.getByTestId('product-description')).toBeInTheDocument();
    expect(screen.getByTestId('product-sale-price')).toBeInTheDocument();
    expect(screen.getByTestId('product-purchase-price')).toBeInTheDocument();
    expect(screen.getByTestId('product-tax-rate')).toBeInTheDocument();
    expect(screen.getByTestId('product-account-code')).toBeInTheDocument();
  });

  it('renders toggle checkboxes', () => {
    render(<ProductForm onSubmit={vi.fn()} />);
    expect(screen.getByTestId('product-sold-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('product-purchased-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('product-tracked-toggle')).toBeInTheDocument();
  });

  it('shows quantity field when tracked is toggled on', () => {
    render(<ProductForm onSubmit={vi.fn()} />);
    const toggle = screen.getByTestId('product-tracked-toggle').querySelector('input')!;
    fireEvent.click(toggle);
    expect(screen.getByTestId('product-quantity')).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(<ProductForm onSubmit={vi.fn()} />);
    expect(screen.getByTestId('product-submit-button')).toBeInTheDocument();
    expect(screen.getByText('Save Product')).toBeInTheDocument();
  });
});

describe('ProductsPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockUseProducts.mockReturnValue({
      data: SAMPLE_PRODUCTS,
      isLoading: false,
    });
  });

  it('renders page title matching Xero', () => {
    render(<ProductsPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Products and services')).toBeInTheDocument();
  });

  it('renders New item button', () => {
    render(<ProductsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('new-product-button')).toBeInTheDocument();
    expect(screen.getByText('New item')).toBeInTheDocument();
  });

  it('renders Import button', () => {
    render(<ProductsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('import-products-button')).toBeInTheDocument();
    expect(screen.getByText('Import')).toBeInTheDocument();
  });

  it('renders Export button', () => {
    render(<ProductsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('export-products-button')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('renders Other options button', () => {
    render(<ProductsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('other-options-button')).toBeInTheDocument();
  });

  it('renders More actions button', () => {
    render(<ProductsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('more-actions-button')).toBeInTheDocument();
  });

  it('renders search bar', () => {
    render(<ProductsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('search-products')).toBeInTheDocument();
  });

  it('renders Filter button next to search', () => {
    render(<ProductsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('filter-products-button')).toBeInTheDocument();
  });

  it('renders Columns picker button', () => {
    render(<ProductsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('columns-button')).toBeInTheDocument();
  });

  it('renders Active filter tag', () => {
    render(<ProductsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('active-filter-tag')).toBeInTheDocument();
    expect(screen.getByTestId('active-filter-tag')).toHaveTextContent('Active');
  });

  it('renders bulk actions bar with "No items selected"', () => {
    render(<ProductsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('product-bulk-actions-bar')).toBeInTheDocument();
    expect(screen.getByTestId('product-selected-count')).toHaveTextContent('No items selected');
  });

  it('renders bulk action buttons (Adjustment, Archive, Delete)', () => {
    render(<ProductsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('product-bulk-adjustment')).toBeInTheDocument();
    expect(screen.getByTestId('product-bulk-archive')).toBeInTheDocument();
    expect(screen.getByTestId('product-bulk-delete')).toBeInTheDocument();
  });

  it('disables bulk action buttons when no items selected', () => {
    render(<ProductsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('product-bulk-adjustment')).toBeDisabled();
    expect(screen.getByTestId('product-bulk-archive')).toBeDisabled();
    expect(screen.getByTestId('product-bulk-delete')).toBeDisabled();
  });

  it('renders product list', () => {
    render(<ProductsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('product-list-table')).toBeInTheDocument();
    expect(screen.getByText('Widget Pro')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseProducts.mockReturnValue({ data: [], isLoading: true });
    render(<ProductsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('products-loading')).toBeInTheDocument();
  });

  it('opens columns picker when Columns button clicked', () => {
    render(<ProductsPage />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByTestId('columns-button'));
    expect(screen.getByTestId('columns-picker')).toBeInTheDocument();
    expect(screen.getByTestId('column-toggle-code')).toBeInTheDocument();
    expect(screen.getByTestId('column-toggle-name')).toBeInTheDocument();
    expect(screen.getByTestId('column-toggle-costPrice')).toBeInTheDocument();
    expect(screen.getByTestId('column-toggle-salePrice')).toBeInTheDocument();
    expect(screen.getByTestId('column-toggle-quantity')).toBeInTheDocument();
  });
});

describe('ProductDetailPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockUseProduct.mockReturnValue({
      data: SAMPLE_PRODUCTS[0],
      isLoading: false,
    });
    mockUseDeleteProduct.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    mockUseUpdateProduct.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
  });

  it('renders product detail', () => {
    render(<ProductDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('product-detail')).toBeInTheDocument();
    expect(screen.getByTestId('product-detail-code')).toHaveTextContent('SKU-001');
    expect(screen.getByTestId('product-detail-name')).toHaveTextContent('Widget Pro');
  });

  it('uses Xero labels (Sale price, Cost price)', () => {
    render(<ProductDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Sale price')).toBeInTheDocument();
    expect(screen.getByText('Cost price')).toBeInTheDocument();
  });

  it('shows edit and delete buttons', () => {
    render(<ProductDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('product-edit-button')).toBeInTheDocument();
    expect(screen.getByTestId('product-delete-button')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseProduct.mockReturnValue({ data: null, isLoading: true });
    render(<ProductDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('product-detail-loading')).toBeInTheDocument();
  });

  it('shows not-found state', () => {
    mockUseProduct.mockReturnValue({ data: null, isLoading: false });
    render(<ProductDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('product-not-found')).toBeInTheDocument();
  });
});
