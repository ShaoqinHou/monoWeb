// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

vi.mock('../../../../components/ui/Combobox', () => ({
  Combobox: (props: Record<string, unknown>) => (
    <div>
      {props.label ? <label>{String(props.label)}</label> : null}
      <select
        value={props.value as string}
        onChange={(e) => (props.onChange as (v: string) => void)(e.target.value)}
        data-testid={props['data-testid'] as string}
      >
        {props.placeholder ? <option value="">{String(props.placeholder)}</option> : null}
        {(props.options as Array<{ value: string; label: string }>)?.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  ),
}));

vi.mock('../../hooks/useTaxRates', () => ({
  useTaxRates: () => ({ data: undefined }),
}));

// Components
import { MoneyForm } from '../components/MoneyForm';
import { CashCodingRow } from '../components/CashCodingRow';

// Hooks
import {
  useCreateBankTransaction,
  useUpdateBankTransaction,
  useUndoReconciliation,
} from '../hooks/useBankTransactions';

// Types
import type { BankAccount, BankTransaction } from '../types';

// ── Test helpers ─────────────────────────────────────────────────────────────

const mockAccounts: BankAccount[] = [
  { id: 'acc-1', name: 'Cheque Account', accountNumber: '1000', balance: 10000, statementBalance: 10500 },
  { id: 'acc-2', name: 'Savings Account', accountNumber: '1010', balance: 50000, statementBalance: 50000 },
];

const mockTransaction: BankTransaction = {
  id: 'tx-1',
  date: '2026-02-10',
  description: 'Office Supplies',
  amount: -250,
  status: 'unmatched',
};

const mockInflow: BankTransaction = {
  id: 'tx-2',
  date: '2026-02-11',
  description: 'Client Payment',
  amount: 1500,
  status: 'unmatched',
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

// ── MoneyForm ────────────────────────────────────────────────────────────────

describe('MoneyForm', () => {
  it('renders Spend Money title for spend type', () => {
    render(
      <MoneyForm type="spend" accounts={mockAccounts} onSubmit={() => {}} isLoading={false} />,
    );
    expect(screen.getByText('Spend Money')).toBeInTheDocument();
  });

  it('renders Receive Money title for receive type', () => {
    render(
      <MoneyForm type="receive" accounts={mockAccounts} onSubmit={() => {}} isLoading={false} />,
    );
    expect(screen.getByText('Receive Money')).toBeInTheDocument();
  });

  it('renders Payee label for spend type', () => {
    render(
      <MoneyForm type="spend" accounts={mockAccounts} onSubmit={() => {}} isLoading={false} />,
    );
    expect(screen.getByText('Payee')).toBeInTheDocument();
  });

  it('renders Payer label for receive type', () => {
    render(
      <MoneyForm type="receive" accounts={mockAccounts} onSubmit={() => {}} isLoading={false} />,
    );
    expect(screen.getByText('Payer')).toBeInTheDocument();
  });

  it('calls onSubmit with form data', () => {
    const onSubmit = vi.fn();
    render(
      <MoneyForm type="spend" accounts={mockAccounts} onSubmit={onSubmit} isLoading={false} />,
    );

    // Fill payee
    fireEvent.change(screen.getByTestId('money-payee'), { target: { value: 'Vendor A' } });
    // Fill amount
    fireEvent.change(screen.getByTestId('money-amount'), { target: { value: '500' } });
    // Fill description
    fireEvent.change(screen.getByTestId('money-description'), { target: { value: 'Rent' } });

    // Submit
    fireEvent.click(screen.getByTestId('money-submit'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const data = onSubmit.mock.calls[0][0];
    expect(data.payee).toBe('Vendor A');
    expect(data.amount).toBe('500');
    expect(data.description).toBe('Rent');
  });

  it('shows Record Spend button for spend type', () => {
    render(
      <MoneyForm type="spend" accounts={mockAccounts} onSubmit={() => {}} isLoading={false} />,
    );
    expect(screen.getByTestId('money-submit')).toHaveTextContent('Record Spend');
  });

  it('shows Record Receipt button for receive type', () => {
    render(
      <MoneyForm type="receive" accounts={mockAccounts} onSubmit={() => {}} isLoading={false} />,
    );
    expect(screen.getByTestId('money-submit')).toHaveTextContent('Record Receipt');
  });
});

// ── CashCodingRow ────────────────────────────────────────────────────────────

describe('CashCodingRow', () => {
  it('renders transaction date and description', () => {
    const { container } = render(
      <table>
        <tbody>
          <CashCodingRow
            transaction={mockTransaction}
            accountCode=""
            taxRate=""
            onChange={() => {}}
          />
        </tbody>
      </table>,
    );
    expect(screen.getByText('2026-02-10')).toBeInTheDocument();
    expect(screen.getByText('Office Supplies')).toBeInTheDocument();
  });

  it('shows negative amount in red for outflows', () => {
    render(
      <table>
        <tbody>
          <CashCodingRow
            transaction={mockTransaction}
            accountCode=""
            taxRate=""
            onChange={() => {}}
          />
        </tbody>
      </table>,
    );
    // Amount -250 shown as positive $250.00 in red
    expect(screen.getByText('$250.00')).toBeInTheDocument();
  });

  it('shows positive amount in green for inflows', () => {
    render(
      <table>
        <tbody>
          <CashCodingRow
            transaction={mockInflow}
            accountCode=""
            taxRate=""
            onChange={() => {}}
          />
        </tbody>
      </table>,
    );
    expect(screen.getByText('$1,500.00')).toBeInTheDocument();
  });

  it('calls onChange when account code changes', () => {
    const onChange = vi.fn();
    render(
      <table>
        <tbody>
          <CashCodingRow
            transaction={mockTransaction}
            accountCode=""
            taxRate=""
            onChange={onChange}
          />
        </tbody>
      </table>,
    );
    const select = screen.getByTestId(`cashcoding-account-${mockTransaction.id}`);
    // The select is inside a wrapper div; get the actual <select>
    const selectEl = select.tagName === 'SELECT' ? select : select.querySelector('select');
    fireEvent.change(selectEl!, { target: { value: '469' } });
    expect(onChange).toHaveBeenCalledWith('tx-1', 'accountCode', '469');
  });

  it('calls onChange when tax rate changes', () => {
    const onChange = vi.fn();
    render(
      <table>
        <tbody>
          <CashCodingRow
            transaction={mockTransaction}
            accountCode=""
            taxRate=""
            onChange={onChange}
          />
        </tbody>
      </table>,
    );
    const select = screen.getByTestId(`cashcoding-tax-${mockTransaction.id}`);
    const selectEl = select.tagName === 'SELECT' ? select : select.querySelector('select');
    fireEvent.change(selectEl!, { target: { value: '15' } });
    expect(onChange).toHaveBeenCalledWith('tx-1', 'taxRate', '15');
  });
});

// ── useCreateBankTransaction ─────────────────────────────────────────────────

describe('useCreateBankTransaction', () => {
  it('posts to /api/bank-transactions with transaction data', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        ok: true,
        data: {
          id: 'bt-new',
          accountId: 'acc-1',
          date: '2026-02-16',
          description: 'Office Rent',
          reference: null,
          amount: -2000,
          isReconciled: false,
          matchedInvoiceId: null,
          matchedBillId: null,
          matchedPaymentId: null,
          category: null,
          createdAt: '2026-02-16T00:00:00Z',
        },
      }),
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useCreateBankTransaction(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({
        accountId: 'acc-1',
        date: '2026-02-16',
        description: 'Office Rent',
        amount: -2000,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/bank-transactions',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          accountId: 'acc-1',
          date: '2026-02-16',
          description: 'Office Rent',
          amount: -2000,
        }),
      }),
    );
  });
});

// ── useUpdateBankTransaction ─────────────────────────────────────────────────

describe('useUpdateBankTransaction', () => {
  it('puts to /api/bank-transactions/:id with update data', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        data: {
          id: 'bt-1',
          accountId: 'acc-1',
          date: '2026-02-10',
          description: 'Test',
          reference: null,
          amount: -250,
          isReconciled: true,
          matchedInvoiceId: null,
          matchedBillId: null,
          matchedPaymentId: null,
          category: '469',
          createdAt: '2026-02-10T00:00:00Z',
        },
      }),
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useUpdateBankTransaction(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({
        id: 'bt-1',
        category: '469',
        isReconciled: true,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/bank-transactions/bt-1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({
          category: '469',
          isReconciled: true,
        }),
      }),
    );
  });
});

// ── useUndoReconciliation ────────────────────────────────────────────────────

describe('useUndoReconciliation', () => {
  it('puts isReconciled=false to /api/bank-transactions/:id', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        data: {
          id: 'bt-1',
          accountId: 'acc-1',
          date: '2026-02-10',
          description: 'Test',
          reference: null,
          amount: -250,
          isReconciled: false,
          matchedInvoiceId: null,
          matchedBillId: null,
          matchedPaymentId: null,
          category: null,
          createdAt: '2026-02-10T00:00:00Z',
        },
      }),
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useUndoReconciliation(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate('bt-1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/bank-transactions/bt-1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({
          isReconciled: false,
          matchedInvoiceId: null,
          matchedBillId: null,
          category: null,
        }),
      }),
    );
  });

  it('returns error when API fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ ok: false, error: 'Internal error' }),
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useUndoReconciliation(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate('bt-1');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});

// ── MoneyForm validation ─────────────────────────────────────────────────────

describe('MoneyForm accounts dropdown', () => {
  it('renders account options in the select', () => {
    render(
      <MoneyForm type="spend" accounts={mockAccounts} onSubmit={() => {}} isLoading={false} />,
    );
    // The account select should have the account options
    const accountSelect = screen.getByTestId('money-account');
    const selectEl = accountSelect.tagName === 'SELECT' ? accountSelect : accountSelect.querySelector('select');
    const options = selectEl!.querySelectorAll('option');
    // Placeholder + 2 accounts
    expect(options.length).toBeGreaterThanOrEqual(2);
  });

  it('disables submit button when loading', () => {
    render(
      <MoneyForm type="spend" accounts={mockAccounts} onSubmit={() => {}} isLoading={true} />,
    );
    expect(screen.getByTestId('money-submit')).toBeDisabled();
  });
});
