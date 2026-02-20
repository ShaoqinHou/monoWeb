// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mockAccounts = [
  { id: 'acc-1', name: 'Cheque Account', accountNumber: '1000', balance: 10000, statementBalance: 10500 },
];

const mockTransactions = [
  { id: 'tx-1', date: '2026-02-10', description: 'Office Supplies', amount: -250, status: 'unmatched' as const },
  { id: 'tx-2', date: '2026-02-11', description: 'Client Payment', amount: 1500, status: 'unmatched' as const },
  { id: 'tx-3', date: '2026-02-09', description: 'Already matched', amount: 300, status: 'matched' as const },
];

let selectedAccountId = '';
const mockUpdateMutateAsync = vi.fn().mockResolvedValue({});

vi.mock('../hooks/useBank', () => ({
  useBankAccounts: () => ({
    data: mockAccounts,
    isLoading: false,
  }),
  useBankTransactions: (accountId: string) => ({
    data: accountId ? mockTransactions : [],
    isLoading: false,
  }),
}));

vi.mock('../hooks/useBankTransactions', () => ({
  useUpdateBankTransaction: () => ({
    mutateAsync: mockUpdateMutateAsync,
    isPending: false,
  }),
}));

vi.mock('../../../../components/layout/PageContainer', () => ({
  PageContainer: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-testid="page-container">
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock('../../../../components/ui/Card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="card-header">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div data-testid="card-content">{children}</div>,
}));

vi.mock('../../../../components/ui/Button', () => ({
  Button: (props: Record<string, unknown>) => (
    <button
      onClick={props.onClick as () => void}
      disabled={!!props.disabled || !!props.loading}
      data-testid={props['data-testid'] as string}
    >
      {props.children as React.ReactNode}
    </button>
  ),
}));

vi.mock('../../../../components/ui/Select', () => ({
  Select: (props: Record<string, unknown>) => (
    <select
      value={props.value as string}
      onChange={props.onChange as () => void}
      data-testid={props['data-testid'] as string}
    >
      {props.placeholder ? <option value="">{String(props.placeholder)}</option> : null}
      {(props.options as Array<{ value: string; label: string }>)?.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  ),
}));

vi.mock('../../../../components/ui/Table', () => ({
  Table: (props: Record<string, unknown>) => <table>{props.children as React.ReactNode}</table>,
  TableHeader: (props: Record<string, unknown>) => <thead>{props.children as React.ReactNode}</thead>,
  TableBody: (props: Record<string, unknown>) => <tbody>{props.children as React.ReactNode}</tbody>,
  TableRow: (props: Record<string, unknown>) => <tr>{props.children as React.ReactNode}</tr>,
  TableHead: (props: Record<string, unknown>) => <th>{props.children as React.ReactNode}</th>,
}));

vi.mock('../components/CashCodingRow', () => ({
  CashCodingRow: ({ transaction, onChange }: { transaction: { id: string; description: string }; onChange: (id: string, field: string, value: string) => void }) => (
    <tr data-testid={`cashcoding-row-${transaction.id}`}>
      <td>{transaction.description}</td>
      <td>
        <button
          data-testid={`mock-code-${transaction.id}`}
          onClick={() => onChange(transaction.id, 'accountCode', '469')}
        >
          Code
        </button>
      </td>
    </tr>
  ),
}));

import { CashCodingPage } from '../routes/CashCodingPage';

beforeEach(() => {
  vi.clearAllMocks();
  selectedAccountId = '';
});

describe('CashCodingPage', () => {
  it('renders page title', () => {
    render(<CashCodingPage />);
    expect(screen.getByText('Cash Coding')).toBeInTheDocument();
  });

  it('renders account selector', () => {
    render(<CashCodingPage />);
    expect(screen.getByTestId('cashcoding-account-select')).toBeInTheDocument();
  });

  it('does not show transactions until account is selected', () => {
    render(<CashCodingPage />);
    expect(screen.queryByTestId('card')).not.toBeInTheDocument();
  });

  it('shows transactions card after selecting an account', () => {
    render(<CashCodingPage />);

    fireEvent.change(screen.getByTestId('cashcoding-account-select'), { target: { value: 'acc-1' } });

    expect(screen.getByTestId('card')).toBeInTheDocument();
  });

  it('shows only unmatched transactions', () => {
    render(<CashCodingPage />);

    fireEvent.change(screen.getByTestId('cashcoding-account-select'), { target: { value: 'acc-1' } });

    // Should only show 2 unmatched rows (tx-1 and tx-2), not tx-3 (matched)
    expect(screen.getByTestId('cashcoding-row-tx-1')).toBeInTheDocument();
    expect(screen.getByTestId('cashcoding-row-tx-2')).toBeInTheDocument();
    expect(screen.queryByTestId('cashcoding-row-tx-3')).not.toBeInTheDocument();
  });

  it('renders save all button disabled when nothing is coded', () => {
    render(<CashCodingPage />);

    fireEvent.change(screen.getByTestId('cashcoding-account-select'), { target: { value: 'acc-1' } });

    const saveBtn = screen.getByTestId('cashcoding-save-all');
    expect(saveBtn).toBeDisabled();
    expect(saveBtn).toHaveTextContent('Save All (0)');
  });

  it('enables save all button after coding a transaction', () => {
    render(<CashCodingPage />);

    fireEvent.change(screen.getByTestId('cashcoding-account-select'), { target: { value: 'acc-1' } });

    // Code a transaction
    fireEvent.click(screen.getByTestId('mock-code-tx-1'));

    const saveBtn = screen.getByTestId('cashcoding-save-all');
    expect(saveBtn).not.toBeDisabled();
    expect(saveBtn).toHaveTextContent('Save All (1)');
  });

  it('does not show success message initially', () => {
    render(<CashCodingPage />);
    expect(screen.queryByTestId('cashcoding-success')).not.toBeInTheDocument();
  });
});
