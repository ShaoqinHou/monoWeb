// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Expense, ExpenseStatusType } from '@xero-replica/shared';

const mockNavigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ expenseId: 'exp-1' }),
}));

const mockUseExpense = vi.fn();
const mockUseTransitionExpenseStatus = vi.fn();
const mockUseDeleteExpense = vi.fn();
const mockUseExpenses = vi.fn();
const mockUseCreateExpense = vi.fn();
const mockUseApproveExpense = vi.fn();
const mockUseRejectExpense = vi.fn();
const mockUseReimburseExpense = vi.fn();

vi.mock('../hooks/useExpenses', () => ({
  useExpenses: (...args: unknown[]) => mockUseExpenses(...args),
  useExpense: (...args: unknown[]) => mockUseExpense(...args),
  useCreateExpense: (...args: unknown[]) => mockUseCreateExpense(...args),
  useDeleteExpense: (...args: unknown[]) => mockUseDeleteExpense(...args),
  useTransitionExpenseStatus: (...args: unknown[]) => mockUseTransitionExpenseStatus(...args),
  useApproveExpense: (...args: unknown[]) => mockUseApproveExpense(...args),
  useRejectExpense: (...args: unknown[]) => mockUseRejectExpense(...args),
  useReimburseExpense: (...args: unknown[]) => mockUseReimburseExpense(...args),
  useUpdateExpense: vi.fn(),
}));

import { ExpenseDetailPage } from '../routes/ExpensesPage';

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'exp-1',
    employeeId: null,
    contactId: null,
    date: '2024-03-01',
    description: 'Office Supplies',
    amount: 120.0,
    taxRate: 15,
    taxAmount: 18.0,
    total: 138.0,
    category: 'Office',
    receiptUrl: null,
    status: 'draft',
    accountCode: '429',
    notes: null,
    mileageKm: null,
    mileageRate: null,
    createdAt: '2024-03-01T10:00:00.000Z',
    updatedAt: '2024-03-01T10:00:00.000Z',
    ...overrides,
  };
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

// =========================================================
// 1. Expense approval hooks exports
// =========================================================

describe('Expense approval hooks', () => {
  it('exports useApproveExpense', async () => {
    const mod = await import('../hooks/useExpenses');
    expect(typeof mod.useApproveExpense).toBe('function');
  });

  it('exports useRejectExpense', async () => {
    const mod = await import('../hooks/useExpenses');
    expect(typeof mod.useRejectExpense).toBe('function');
  });

  it('exports useReimburseExpense', async () => {
    const mod = await import('../hooks/useExpenses');
    expect(typeof mod.useReimburseExpense).toBe('function');
  });
});

// =========================================================
// 2. ExpenseDetailPage — approval buttons for submitted expenses
// =========================================================

describe('ExpenseDetailPage — approval workflow', () => {
  const transitionMutate = vi.fn();

  beforeEach(() => {
    mockNavigate.mockClear();
    transitionMutate.mockClear();
    mockUseTransitionExpenseStatus.mockReturnValue({
      mutate: transitionMutate,
      isPending: false,
    });
    mockUseDeleteExpense.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
  });

  it('shows Approve and Decline buttons for submitted expense', () => {
    mockUseExpense.mockReturnValue({
      data: makeExpense({ status: 'submitted' }),
      isLoading: false,
    });
    render(<ExpenseDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('expense-action-approved')).toBeInTheDocument();
    expect(screen.getByTestId('expense-action-declined')).toBeInTheDocument();
  });

  it('shows Reimburse button for approved expense', () => {
    mockUseExpense.mockReturnValue({
      data: makeExpense({ status: 'approved' }),
      isLoading: false,
    });
    render(<ExpenseDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('expense-action-reimbursed')).toBeInTheDocument();
  });

  it('calls transition with approved on Approve click', () => {
    mockUseExpense.mockReturnValue({
      data: makeExpense({ status: 'submitted' }),
      isLoading: false,
    });
    render(<ExpenseDetailPage />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByTestId('expense-action-approved'));
    expect(transitionMutate).toHaveBeenCalledWith(
      { id: 'exp-1', status: 'approved' },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    );
  });

  it('calls transition with declined on Decline click', () => {
    mockUseExpense.mockReturnValue({
      data: makeExpense({ status: 'submitted' }),
      isLoading: false,
    });
    render(<ExpenseDetailPage />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByTestId('expense-action-declined'));
    expect(transitionMutate).toHaveBeenCalledWith(
      { id: 'exp-1', status: 'declined' },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    );
  });

  it('calls transition with reimbursed on Reimburse click', () => {
    mockUseExpense.mockReturnValue({
      data: makeExpense({ status: 'approved' }),
      isLoading: false,
    });
    render(<ExpenseDetailPage />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByTestId('expense-action-reimbursed'));
    expect(transitionMutate).toHaveBeenCalledWith(
      { id: 'exp-1', status: 'reimbursed' },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    );
  });

  it('does not show approval buttons for draft expense (only Submit)', () => {
    mockUseExpense.mockReturnValue({
      data: makeExpense({ status: 'draft' }),
      isLoading: false,
    });
    render(<ExpenseDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('expense-action-submitted')).toBeInTheDocument();
    expect(screen.queryByTestId('expense-action-approved')).not.toBeInTheDocument();
    expect(screen.queryByTestId('expense-action-declined')).not.toBeInTheDocument();
  });
});
