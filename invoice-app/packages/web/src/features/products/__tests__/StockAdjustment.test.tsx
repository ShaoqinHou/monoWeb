// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the stock adjustment hook
const mockMutate = vi.fn();
const mockReset = vi.fn();
const mockUseStockAdjustment = vi.fn();
const mockUseStockMovements = vi.fn();

vi.mock('../hooks/useStockAdjustment', () => ({
  useStockAdjustment: (...args: unknown[]) => mockUseStockAdjustment(...args),
  useStockMovements: (...args: unknown[]) => mockUseStockMovements(...args),
}));

import { StockAdjustmentDialog } from '../components/StockAdjustmentDialog';
import { StockMovementLog } from '../components/StockMovementLog';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('StockAdjustmentDialog', () => {
  beforeEach(() => {
    mockMutate.mockClear();
    mockReset.mockClear();
    mockUseStockAdjustment.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
      reset: mockReset,
    });
  });

  it('renders dialog with product info', () => {
    render(
      <StockAdjustmentDialog
        open={true}
        onClose={vi.fn()}
        productId="p1"
        productName="Widget Pro"
        currentQuantity={150}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByTestId('stock-adjustment-dialog')).toBeInTheDocument();
    expect(screen.getByText('Widget Pro')).toBeInTheDocument();
    expect(screen.getByTestId('current-qty')).toHaveTextContent('150');
  });

  it('shows new quantity preview when quantity entered', () => {
    render(
      <StockAdjustmentDialog
        open={true}
        onClose={vi.fn()}
        productId="p1"
        productName="Widget"
        currentQuantity={100}
      />,
      { wrapper: createWrapper() },
    );

    const input = screen.getByTestId('adjust-quantity-input');
    fireEvent.change(input, { target: { value: '-20' } });

    expect(screen.getByTestId('new-qty-preview')).toHaveTextContent('80');
  });

  it('calls mutate on submit', () => {
    const onClose = vi.fn();
    render(
      <StockAdjustmentDialog
        open={true}
        onClose={onClose}
        productId="p1"
        productName="Widget"
        currentQuantity={100}
      />,
      { wrapper: createWrapper() },
    );

    const input = screen.getByTestId('adjust-quantity-input');
    fireEvent.change(input, { target: { value: '10' } });

    const submitBtn = screen.getByTestId('adjust-submit-btn');
    fireEvent.click(submitBtn);

    expect(mockMutate).toHaveBeenCalledWith(
      {
        id: 'p1',
        data: { quantity: 10, reason: 'stock_take', notes: undefined },
      },
      expect.any(Object),
    );
  });

  it('disables submit when quantity is zero', () => {
    render(
      <StockAdjustmentDialog
        open={true}
        onClose={vi.fn()}
        productId="p1"
        productName="Widget"
        currentQuantity={100}
      />,
      { wrapper: createWrapper() },
    );

    const submitBtn = screen.getByTestId('adjust-submit-btn');
    expect(submitBtn).toBeDisabled();
  });

  it('does not render when not open', () => {
    render(
      <StockAdjustmentDialog
        open={false}
        onClose={vi.fn()}
        productId="p1"
        productName="Widget"
        currentQuantity={100}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.queryByTestId('stock-adjustment-dialog')).not.toBeInTheDocument();
  });
});

describe('StockMovementLog', () => {
  beforeEach(() => {
    mockUseStockMovements.mockClear();
  });

  it('renders movement entries', () => {
    mockUseStockMovements.mockReturnValue({
      data: [
        {
          id: 'm1',
          productId: 'p1',
          type: 'invoice',
          quantity: -5,
          reason: null,
          notes: null,
          referenceId: 'inv-1',
          createdAt: '2026-02-15T10:00:00.000Z',
        },
        {
          id: 'm2',
          productId: 'p1',
          type: 'adjustment',
          quantity: 20,
          reason: 'stock_take',
          notes: 'Annual count',
          referenceId: null,
          createdAt: '2026-02-16T10:00:00.000Z',
        },
      ],
      isLoading: false,
    });

    render(<StockMovementLog productId="p1" />, { wrapper: createWrapper() });

    expect(screen.getByTestId('stock-movement-log')).toBeInTheDocument();
    expect(screen.getByTestId('movement-row-m1')).toBeInTheDocument();
    expect(screen.getByTestId('movement-row-m2')).toBeInTheDocument();
    expect(screen.getByText('-5')).toBeInTheDocument();
    expect(screen.getByText('+20')).toBeInTheDocument();
    expect(screen.getByText('stock_take')).toBeInTheDocument();
    expect(screen.getByText('Annual count')).toBeInTheDocument();
  });

  it('shows empty state when no movements', () => {
    mockUseStockMovements.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<StockMovementLog productId="p1" />, { wrapper: createWrapper() });
    expect(screen.getByTestId('movements-empty')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseStockMovements.mockReturnValue({
      data: [],
      isLoading: true,
    });

    render(<StockMovementLog productId="p1" />, { wrapper: createWrapper() });
    expect(screen.getByTestId('movements-loading')).toBeInTheDocument();
  });
});
