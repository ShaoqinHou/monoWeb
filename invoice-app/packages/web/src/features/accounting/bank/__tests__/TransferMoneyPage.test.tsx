// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mockAccounts = [
  { id: 'acc-1', name: 'Cheque Account', accountNumber: '1000', balance: 10000, statementBalance: 10500 },
  { id: 'acc-2', name: 'Savings Account', accountNumber: '1010', balance: 50000, statementBalance: 50000 },
];

const mockMutateAsync = vi.fn().mockResolvedValue({ id: 'bt-new' });

vi.mock('../hooks/useBank', () => ({
  useBankAccounts: () => ({
    data: mockAccounts,
    isLoading: false,
  }),
}));

vi.mock('../hooks/useBankTransactions', () => ({
  useCreateBankTransaction: () => ({
    mutate: vi.fn(),
    mutateAsync: mockMutateAsync,
    isPending: false,
    isSuccess: false,
    isError: false,
  }),
}));

vi.mock('../../../../components/layout/PageContainer', () => ({
  PageContainer: ({ children, title, breadcrumbs }: { children: React.ReactNode; title: string; breadcrumbs?: Array<{ label: string; href?: string }> }) => (
    <div data-testid="page-container">
      <h1>{title}</h1>
      {breadcrumbs && (
        <nav data-testid="breadcrumbs">
          {breadcrumbs.map((b, i) => (
            <span key={i} data-testid={`breadcrumb-${i}`}>{b.label}</span>
          ))}
        </nav>
      )}
      {children}
    </div>
  ),
}));

vi.mock('../../../../components/ui/Input', () => ({
  Input: (props: Record<string, unknown>) => (
    <div>
      {props.label ? <label>{String(props.label)}</label> : null}
      <input
        type={props.type as string}
        value={props.value as string}
        onChange={props.onChange as () => void}
        required={props.required as boolean}
        data-testid={props['data-testid'] as string}
        placeholder={props.placeholder as string}
      />
    </div>
  ),
}));

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

vi.mock('../../../../components/ui/Button', () => ({
  Button: (props: Record<string, unknown>) => (
    <button
      type={props.type as 'button' | 'submit' | 'reset' | undefined}
      onClick={props.onClick as () => void}
      disabled={!!props.disabled || !!props.loading}
      data-testid={props['data-testid'] as string}
    >
      {props.children as React.ReactNode}
    </button>
  ),
}));

import { TransferMoneyPage } from '../routes/TransferMoneyPage';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TransferMoneyPage', () => {
  it('renders page title', () => {
    render(<TransferMoneyPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Transfer Money' })).toBeInTheDocument();
  });

  it('renders transfer form', () => {
    render(<TransferMoneyPage />);
    expect(screen.getByTestId('transfer-form')).toBeInTheDocument();
    expect(screen.getByText('Transfer Between Accounts')).toBeInTheDocument();
  });

  it('renders from and to account selectors', () => {
    render(<TransferMoneyPage />);
    expect(screen.getByTestId('transfer-from')).toBeInTheDocument();
    expect(screen.getByTestId('transfer-to')).toBeInTheDocument();
  });

  it('renders amount and date inputs', () => {
    render(<TransferMoneyPage />);
    expect(screen.getByTestId('transfer-amount')).toBeInTheDocument();
    expect(screen.getByTestId('transfer-date')).toBeInTheDocument();
  });

  it('renders Reference field', () => {
    render(<TransferMoneyPage />);
    expect(screen.getByTestId('transfer-reference')).toBeInTheDocument();
    expect(screen.getByText('Reference')).toBeInTheDocument();
  });

  it('renders "+ add tracking" link', () => {
    render(<TransferMoneyPage />);
    expect(screen.getByTestId('add-tracking-link')).toBeInTheDocument();
    expect(screen.getByText('+ add tracking')).toBeInTheDocument();
  });

  it('shows tracking section when add tracking link clicked', () => {
    render(<TransferMoneyPage />);
    expect(screen.queryByTestId('tracking-section')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('add-tracking-link'));
    expect(screen.getByTestId('tracking-section')).toBeInTheDocument();
    expect(screen.queryByTestId('add-tracking-link')).not.toBeInTheDocument();
  });

  it('renders breadcrumb with Bank Accounts > Transfer Money', () => {
    render(<TransferMoneyPage />);
    expect(screen.getByTestId('breadcrumb-0')).toHaveTextContent('Bank Accounts');
    expect(screen.getByTestId('breadcrumb-1')).toHaveTextContent('Transfer Money');
  });

  it('renders transfer submit button', () => {
    render(<TransferMoneyPage />);
    expect(screen.getByTestId('transfer-submit')).toBeInTheDocument();
    expect(screen.getByText('Transfer')).toBeInTheDocument();
  });

  it('shows error when from and to accounts are the same', async () => {
    render(<TransferMoneyPage />);

    fireEvent.change(screen.getByTestId('transfer-from'), { target: { value: 'acc-1' } });
    fireEvent.change(screen.getByTestId('transfer-to'), { target: { value: 'acc-1' } });
    fireEvent.change(screen.getByTestId('transfer-amount'), { target: { value: '100' } });

    fireEvent.submit(screen.getByTestId('transfer-form'));

    expect(screen.getByTestId('transfer-error')).toBeInTheDocument();
    expect(screen.getByText('From and To accounts must be different.')).toBeInTheDocument();
  });

  it('shows error when amount is zero or empty', async () => {
    render(<TransferMoneyPage />);

    fireEvent.change(screen.getByTestId('transfer-from'), { target: { value: 'acc-1' } });
    fireEvent.change(screen.getByTestId('transfer-to'), { target: { value: 'acc-2' } });
    fireEvent.change(screen.getByTestId('transfer-amount'), { target: { value: '0' } });

    fireEvent.submit(screen.getByTestId('transfer-form'));

    expect(screen.getByTestId('transfer-error')).toBeInTheDocument();
    expect(screen.getByText('Amount must be greater than zero.')).toBeInTheDocument();
  });

  it('calls mutateAsync twice for a valid transfer (outgoing + incoming)', async () => {
    render(<TransferMoneyPage />);

    fireEvent.change(screen.getByTestId('transfer-from'), { target: { value: 'acc-1' } });
    fireEvent.change(screen.getByTestId('transfer-to'), { target: { value: 'acc-2' } });
    fireEvent.change(screen.getByTestId('transfer-amount'), { target: { value: '1000' } });

    fireEvent.submit(screen.getByTestId('transfer-form'));

    await vi.waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledTimes(2);
    });

    expect(mockMutateAsync.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        accountId: 'acc-1',
        amount: -1000,
      }),
    );

    expect(mockMutateAsync.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        accountId: 'acc-2',
        amount: 1000,
      }),
    );
  });

  it('does not show success message initially', () => {
    render(<TransferMoneyPage />);
    expect(screen.queryByTestId('transfer-success')).not.toBeInTheDocument();
  });
});
