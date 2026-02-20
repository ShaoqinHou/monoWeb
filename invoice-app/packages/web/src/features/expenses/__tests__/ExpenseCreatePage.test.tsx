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

vi.mock('../hooks/useExpenses', () => ({
  useExpenses: vi.fn(() => ({ data: [], isLoading: false })),
  useExpense: vi.fn(() => ({ data: null, isLoading: false })),
  useCreateExpense: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
  useDeleteExpense: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useTransitionExpenseStatus: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useUpdateExpense: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useApproveExpense: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useRejectExpense: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useReimburseExpense: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

import { ExpenseCreatePage } from '../routes/ExpensesPage';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('ExpenseCreatePage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockMutate.mockClear();
  });

  it('renders page with "New Expense" title', () => {
    render(<ExpenseCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByRole('heading', { name: 'New Expense' })).toBeInTheDocument();
  });

  it('renders breadcrumb back to Expenses', () => {
    render(<ExpenseCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByText('Expenses')).toBeInTheDocument();
  });

  it('renders the expense form', () => {
    render(<ExpenseCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('expense-form')).toBeInTheDocument();
  });

  it('calls createExpense mutate on form submit', () => {
    render(<ExpenseCreatePage />, { wrapper: createWrapper() });

    // Fill required fields
    fireEvent.change(screen.getByTestId('expense-description'), {
      target: { value: 'Test expense' },
    });
    fireEvent.change(screen.getByTestId('expense-amount'), {
      target: { value: '50.00' },
    });

    // Submit
    fireEvent.click(screen.getByTestId('expense-submit-button'));

    expect(mockMutate).toHaveBeenCalledTimes(1);
    const data = mockMutate.mock.calls[0][0];
    expect(data.description).toBe('Test expense');
    expect(data.amount).toBe(50);
  });
});
