// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockNavigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({}),
}));

const mockMutate = vi.fn();

vi.mock('../hooks/useProducts', () => ({
  useProducts: vi.fn(() => ({ data: [], isLoading: false })),
  useProduct: vi.fn(() => ({ data: null, isLoading: false })),
  useCreateProduct: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
  useUpdateProduct: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useDeleteProduct: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

import { ProductCreatePage } from '../routes/ProductsPage';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('ProductCreatePage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockMutate.mockClear();
  });

  it('renders page with "New Product" title', () => {
    render(<ProductCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByRole('heading', { name: 'New Product' })).toBeInTheDocument();
  });

  it('renders breadcrumb back to Products and services', () => {
    render(<ProductCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByText('Products and services')).toBeInTheDocument();
  });

  it('renders the product form', () => {
    render(<ProductCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('product-form')).toBeInTheDocument();
  });

  it('calls createProduct mutate on form submit', () => {
    render(<ProductCreatePage />, { wrapper: createWrapper() });

    // Fill required fields
    fireEvent.change(screen.getByTestId('product-code'), { target: { value: 'NEW-001' } });
    fireEvent.change(screen.getByTestId('product-name'), { target: { value: 'New Widget' } });
    fireEvent.change(screen.getByTestId('product-sale-price'), { target: { value: '29.99' } });

    // Submit
    fireEvent.click(screen.getByTestId('product-submit-button'));

    expect(mockMutate).toHaveBeenCalledTimes(1);
    const data = mockMutate.mock.calls[0][0];
    expect(data.code).toBe('NEW-001');
    expect(data.name).toBe('New Widget');
    expect(data.salePrice).toBe(29.99);
  });
});
