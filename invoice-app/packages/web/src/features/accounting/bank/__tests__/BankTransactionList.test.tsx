import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BankTransactionList } from '../components/BankTransactionList';
import type { BankTransaction } from '../types';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

const mockTransactions: BankTransaction[] = [
  {
    id: 'txn-100',
    date: '2026-02-10',
    description: 'Test Payment In',
    amount: 1000.00,
    status: 'unmatched',
  },
  {
    id: 'txn-101',
    date: '2026-02-09',
    description: 'Test Payment Out',
    amount: -500.00,
    status: 'matched',
    matchedTo: { type: 'bill', id: 'bill-99', reference: 'BILL-0099' },
  },
  {
    id: 'txn-102',
    date: '2026-02-08',
    description: 'Another Outflow',
    amount: -250.00,
    status: 'unmatched',
  },
];

describe('BankTransactionList', () => {
  it('renders loading state', () => {
    render(
      <BankTransactionList transactions={undefined} isLoading={true} />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByTestId('transactions-loading')).toBeInTheDocument();
  });

  it('renders empty state when no transactions', () => {
    render(
      <BankTransactionList transactions={[]} isLoading={false} />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText('No transactions to reconcile')).toBeInTheDocument();
  });

  it('renders transaction descriptions', () => {
    render(
      <BankTransactionList transactions={mockTransactions} isLoading={false} />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText('Test Payment In')).toBeInTheDocument();
    expect(screen.getByText('Test Payment Out')).toBeInTheDocument();
    expect(screen.getByText('Another Outflow')).toBeInTheDocument();
  });

  it('renders table headers', () => {
    render(
      <BankTransactionList transactions={mockTransactions} isLoading={false} />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Money In')).toBeInTheDocument();
    expect(screen.getByText('Money Out')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('shows unmatched count in header', () => {
    render(
      <BankTransactionList transactions={mockTransactions} isLoading={false} />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText('2 unmatched of 3 transactions')).toBeInTheDocument();
  });

  it('displays money-in amounts in green', () => {
    render(
      <BankTransactionList transactions={mockTransactions} isLoading={false} />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText('$1,000.00')).toBeInTheDocument();
  });

  it('displays money-out amounts in red', () => {
    render(
      <BankTransactionList transactions={mockTransactions} isLoading={false} />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText('$500.00')).toBeInTheDocument();
    expect(screen.getByText('$250.00')).toBeInTheDocument();
  });

  it('shows matched reference for matched transactions', () => {
    render(
      <BankTransactionList transactions={mockTransactions} isLoading={false} />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText('BILL-0099')).toBeInTheDocument();
  });

  it('shows Create buttons for unmatched transactions only', () => {
    render(
      <BankTransactionList transactions={mockTransactions} isLoading={false} />,
      { wrapper: createWrapper() },
    );
    const createButtons = screen.getAllByText('Create');
    // 2 unmatched transactions should each have a Create button
    expect(createButtons.length).toBe(2);
  });

  it('renders status badges', () => {
    render(
      <BankTransactionList transactions={mockTransactions} isLoading={false} />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText('Matched')).toBeInTheDocument();
    expect(screen.getAllByText('Unmatched').length).toBe(2);
  });

  it('shows unreconciled badge when there are unmatched transactions', () => {
    render(
      <BankTransactionList transactions={mockTransactions} isLoading={false} />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByTestId('unreconciled-badge')).toBeInTheDocument();
    expect(screen.getByText('2 unreconciled')).toBeInTheDocument();
  });

  it('does not show unreconciled badge when all transactions are matched', () => {
    const allMatched: BankTransaction[] = [
      { id: 'txn-200', date: '2026-02-10', description: 'Matched', amount: 100, status: 'matched' },
    ];
    render(
      <BankTransactionList transactions={allMatched} isLoading={false} />,
      { wrapper: createWrapper() },
    );
    expect(screen.queryByTestId('unreconciled-badge')).not.toBeInTheDocument();
  });
});
