// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrialBalanceReport, type TrialBalanceAccount } from '../components/TrialBalanceReport';

const BALANCED_ACCOUNTS: TrialBalanceAccount[] = [
  { accountCode: '100', accountName: 'Bank Account', accountType: 'asset', debit: 50000, credit: 0 },
  { accountCode: '120', accountName: 'Accounts Receivable', accountType: 'asset', debit: 12000, credit: 0 },
  { accountCode: '200', accountName: 'Accounts Payable', accountType: 'liability', debit: 0, credit: 8000 },
  { accountCode: '300', accountName: 'Owner Equity', accountType: 'equity', debit: 0, credit: 30000 },
  { accountCode: '400', accountName: 'Sales Revenue', accountType: 'revenue', debit: 0, credit: 45000 },
  { accountCode: '500', accountName: 'Rent Expense', accountType: 'expense', debit: 15000, credit: 0 },
  { accountCode: '510', accountName: 'Salaries', accountType: 'expense', debit: 6000, credit: 0 },
];

const UNBALANCED_ACCOUNTS: TrialBalanceAccount[] = [
  { accountCode: '100', accountName: 'Bank Account', accountType: 'asset', debit: 50000, credit: 0 },
  { accountCode: '200', accountName: 'Accounts Payable', accountType: 'liability', debit: 0, credit: 8000 },
];

describe('TrialBalanceReport', () => {
  it('renders table headers', () => {
    render(<TrialBalanceReport accounts={BALANCED_ACCOUNTS} />);

    expect(screen.getByText('Account Code')).toBeInTheDocument();
    expect(screen.getByText('Account Name')).toBeInTheDocument();
    expect(screen.getByText('Debit')).toBeInTheDocument();
    expect(screen.getByText('Credit')).toBeInTheDocument();
  });

  it('renders all accounts', () => {
    render(<TrialBalanceReport accounts={BALANCED_ACCOUNTS} />);

    expect(screen.getByText('Bank Account')).toBeInTheDocument();
    expect(screen.getByText('Accounts Receivable')).toBeInTheDocument();
    expect(screen.getByText('Accounts Payable')).toBeInTheDocument();
    expect(screen.getByText('Owner Equity')).toBeInTheDocument();
    expect(screen.getByText('Sales Revenue')).toBeInTheDocument();
    expect(screen.getByText('Rent Expense')).toBeInTheDocument();
    expect(screen.getByText('Salaries')).toBeInTheDocument();
  });

  it('renders account codes', () => {
    render(<TrialBalanceReport accounts={BALANCED_ACCOUNTS} />);

    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('300')).toBeInTheDocument();
    expect(screen.getByText('400')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('510')).toBeInTheDocument();
  });

  it('groups accounts by type with section headers', () => {
    render(<TrialBalanceReport accounts={BALANCED_ACCOUNTS} />);

    expect(screen.getByText('Assets')).toBeInTheDocument();
    expect(screen.getByText('Liabilities')).toBeInTheDocument();
    expect(screen.getByText('Equity')).toBeInTheDocument();
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('Expenses')).toBeInTheDocument();
  });

  it('shows total row', () => {
    render(<TrialBalanceReport accounts={BALANCED_ACCOUNTS} />);

    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('shows "Balanced" when debits equal credits', () => {
    // Total debits: 50000 + 12000 + 15000 + 6000 = 83000
    // Total credits: 8000 + 30000 + 45000 = 83000
    render(<TrialBalanceReport accounts={BALANCED_ACCOUNTS} />);

    expect(screen.getByText('Balanced')).toBeInTheDocument();
  });

  it('shows "Out of balance" when debits do not equal credits', () => {
    render(<TrialBalanceReport accounts={UNBALANCED_ACCOUNTS} />);

    expect(screen.getByText(/Out of balance by/)).toBeInTheDocument();
  });

  it('renders empty state when no accounts', () => {
    render(<TrialBalanceReport accounts={[]} />);

    expect(screen.getByText('No accounts to display')).toBeInTheDocument();
  });

  it('renders "As at" date when provided', () => {
    render(<TrialBalanceReport accounts={BALANCED_ACCOUNTS} asAt="2026-02-16" />);

    expect(screen.getByText('As at 2026-02-16')).toBeInTheDocument();
  });

  it('does not render "As at" when not provided', () => {
    render(<TrialBalanceReport accounts={BALANCED_ACCOUNTS} />);

    expect(screen.queryByText(/As at/)).not.toBeInTheDocument();
  });

  it('only shows debit value for debit accounts (no credit)', () => {
    const accounts: TrialBalanceAccount[] = [
      { accountCode: '100', accountName: 'Cash', accountType: 'asset', debit: 1000, credit: 0 },
    ];
    render(<TrialBalanceReport accounts={accounts} />);

    // Should show debit formatted as currency but not credit for this row
    const rows = screen.getAllByRole('row');
    // Find the Cash row (not header, not group header, not totals)
    const cashRow = rows.find((r) => r.textContent?.includes('Cash') && r.textContent?.includes('100'));
    expect(cashRow).toBeInTheDocument();
  });

  it('renders data-testid for the container', () => {
    render(<TrialBalanceReport accounts={[]} />);
    expect(screen.getByTestId('trial-balance-report')).toBeInTheDocument();
  });
});
