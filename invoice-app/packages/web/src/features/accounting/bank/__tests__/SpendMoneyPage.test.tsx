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
          payee: 'Vendor A',
          accountId: 'acc-1',
          amount: '500',
          taxRate: '15',
          reference: 'REF-001',
          description: 'Rent',
        })}
      >
        Submit
      </button>
    </div>
  ),
}));

import { SpendMoneyPage } from '../routes/SpendMoneyPage';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SpendMoneyPage', () => {
  it('renders page title', () => {
    render(<SpendMoneyPage />);
    expect(screen.getByText('Spend Money')).toBeInTheDocument();
  });

  it('renders within page container', () => {
    render(<SpendMoneyPage />);
    expect(screen.getByTestId('spend-money-page')).toBeInTheDocument();
  });

  it('shows step 1 with account radio selector initially', () => {
    render(<SpendMoneyPage />);
    expect(screen.getByTestId('spend-step-1')).toBeInTheDocument();
    expect(screen.getByText('Select Bank Account')).toBeInTheDocument();
    expect(screen.getByTestId('account-radio-group')).toBeInTheDocument();
  });

  it('renders radio buttons for each bank account', () => {
    render(<SpendMoneyPage />);
    expect(screen.getByTestId('account-radio-acc-1')).toBeInTheDocument();
    expect(screen.getByTestId('account-radio-acc-2')).toBeInTheDocument();
    expect(screen.getByText('Cheque Account')).toBeInTheDocument();
    expect(screen.getByText('Savings Account')).toBeInTheDocument();
  });

  it('renders Cancel and Next buttons on step 1', () => {
    render(<SpendMoneyPage />);
    expect(screen.getByTestId('spend-cancel-btn')).toBeInTheDocument();
    expect(screen.getByTestId('spend-next-btn')).toBeInTheDocument();
  });

  it('Next button is disabled when no account selected', () => {
    render(<SpendMoneyPage />);
    expect(screen.getByTestId('spend-next-btn')).toBeDisabled();
  });

  it('advances to step 2 when account selected and Next clicked', () => {
    render(<SpendMoneyPage />);
    // Select an account
    fireEvent.click(screen.getByTestId('account-radio-acc-1'));
    // Click Next
    fireEvent.click(screen.getByTestId('spend-next-btn'));
    // Should now be on step 2
    expect(screen.getByTestId('spend-step-2')).toBeInTheDocument();
    expect(screen.getByTestId('money-form')).toBeInTheDocument();
    expect(screen.queryByTestId('spend-step-1')).not.toBeInTheDocument();
  });

  it('renders money form with spend type on step 2', () => {
    render(<SpendMoneyPage />);
    fireEvent.click(screen.getByTestId('account-radio-acc-1'));
    fireEvent.click(screen.getByTestId('spend-next-btn'));
    const form = screen.getByTestId('money-form');
    expect(form.getAttribute('data-type')).toBe('spend');
  });

  it('calls mutate with negative amount on submit from step 2', () => {
    render(<SpendMoneyPage />);
    fireEvent.click(screen.getByTestId('account-radio-acc-1'));
    fireEvent.click(screen.getByTestId('spend-next-btn'));
    screen.getByTestId('mock-submit').click();
    expect(mockCreateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: 'acc-1',
        amount: -500,
        description: 'Rent',
      }),
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    );
  });

  it('calls showToast with success after successful creation', () => {
    mockCreateMutate.mockImplementationOnce((_data: unknown, callbacks: { onSuccess: () => void }) => {
      callbacks.onSuccess();
    });
    render(<SpendMoneyPage />);
    fireEvent.click(screen.getByTestId('account-radio-acc-1'));
    fireEvent.click(screen.getByTestId('spend-next-btn'));
    screen.getByTestId('mock-submit').click();
    expect(mockShowToast).toHaveBeenCalledWith('success', 'Transaction recorded');
  });

  it('calls showToast with error on failure', () => {
    mockCreateMutate.mockImplementationOnce((_data: unknown, callbacks: { onError: (err: Error) => void }) => {
      callbacks.onError(new Error('Server error'));
    });
    render(<SpendMoneyPage />);
    fireEvent.click(screen.getByTestId('account-radio-acc-1'));
    fireEvent.click(screen.getByTestId('spend-next-btn'));
    screen.getByTestId('mock-submit').click();
    expect(mockShowToast).toHaveBeenCalledWith('error', 'Server error');
  });

  it('Cancel button links back to bank page', () => {
    render(<SpendMoneyPage />);
    const cancelLink = screen.getByTestId('spend-cancel-btn').closest('a');
    expect(cancelLink).toHaveAttribute('href', '/bank');
  });
});
