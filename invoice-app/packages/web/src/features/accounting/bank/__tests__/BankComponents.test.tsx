import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BankAccountSelector } from '../components/BankAccountSelector';
import { MatchSuggestion } from '../components/MatchSuggestion';
import type { BankAccount, MatchSuggestionData } from '../types';

const mockAccounts: BankAccount[] = [
  {
    id: 'acc-1',
    name: 'Cheque Account',
    accountNumber: '12-3456-0001',
    balance: 10000,
    statementBalance: 10500,
  },
  {
    id: 'acc-2',
    name: 'Savings Account',
    accountNumber: '12-3456-0002',
    balance: 50000,
    statementBalance: 50000,
  },
];

const mockSuggestion: MatchSuggestionData = {
  type: 'invoice',
  id: 'inv-99',
  reference: 'INV-0099',
  amount: 1500,
  contact: 'Test Client',
  confidence: 0.92,
};

describe('BankAccountSelector', () => {
  it('renders the label', () => {
    render(
      <BankAccountSelector
        accounts={mockAccounts}
        selectedAccountId="acc-1"
        onAccountChange={() => {}}
        isLoading={false}
      />,
    );
    expect(screen.getByText('Bank Account')).toBeInTheDocument();
  });

  it('renders account options', () => {
    render(
      <BankAccountSelector
        accounts={mockAccounts}
        selectedAccountId="acc-1"
        onAccountChange={() => {}}
        isLoading={false}
      />,
    );
    expect(screen.getByText('Cheque Account (12-3456-0001)')).toBeInTheDocument();
    expect(screen.getByText('Savings Account (12-3456-0002)')).toBeInTheDocument();
  });

  it('shows balance comparison for selected account', () => {
    render(
      <BankAccountSelector
        accounts={mockAccounts}
        selectedAccountId="acc-1"
        onAccountChange={() => {}}
        isLoading={false}
      />,
    );
    expect(screen.getByTestId('balance-comparison')).toBeInTheDocument();
    expect(screen.getByText(/Statement Balance/)).toBeInTheDocument();
    expect(screen.getByText(/Xero Balance/)).toBeInTheDocument();
  });

  it('shows difference when balances do not match', () => {
    render(
      <BankAccountSelector
        accounts={mockAccounts}
        selectedAccountId="acc-1"
        onAccountChange={() => {}}
        isLoading={false}
      />,
    );
    expect(screen.getByText(/Difference/)).toBeInTheDocument();
    expect(screen.getByText('$500.00')).toBeInTheDocument();
  });

  it('does not show difference when balances match', () => {
    render(
      <BankAccountSelector
        accounts={mockAccounts}
        selectedAccountId="acc-2"
        onAccountChange={() => {}}
        isLoading={false}
      />,
    );
    expect(screen.queryByText(/Difference/)).not.toBeInTheDocument();
  });

  it('calls onAccountChange when selection changes', () => {
    const onChange = vi.fn();
    render(
      <BankAccountSelector
        accounts={mockAccounts}
        selectedAccountId="acc-1"
        onAccountChange={onChange}
        isLoading={false}
      />,
    );
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'acc-2' } });
    expect(onChange).toHaveBeenCalledWith('acc-2');
  });

  it('disables select when loading', () => {
    render(
      <BankAccountSelector
        accounts={undefined}
        selectedAccountId=""
        onAccountChange={() => {}}
        isLoading={true}
      />,
    );
    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
  });
});

describe('MatchSuggestion', () => {
  it('renders suggestion details', () => {
    render(
      <MatchSuggestion
        suggestion={mockSuggestion}
        onMatch={() => {}}
        isMatching={false}
      />,
    );
    expect(screen.getByText('Invoice')).toBeInTheDocument();
    expect(screen.getByText('INV-0099')).toBeInTheDocument();
    expect(screen.getByText('Test Client')).toBeInTheDocument();
    expect(screen.getByText('$1,500.00')).toBeInTheDocument();
    expect(screen.getByText('92% match')).toBeInTheDocument();
  });

  it('renders Match button', () => {
    render(
      <MatchSuggestion
        suggestion={mockSuggestion}
        onMatch={() => {}}
        isMatching={false}
      />,
    );
    expect(screen.getByText('Match')).toBeInTheDocument();
  });

  it('calls onMatch when Match button is clicked', () => {
    const onMatch = vi.fn();
    render(
      <MatchSuggestion
        suggestion={mockSuggestion}
        onMatch={onMatch}
        isMatching={false}
      />,
    );
    fireEvent.click(screen.getByText('Match'));
    expect(onMatch).toHaveBeenCalledWith(mockSuggestion);
  });

  it('shows loading state when matching', () => {
    render(
      <MatchSuggestion
        suggestion={mockSuggestion}
        onMatch={() => {}}
        isMatching={true}
      />,
    );
    expect(screen.getByTestId('button-spinner')).toBeInTheDocument();
  });

  it('renders Bill badge for bill type', () => {
    const billSuggestion: MatchSuggestionData = {
      ...mockSuggestion,
      type: 'bill',
      reference: 'BILL-0050',
    };
    render(
      <MatchSuggestion
        suggestion={billSuggestion}
        onMatch={() => {}}
        isMatching={false}
      />,
    );
    expect(screen.getByText('Bill')).toBeInTheDocument();
    expect(screen.getByText('BILL-0050')).toBeInTheDocument();
  });
});
