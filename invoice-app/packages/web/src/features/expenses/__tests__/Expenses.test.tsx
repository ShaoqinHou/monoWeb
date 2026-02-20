import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Expense } from '@xero-replica/shared';

const mockNavigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ expenseId: 'exp-1' }),
}));

const mockUseExpenses = vi.fn();
const mockUseExpense = vi.fn();
const mockUseCreateExpense = vi.fn();
const mockUseDeleteExpense = vi.fn();
const mockUseTransitionExpenseStatus = vi.fn();

vi.mock('../hooks/useExpenses', () => ({
  useExpenses: (...args: unknown[]) => mockUseExpenses(...args),
  useExpense: (...args: unknown[]) => mockUseExpense(...args),
  useCreateExpense: (...args: unknown[]) => mockUseCreateExpense(...args),
  useDeleteExpense: (...args: unknown[]) => mockUseDeleteExpense(...args),
  useTransitionExpenseStatus: (...args: unknown[]) => mockUseTransitionExpenseStatus(...args),
}));

vi.mock('../../accounting/hooks/useTaxRates', () => ({
  useTaxRates: () => ({ data: undefined }),
}));

vi.mock('../../accounting/hooks/useAccounts', () => ({
  useAccounts: () => ({ data: undefined }),
}));

import { ExpensesPage, ExpenseCreatePage, ExpenseDetailPage } from '../routes/ExpensesPage';
import { ExpenseList } from '../components/ExpenseList';
import { ExpenseForm } from '../components/ExpenseForm';
import { ExpenseStatusBadge } from '../components/ExpenseStatusBadge';
import { ReceiptUpload } from '../components/ReceiptUpload';

const uuid = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;

const SAMPLE_EXPENSES: Expense[] = [
  {
    id: uuid(1),
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
  },
  {
    id: uuid(2),
    employeeId: null,
    contactId: null,
    date: '2024-03-05',
    description: 'Client Lunch',
    amount: 85.5,
    taxRate: 15,
    taxAmount: 12.83,
    total: 98.33,
    category: 'Meals',
    receiptUrl: null,
    status: 'submitted',
    accountCode: '680',
    notes: 'Meeting with Acme Corp',
    mileageKm: null,
    mileageRate: null,
    createdAt: '2024-03-05T12:00:00.000Z',
    updatedAt: '2024-03-05T12:00:00.000Z',
  },
  {
    id: uuid(3),
    employeeId: null,
    contactId: null,
    date: '2024-03-10',
    description: 'Mileage to conference',
    amount: 47.5,
    taxRate: 15,
    taxAmount: 7.13,
    total: 54.63,
    category: 'Travel',
    receiptUrl: null,
    status: 'approved',
    accountCode: '684',
    notes: null,
    mileageKm: 50,
    mileageRate: 0.95,
    createdAt: '2024-03-10T08:00:00.000Z',
    updatedAt: '2024-03-10T08:00:00.000Z',
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

describe('ExpenseStatusBadge', () => {
  it('renders Draft badge for draft status', () => {
    render(<ExpenseStatusBadge status="draft" />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('renders Submitted badge', () => {
    render(<ExpenseStatusBadge status="submitted" />);
    expect(screen.getByText('Submitted')).toBeInTheDocument();
  });

  it('renders Approved badge', () => {
    render(<ExpenseStatusBadge status="approved" />);
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('renders Reimbursed badge', () => {
    render(<ExpenseStatusBadge status="reimbursed" />);
    expect(screen.getByText('Reimbursed')).toBeInTheDocument();
  });

  it('renders Declined badge', () => {
    render(<ExpenseStatusBadge status="declined" />);
    expect(screen.getByText('Declined')).toBeInTheDocument();
  });
});

describe('ExpenseList', () => {
  it('renders expense table with rows', () => {
    render(<ExpenseList expenses={SAMPLE_EXPENSES} onSelect={vi.fn()} />);
    expect(screen.getByTestId('expense-list-table')).toBeInTheDocument();
    expect(screen.getByText('Office Supplies')).toBeInTheDocument();
    expect(screen.getByText('Client Lunch')).toBeInTheDocument();
  });

  it('renders table headers', () => {
    render(<ExpenseList expenses={SAMPLE_EXPENSES} onSelect={vi.fn()} />);
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('calls onSelect when row clicked', () => {
    const onSelect = vi.fn();
    render(<ExpenseList expenses={SAMPLE_EXPENSES.slice(0, 1)} onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId(`expense-row-${uuid(1)}`));
    expect(onSelect).toHaveBeenCalledWith(uuid(1));
  });

  it('shows empty state when no expenses', () => {
    render(<ExpenseList expenses={[]} onSelect={vi.fn()} />);
    expect(screen.getByTestId('expense-list-empty')).toBeInTheDocument();
    expect(screen.getByText('No expenses yet')).toBeInTheDocument();
  });

  it('displays status badges', () => {
    render(<ExpenseList expenses={SAMPLE_EXPENSES} onSelect={vi.fn()} />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Submitted')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });
});

describe('ExpenseForm', () => {
  it('renders all form fields', () => {
    render(<ExpenseForm onSubmit={vi.fn()} />);
    expect(screen.getByTestId('expense-form')).toBeInTheDocument();
    expect(screen.getByTestId('expense-date')).toBeInTheDocument();
    expect(screen.getByTestId('expense-description')).toBeInTheDocument();
    expect(screen.getByTestId('expense-amount')).toBeInTheDocument();
    expect(screen.getByTestId('expense-category')).toBeInTheDocument();
    expect(screen.getByTestId('expense-account-code')).toBeInTheDocument();
    expect(screen.getByTestId('expense-tax-rate')).toBeInTheDocument();
    expect(screen.getByTestId('expense-notes')).toBeInTheDocument();
  });

  it('renders mileage toggle', () => {
    render(<ExpenseForm onSubmit={vi.fn()} />);
    expect(screen.getByTestId('mileage-toggle')).toBeInTheDocument();
  });

  it('shows mileage fields when toggled', () => {
    render(<ExpenseForm onSubmit={vi.fn()} />);
    const toggle = screen.getByTestId('mileage-toggle').querySelector('input')!;
    fireEvent.click(toggle);
    expect(screen.getByTestId('mileage-fields')).toBeInTheDocument();
    expect(screen.getByTestId('expense-mileage-km')).toBeInTheDocument();
    expect(screen.getByTestId('expense-mileage-rate-select')).toBeInTheDocument();
  });

  it('renders receipt upload', () => {
    render(<ExpenseForm onSubmit={vi.fn()} />);
    expect(screen.getByTestId('receipt-upload')).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(<ExpenseForm onSubmit={vi.fn()} />);
    expect(screen.getByTestId('expense-submit-button')).toBeInTheDocument();
    expect(screen.getByText('Save Expense')).toBeInTheDocument();
  });
});

describe('ReceiptUpload', () => {
  it('renders upload button when no value', () => {
    render(<ReceiptUpload value={null} onChange={vi.fn()} />);
    expect(screen.getByTestId('receipt-upload-button')).toBeInTheDocument();
    expect(screen.getByText('Upload Receipt')).toBeInTheDocument();
  });

  it('renders preview when value provided', () => {
    render(<ReceiptUpload value="data:image/png;base64,abc" onChange={vi.fn()} />);
    expect(screen.getByTestId('receipt-preview')).toBeInTheDocument();
    expect(screen.getByTestId('receipt-remove-button')).toBeInTheDocument();
  });
});

describe('ExpensesPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockUseExpenses.mockReturnValue({
      data: SAMPLE_EXPENSES,
      isLoading: false,
    });
    mockUseTransitionExpenseStatus.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
  });

  it('renders page title', () => {
    render(<ExpensesPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Expenses')).toBeInTheDocument();
  });

  it('renders New Expense button', () => {
    render(<ExpensesPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('new-expense-button')).toBeInTheDocument();
  });

  it('renders Xero-matching status tabs', () => {
    render(<ExpensesPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('expense-status-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('tab-own')).toBeInTheDocument();
    expect(screen.getByText('Your own')).toBeInTheDocument();
    expect(screen.getByTestId('tab-review')).toBeInTheDocument();
    expect(screen.getByText(/To review/)).toBeInTheDocument();
    expect(screen.getByTestId('tab-pay')).toBeInTheDocument();
    expect(screen.getByText(/To pay/)).toBeInTheDocument();
    expect(screen.getByTestId('tab-all')).toBeInTheDocument();
    expect(screen.getByTestId('tab-explorer')).toBeInTheDocument();
    expect(screen.getByText('Explorer')).toBeInTheDocument();
  });

  it('defaults to "Your own" tab showing draft and submitted expenses', () => {
    render(<ExpensesPage />, { wrapper: createWrapper() });
    // "Your own" tab is active by default, shows draft + submitted
    expect(screen.getByText('Office Supplies')).toBeInTheDocument(); // draft
    expect(screen.getByText('Client Lunch')).toBeInTheDocument(); // submitted
  });

  it('filters to submitted expenses on "To review" tab', () => {
    render(<ExpensesPage />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByTestId('tab-review'));
    expect(screen.getByText('Client Lunch')).toBeInTheDocument(); // submitted
    // draft and approved should not be visible in the table rows
  });

  it('filters to approved expenses on "To pay" tab', () => {
    render(<ExpensesPage />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByTestId('tab-pay'));
    expect(screen.getByText('Mileage to conference')).toBeInTheDocument(); // approved
  });

  it('shows all expenses on "All" tab', () => {
    render(<ExpensesPage />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByTestId('tab-all'));
    expect(screen.getByText('Office Supplies')).toBeInTheDocument();
    expect(screen.getByText('Client Lunch')).toBeInTheDocument();
    expect(screen.getByText('Mileage to conference')).toBeInTheDocument();
  });

  it('renders expense list', () => {
    render(<ExpensesPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('expense-list-table')).toBeInTheDocument();
    expect(screen.getByText('Office Supplies')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseExpenses.mockReturnValue({ data: [], isLoading: true });
    render(<ExpensesPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('expenses-loading')).toBeInTheDocument();
  });
});

describe('ExpenseDetailPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockUseExpense.mockReturnValue({
      data: SAMPLE_EXPENSES[0],
      isLoading: false,
    });
    mockUseTransitionExpenseStatus.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    mockUseDeleteExpense.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
  });

  it('renders expense detail', () => {
    render(<ExpenseDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('expense-detail')).toBeInTheDocument();
    expect(screen.getByTestId('expense-detail-description')).toHaveTextContent('Office Supplies');
  });

  it('shows Submit button for draft expense', () => {
    render(<ExpenseDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('expense-action-submitted')).toBeInTheDocument();
  });

  it('shows Delete button for draft expense', () => {
    render(<ExpenseDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('expense-delete-button')).toBeInTheDocument();
  });

  it('shows Approve/Decline for submitted expense', () => {
    mockUseExpense.mockReturnValue({
      data: SAMPLE_EXPENSES[1],
      isLoading: false,
    });
    render(<ExpenseDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('expense-action-approved')).toBeInTheDocument();
    expect(screen.getByTestId('expense-action-declined')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseExpense.mockReturnValue({ data: null, isLoading: true });
    render(<ExpenseDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('expense-detail-loading')).toBeInTheDocument();
  });

  it('shows not-found state', () => {
    mockUseExpense.mockReturnValue({ data: null, isLoading: false });
    render(<ExpenseDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('expense-not-found')).toBeInTheDocument();
  });
});
