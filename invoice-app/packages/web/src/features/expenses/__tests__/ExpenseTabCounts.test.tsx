// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Expense } from '@xero-replica/shared';

const mockNavigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ expenseId: 'exp-1' }),
}));

const mockUseExpenses = vi.fn();

vi.mock('../hooks/useExpenses', () => ({
  useExpenses: (...args: unknown[]) => mockUseExpenses(...args),
  useExpense: () => ({ data: null, isLoading: false }),
  useCreateExpense: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteExpense: () => ({ mutate: vi.fn(), isPending: false }),
  useTransitionExpenseStatus: () => ({ mutate: vi.fn(), isPending: false }),
}));

import { ExpensesPage } from '../routes/ExpensesPage';

const uuid = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;

const SAMPLE_EXPENSES: Expense[] = [
  {
    id: uuid(1),
    employeeId: null,
    contactId: null,
    date: '2024-03-01',
    description: 'Draft expense',
    amount: 100,
    taxRate: 15,
    taxAmount: 15,
    total: 115,
    category: 'Office',
    receiptUrl: null,
    status: 'draft',
    accountCode: '429',
    notes: null,
    mileageKm: null,
    mileageRate: null,
    createdAt: '2024-03-01T10:00:00.000Z',
    updatedAt: '2024-03-01T10:00:00.000Z',
  },
  {
    id: uuid(2),
    employeeId: null,
    contactId: null,
    date: '2024-03-02',
    description: 'Submitted expense 1',
    amount: 200,
    taxRate: 15,
    taxAmount: 30,
    total: 230,
    category: 'Travel',
    receiptUrl: null,
    status: 'submitted',
    accountCode: '680',
    notes: null,
    mileageKm: null,
    mileageRate: null,
    createdAt: '2024-03-02T10:00:00.000Z',
    updatedAt: '2024-03-02T10:00:00.000Z',
  },
  {
    id: uuid(3),
    employeeId: null,
    contactId: null,
    date: '2024-03-03',
    description: 'Submitted expense 2',
    amount: 150,
    taxRate: 15,
    taxAmount: 22.5,
    total: 172.5,
    category: 'Travel',
    receiptUrl: null,
    status: 'submitted',
    accountCode: '680',
    notes: null,
    mileageKm: null,
    mileageRate: null,
    createdAt: '2024-03-03T10:00:00.000Z',
    updatedAt: '2024-03-03T10:00:00.000Z',
  },
  {
    id: uuid(4),
    employeeId: null,
    contactId: null,
    date: '2024-03-04',
    description: 'Approved expense',
    amount: 300,
    taxRate: 15,
    taxAmount: 45,
    total: 345,
    category: 'Meals',
    receiptUrl: null,
    status: 'approved',
    accountCode: '684',
    notes: null,
    mileageKm: null,
    mileageRate: null,
    createdAt: '2024-03-04T10:00:00.000Z',
    updatedAt: '2024-03-04T10:00:00.000Z',
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

describe('ExpensesPage — tab counts', () => {
  beforeEach(() => {
    mockUseExpenses.mockReturnValue({
      data: SAMPLE_EXPENSES,
      isLoading: false,
    });
  });

  it('shows count on "To review" tab matching submitted expenses', () => {
    render(<ExpensesPage />, { wrapper: createWrapper() });
    // 2 submitted expenses
    expect(screen.getByTestId('tab-review')).toHaveTextContent('To review (2)');
  });

  it('shows count on "To pay" tab matching approved expenses', () => {
    render(<ExpensesPage />, { wrapper: createWrapper() });
    // 1 approved expense
    expect(screen.getByTestId('tab-pay')).toHaveTextContent('To pay (1)');
  });
});
