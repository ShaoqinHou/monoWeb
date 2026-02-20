// @vitest-environment jsdom
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
vi.mock('../hooks/useProducts', () => ({
  useProducts: (...args: unknown[]) => mockUseProducts(...args),
  useProduct: vi.fn().mockReturnValue({ data: null, isLoading: false }),
  useCreateProduct: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateProduct: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteProduct: () => ({ mutate: vi.fn(), isPending: false }),
}));

import { ProductsPage } from '../routes/ProductsPage';

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

describe('ProductsPage — Pagination and Bulk Actions', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockUseProducts.mockReturnValue({
      data: SAMPLE_PRODUCTS,
      isLoading: false,
    });
  });

  it('renders pagination controls', () => {
    render(<ProductsPage />, { wrapper: createWrapper() });
    expect(screen.getByLabelText('Previous page')).toBeInTheDocument();
    expect(screen.getByLabelText('Next page')).toBeInTheDocument();
    expect(screen.getByLabelText('Page size')).toBeInTheDocument();
  });

  it('renders product selection checkboxes', () => {
    render(<ProductsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('product-select-all')).toBeInTheDocument();
    expect(screen.getByTestId(`product-checkbox-${uuid(1)}`)).toBeInTheDocument();
    expect(screen.getByTestId(`product-checkbox-${uuid(2)}`)).toBeInTheDocument();
  });

  it('shows selected count in bulk actions bar when items are checked', () => {
    render(<ProductsPage />, { wrapper: createWrapper() });
    // Initially shows "No items selected"
    expect(screen.getByTestId('product-selected-count')).toHaveTextContent('No items selected');
    // Select one item
    fireEvent.click(screen.getByTestId(`product-checkbox-${uuid(1)}`));
    expect(screen.getByTestId('product-selected-count')).toHaveTextContent('1 item selected');
  });

  it('has Adjustment, Archive, Delete buttons always visible', () => {
    render(<ProductsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('product-bulk-adjustment')).toBeInTheDocument();
    expect(screen.getByTestId('product-bulk-archive')).toBeInTheDocument();
    expect(screen.getByTestId('product-bulk-delete')).toBeInTheDocument();
  });
});
