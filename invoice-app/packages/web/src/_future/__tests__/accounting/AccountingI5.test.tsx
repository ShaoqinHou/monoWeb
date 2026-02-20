// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AssetDisposalDialog } from '../components/AssetDisposalDialog';
import { LockDateSettings } from '../components/LockDateSettings';
import { SystemAccountBadge, isSystemAccount } from '../components/SystemAccountBadge';
import { AccountTransactionsPage } from '../routes/AccountTransactionsPage';
import { OpeningBalancesForm } from '../components/OpeningBalancesForm';
import type { FixedAsset } from '../hooks/useFixedAssets';

// --- Test utilities ---

function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

// --- Mock data ---

const MOCK_ASSET: FixedAsset = {
  id: 'a1',
  name: 'Office Laptop',
  assetNumber: 'FA-001',
  purchaseDate: '2024-01-15',
  purchasePrice: 2400,
  depreciationMethod: 'straight_line',
  depreciationRate: 20,
  currentValue: 2000,
  accumulatedDepreciation: 400,
  assetAccountCode: '1-1200',
  depreciationAccountCode: '6-0800',
  status: 'registered',
  disposalDate: null,
  disposalPrice: null,
  createdAt: '2024-01-15T00:00:00.000Z',
};

const MOCK_ACCOUNTS = [
  { code: '100', name: 'Cash' },
  { code: '200', name: 'Accounts Receivable' },
  { code: '300', name: 'Office Equipment' },
];

// --- 1. Asset Disposal Dialog ---

describe('AssetDisposalDialog', () => {
  it('renders dialog with asset name when open', () => {
    render(
      <AssetDisposalDialog
        open={true}
        onClose={vi.fn()}
        asset={MOCK_ASSET}
        onConfirm={vi.fn()}
      />,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Dispose Asset: Office Laptop/)).toBeInTheDocument();
    expect(screen.getByTestId('disposal-date-input')).toBeInTheDocument();
    expect(screen.getByTestId('disposal-price-input')).toBeInTheDocument();
    expect(screen.getByTestId('disposal-method-select')).toBeInTheDocument();
  });

  it('calculates gain/loss preview correctly', async () => {
    const user = userEvent.setup();
    render(
      <AssetDisposalDialog
        open={true}
        onClose={vi.fn()}
        asset={MOCK_ASSET}
        onConfirm={vi.fn()}
      />,
    );

    // Book value = 2400 - 400 = 2000
    // If we sell for 2500, gain = 2500 - 2000 = 500
    await user.type(screen.getByTestId('disposal-price-input'), '2500');

    const gainLossEl = screen.getByTestId('gain-loss-amount');
    expect(gainLossEl).toHaveTextContent('Gain');
    expect(gainLossEl).toHaveTextContent('$500.00');
  });

  it('shows loss when disposal price is below book value', async () => {
    const user = userEvent.setup();
    render(
      <AssetDisposalDialog
        open={true}
        onClose={vi.fn()}
        asset={MOCK_ASSET}
        onConfirm={vi.fn()}
      />,
    );

    // Book value = 2000. Sell for 1500 => loss of 500
    await user.type(screen.getByTestId('disposal-price-input'), '1500');

    const gainLossEl = screen.getByTestId('gain-loss-amount');
    expect(gainLossEl).toHaveTextContent('Loss');
    expect(gainLossEl).toHaveTextContent('$500.00');
  });

  it('calls onConfirm with correct data on submit', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(
      <AssetDisposalDialog
        open={true}
        onClose={vi.fn()}
        asset={MOCK_ASSET}
        onConfirm={onConfirm}
      />,
    );

    await user.type(screen.getByTestId('disposal-date-input'), '2025-06-15');
    await user.type(screen.getByTestId('disposal-price-input'), '1800');
    await user.click(screen.getByTestId('confirm-disposal-btn'));

    expect(onConfirm).toHaveBeenCalledWith({
      date: '2025-06-15',
      price: 1800,
      method: 'sold',
    });
  });
});

// --- 2. Lock Date Settings ---

describe('LockDateSettings', () => {
  it('renders lock date inputs with initial values', () => {
    render(
      <LockDateSettings
        lockDates={{ lockDate: '2025-01-31', advisorLockDate: '2025-02-28' }}
        onSave={vi.fn()}
      />,
    );
    expect(screen.getByTestId('lock-date-settings')).toBeInTheDocument();
    expect(screen.getByTestId('lock-date-input')).toHaveValue('2025-01-31');
    expect(screen.getByTestId('advisor-lock-date-input')).toHaveValue('2025-02-28');
  });

  it('calls onSave with updated lock dates', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(
      <LockDateSettings
        lockDates={{ lockDate: null, advisorLockDate: null }}
        onSave={onSave}
      />,
    );

    await user.type(screen.getByTestId('lock-date-input'), '2025-03-31');
    await user.click(screen.getByTestId('save-lock-dates-btn'));

    expect(onSave).toHaveBeenCalledWith({
      lockDate: '2025-03-31',
      advisorLockDate: null,
    });
  });

  it('renders save button', () => {
    render(
      <LockDateSettings
        lockDates={{ lockDate: null, advisorLockDate: null }}
        onSave={vi.fn()}
      />,
    );
    expect(screen.getByTestId('save-lock-dates-btn')).toHaveTextContent('Save Lock Dates');
  });
});

// --- 3. System Account Badge ---

describe('SystemAccountBadge', () => {
  it('renders badge for system account 610', () => {
    render(<SystemAccountBadge accountCode="610" />);
    expect(screen.getByTestId('system-account-badge')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('renders badge for system account 800', () => {
    render(<SystemAccountBadge accountCode="800" />);
    expect(screen.getByTestId('system-account-badge')).toBeInTheDocument();
  });

  it('does not render badge for non-system account', () => {
    render(<SystemAccountBadge accountCode="100" />);
    expect(screen.queryByTestId('system-account-badge')).not.toBeInTheDocument();
  });

  it('isSystemAccount returns true for all system codes', () => {
    expect(isSystemAccount('610')).toBe(true);
    expect(isSystemAccount('800')).toBe(true);
    expect(isSystemAccount('820')).toBe(true);
    expect(isSystemAccount('310')).toBe(true);
  });

  it('isSystemAccount returns false for regular codes', () => {
    expect(isSystemAccount('100')).toBe(false);
    expect(isSystemAccount('400')).toBe(false);
  });
});

// --- 4. Account Transactions Page ---

describe('AccountTransactionsPage', () => {
  it('renders page with account code and table', () => {
    render(
      <AccountTransactionsPage accountCode="1-1100" />,
      { wrapper: createQueryWrapper() },
    );
    expect(screen.getByTestId('account-transactions-page')).toBeInTheDocument();
    expect(screen.getByText('Account: 1-1100')).toBeInTheDocument();
    expect(screen.getByTestId('date-from-input')).toBeInTheDocument();
    expect(screen.getByTestId('date-to-input')).toBeInTheDocument();
  });

  it('renders transactions table with headers', async () => {
    render(
      <AccountTransactionsPage accountCode="1-1100" />,
      { wrapper: createQueryWrapper() },
    );
    // Wait for async query to resolve
    expect(await screen.findByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Reference')).toBeInTheDocument();
    expect(screen.getByText('Debit')).toBeInTheDocument();
    expect(screen.getByText('Credit')).toBeInTheDocument();
    expect(screen.getByText('Balance')).toBeInTheDocument();
  });
});

// --- 5. Opening Balances Form ---

describe('OpeningBalancesForm', () => {
  it('renders form with all accounts', () => {
    render(
      <OpeningBalancesForm
        accounts={MOCK_ACCOUNTS}
        onSave={vi.fn()}
      />,
    );
    expect(screen.getByTestId('opening-balances-form')).toBeInTheDocument();
    expect(screen.getByText('Cash')).toBeInTheDocument();
    expect(screen.getByText('Accounts Receivable')).toBeInTheDocument();
    expect(screen.getByText('Office Equipment')).toBeInTheDocument();
  });

  it('validates debits equal credits - shows error when unbalanced', async () => {
    const user = userEvent.setup();
    render(
      <OpeningBalancesForm
        accounts={MOCK_ACCOUNTS}
        onSave={vi.fn()}
      />,
    );

    await user.type(screen.getByTestId('debit-100'), '1000');
    expect(screen.getByTestId('balance-error')).toBeInTheDocument();
    expect(screen.getByTestId('save-opening-balances-btn')).toBeDisabled();
  });

  it('enables save when debits equal credits', async () => {
    const user = userEvent.setup();
    render(
      <OpeningBalancesForm
        accounts={MOCK_ACCOUNTS}
        onSave={vi.fn()}
      />,
    );

    await user.type(screen.getByTestId('debit-100'), '1000');
    await user.type(screen.getByTestId('credit-200'), '1000');

    expect(screen.queryByTestId('balance-error')).not.toBeInTheDocument();
    expect(screen.getByTestId('save-opening-balances-btn')).not.toBeDisabled();
  });

  it('calls onSave with all balances when submitted', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(
      <OpeningBalancesForm
        accounts={MOCK_ACCOUNTS}
        onSave={onSave}
      />,
    );

    await user.type(screen.getByTestId('debit-100'), '500');
    await user.type(screen.getByTestId('credit-200'), '500');
    await user.click(screen.getByTestId('save-opening-balances-btn'));

    expect(onSave).toHaveBeenCalledWith([
      { accountCode: '100', accountName: 'Cash', debit: 500, credit: 0 },
      { accountCode: '200', accountName: 'Accounts Receivable', debit: 0, credit: 500 },
      { accountCode: '300', accountName: 'Office Equipment', debit: 0, credit: 0 },
    ]);
  });

  it('shows total debits and credits', async () => {
    const user = userEvent.setup();
    render(
      <OpeningBalancesForm
        accounts={MOCK_ACCOUNTS}
        onSave={vi.fn()}
      />,
    );

    await user.type(screen.getByTestId('debit-100'), '1500');
    expect(screen.getByTestId('total-debits')).toHaveTextContent('$1,500.00');
    expect(screen.getByTestId('total-credits')).toHaveTextContent('$0.00');
  });
});
