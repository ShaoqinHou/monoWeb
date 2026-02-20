// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('lucide-react', () => {
  const icon = (name: string) => {
    const Icon = (props: Record<string, unknown>) => <span data-testid={`icon-${name}`} {...props} />;
    Icon.displayName = name;
    return Icon;
  };
  return {
    ChevronRight: icon('ChevronRight'),
    ChevronDown: icon('ChevronDown'),
    Download: icon('Download'),
    Loader2: icon('Loader2'),
    Plus: icon('Plus'),
    CheckCircle2: icon('CheckCircle2'),
    AlertCircle: icon('AlertCircle'),
    AlertTriangle: icon('AlertTriangle'),
    X: icon('X'),
    Search: icon('Search'),
  };
});

// Mock useAccounts so it returns empty (falls back to DEFAULT_ACCOUNTS)
vi.mock('../../accounting/hooks/useAccounts', () => ({
  useAccounts: () => ({ data: undefined, isLoading: false }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

/** Helper: select an account by typing into the Combobox and clicking the option */
function selectAccount(label: string) {
  const combobox = screen.getByLabelText('Account');
  fireEvent.click(combobox);
  fireEvent.change(combobox, { target: { value: label } });
  const option = screen.getByRole('option', { name: new RegExp(label, 'i') });
  fireEvent.click(option);
}

import { AccountTransactionsPage } from '../routes/AccountTransactionsPage';

describe('AccountTransactionsPage', () => {
  it('renders the page title', () => {
    render(<AccountTransactionsPage />, { wrapper: createWrapper() });
    const titles = screen.getAllByText('Account Transactions');
    expect(titles.length).toBeGreaterThan(0);
  });

  it('renders breadcrumb navigation with Reports link', () => {
    render(<AccountTransactionsPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('renders account combobox with label', () => {
    render(<AccountTransactionsPage />, { wrapper: createWrapper() });
    expect(screen.getByLabelText('Account')).toBeInTheDocument();
    // Should be a combobox (search-select), not a plain select
    expect(screen.getByLabelText('Account')).toHaveAttribute('role', 'combobox');
  });

  it('renders date range inputs', () => {
    render(<AccountTransactionsPage />, { wrapper: createWrapper() });
    expect(screen.getByLabelText('From')).toBeInTheDocument();
    expect(screen.getByLabelText('To')).toBeInTheDocument();
  });

  it('shows "Select an account" message before selection', () => {
    render(<AccountTransactionsPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Select an account to view transactions')).toBeInTheDocument();
  });

  it('shows transactions table when account is selected via combobox', () => {
    render(<AccountTransactionsPage />, { wrapper: createWrapper() });
    selectAccount('200 - Sales');
    expect(screen.getByText('Invoice #INV-001')).toBeInTheDocument();
    expect(screen.getByText('Payment received')).toBeInTheDocument();
    expect(screen.getByText('Bill #BILL-042')).toBeInTheDocument();
    expect(screen.getByText('Journal #JNL-007')).toBeInTheDocument();
    expect(screen.getByText('Invoice #INV-015')).toBeInTheDocument();
  });

  it('renders table headers for transaction columns', () => {
    render(<AccountTransactionsPage />, { wrapper: createWrapper() });
    selectAccount('200 - Sales');
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Reference')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Debit')).toBeInTheDocument();
    expect(screen.getByText('Credit')).toBeInTheDocument();
    expect(screen.getByText('Balance')).toBeInTheDocument();
  });

  it('renders references with monospace style', () => {
    render(<AccountTransactionsPage />, { wrapper: createWrapper() });
    selectAccount('200 - Sales');
    const ref = screen.getByText('INV-001');
    expect(ref.className).toContain('font-mono');
  });

  it('updates subtitle with selected account info', () => {
    render(<AccountTransactionsPage />, { wrapper: createWrapper() });
    selectAccount('200 - Sales');
    // Subtitle includes account code/name and date range
    expect(screen.getAllByText(/200 - Sales/).length).toBeGreaterThan(0);
  });

  it('switches between different accounts', () => {
    render(<AccountTransactionsPage />, { wrapper: createWrapper() });
    selectAccount('200 - Sales');
    expect(screen.getAllByText(/200 - Sales/).length).toBeGreaterThan(0);

    selectAccount('404 - Bank Fees');
    expect(screen.getAllByText(/404 - Bank Fees/).length).toBeGreaterThan(0);
  });

  it('changes from date when user modifies input', () => {
    render(<AccountTransactionsPage />, { wrapper: createWrapper() });
    const fromInput = screen.getByLabelText('From');
    fireEvent.change(fromInput, { target: { value: '2026-06-01' } });
    expect(fromInput).toHaveValue('2026-06-01');
  });

  it('changes to date when user modifies input', () => {
    render(<AccountTransactionsPage />, { wrapper: createWrapper() });
    const toInput = screen.getByLabelText('To');
    fireEvent.change(toInput, { target: { value: '2026-06-30' } });
    expect(toInput).toHaveValue('2026-06-30');
  });
});
