// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mockAccounts = [
  { id: 'acc-1', name: 'Cheque Account', accountNumber: '1000', balance: 10000, statementBalance: 10500 },
  { id: 'acc-2', name: 'Savings Account', accountNumber: '1010', balance: 50000, statementBalance: 50000 },
];

const mockShowToast = vi.hoisted(() => vi.fn());
const mockCreateMutate = vi.fn();

vi.mock('../hooks/useBank', () => ({
  useBankAccounts: () => ({
    data: mockAccounts,
    isLoading: false,
  }),
}));

vi.mock('../hooks/useBankTransactions', () => ({
  useCreateBankTransaction: () => ({
    mutate: mockCreateMutate,
    isPending: false,
  }),
}));

vi.mock('../../../dashboard/components/ToastContainer', () => ({
  showToast: mockShowToast,
}));

vi.mock('../../../../components/layout/PageContainer', () => ({
  PageContainer: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-testid="page-container">
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...rest }: Record<string, unknown>) => (
    <a href={to as string} {...rest}>{children as React.ReactNode}</a>
  ),
}));

vi.mock('../../../../components/ui/Button', () => ({
  Button: (props: Record<string, unknown>) => (
    <button
      type={((props.type as string) || 'button') as 'button' | 'submit' | 'reset'}
      onClick={props.onClick as () => void}
      disabled={!!props.disabled || !!props.loading}
      data-testid={props['data-testid'] as string}
    >
      {props.children as React.ReactNode}
    </button>
  ),
}));

vi.mock('../components/MoneyForm', () => ({
  MoneyForm: ({ type, onSubmit, isLoading }: { type: 'spend' | 'receive'; onSubmit: (data: unknown) => void; isLoading: boolean }) => (
    <div data-testid="money-form" data-type={type} data-loading={isLoading}>
      <button
        data-testid="mock-submit"
        onClick={() => onSubmit({
          date: '2026-02-16',
          payee: 'Client B',
          accountId: 'acc-1',
          amount: '1500',
          taxRate: '15',
          reference: 'REF-002',
          description: 'Invoice payment',
        })}
      >
        Submit
      </button>
    </div>
  ),
}));

import { ReceiveMoneyPage } from '../routes/ReceiveMoneyPage';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ReceiveMoneyPage', () => {
  it('renders page title', () => {
    render(<ReceiveMoneyPage />);
    expect(screen.getByText('Receive Money')).toBeInTheDocument();
  });

  it('renders within page container', () => {
    render(<ReceiveMoneyPage />);
    expect(screen.getByTestId('receive-money-page')).toBeInTheDocument();
  });

  it('shows step 1 with account radio selector initially', () => {
    render(<ReceiveMoneyPage />);
    expect(screen.getByTestId('receive-step-1')).toBeInTheDocument();
    expect(screen.getByText('Select Bank Account')).toBeInTheDocument();
    expect(screen.getByTestId('account-radio-group')).toBeInTheDocument();
  });

  it('renders radio buttons for each bank account', () => {
    render(<ReceiveMoneyPage />);
    expect(screen.getByTestId('account-radio-acc-1')).toBeInTheDocument();
    expect(screen.getByTestId('account-radio-acc-2')).toBeInTheDocument();
  });

  it('renders Cancel and Next buttons on step 1', () => {
    render(<ReceiveMoneyPage />);
    expect(screen.getByTestId('receive-cancel-btn')).toBeInTheDocument();
    expect(screen.getByTestId('receive-next-btn')).toBeInTheDocument();
  });

  it('Next button is disabled when no account selected', () => {
    render(<ReceiveMoneyPage />);
    expect(screen.getByTestId('receive-next-btn')).toBeDisabled();
  });

  it('advances to step 2 when account selected and Next clicked', () => {
    render(<ReceiveMoneyPage />);
    fireEvent.click(screen.getByTestId('account-radio-acc-1'));
    fireEvent.click(screen.getByTestId('receive-next-btn'));
    expect(screen.getByTestId('receive-step-2')).toBeInTheDocument();
    expect(screen.getByTestId('money-form')).toBeInTheDocument();
    expect(screen.queryByTestId('receive-step-1')).not.toBeInTheDocument();
  });

  it('renders money form with receive type on step 2', () => {
    render(<ReceiveMoneyPage />);
    fireEvent.click(screen.getByTestId('account-radio-acc-1'));
    fireEvent.click(screen.getByTestId('receive-next-btn'));
    const form = screen.getByTestId('money-form');
    expect(form.getAttribute('data-type')).toBe('receive');
  });

  it('calls mutate with positive amount on submit', () => {
    render(<ReceiveMoneyPage />);
    fireEvent.click(screen.getByTestId('account-radio-acc-1'));
    fireEvent.click(screen.getByTestId('receive-next-btn'));
    screen.getByTestId('mock-submit').click();
    expect(mockCreateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: 'acc-1',
        amount: 1500,
        description: 'Invoice payment',
      }),
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    );
  });

  it('calls showToast with success after creation', () => {
    mockCreateMutate.mockImplementationOnce((_data: unknown, callbacks: { onSuccess: () => void }) => {
      callbacks.onSuccess();
    });
    render(<ReceiveMoneyPage />);
    fireEvent.click(screen.getByTestId('account-radio-acc-1'));
    fireEvent.click(screen.getByTestId('receive-next-btn'));
    screen.getByTestId('mock-submit').click();
    expect(mockShowToast).toHaveBeenCalledWith('success', 'Transaction recorded');
  });

  it('calls showToast with error on failure', () => {
    mockCreateMutate.mockImplementationOnce((_data: unknown, callbacks: { onError: (err: Error) => void }) => {
      callbacks.onError(new Error('Network error'));
    });
    render(<ReceiveMoneyPage />);
    fireEvent.click(screen.getByTestId('account-radio-acc-1'));
    fireEvent.click(screen.getByTestId('receive-next-btn'));
    screen.getByTestId('mock-submit').click();
    expect(mockShowToast).toHaveBeenCalledWith('error', 'Network error');
  });

  it('Cancel button links back to bank page', () => {
    render(<ReceiveMoneyPage />);
    const cancelLink = screen.getByTestId('receive-cancel-btn').closest('a');
    expect(cancelLink).toHaveAttribute('href', '/bank');
  });
});
