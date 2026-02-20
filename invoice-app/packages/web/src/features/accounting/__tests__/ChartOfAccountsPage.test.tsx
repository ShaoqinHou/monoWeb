// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChartOfAccountsPage } from '../routes/AccountingPage';

// Mock TanStack Router — Link renders as a plain <a> with href
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...rest }: Record<string, unknown>) => (
    <a href={to as string} {...rest}>{children as React.ReactNode}</a>
  ),
  useNavigate: () => vi.fn(),
}));

const MOCK_API_ACCOUNTS = [
  { id: '1', code: '4-0000', name: 'Sales', type: 'revenue', taxType: 'output', isArchived: false },
  { id: '2', code: '4-0100', name: 'Other Revenue', type: 'revenue', taxType: 'output', isArchived: false },
  { id: '3', code: '5-0000', name: 'Cost of Goods Sold', type: 'expense', taxType: 'input', isArchived: false },
  { id: '4', code: '6-0100', name: 'Advertising', type: 'expense', taxType: 'input', isArchived: false },
  { id: '5', code: '6-0300', name: 'Rent', type: 'expense', taxType: 'input', isArchived: false },
  { id: '6', code: '1-0000', name: 'Bank Account', type: 'asset', taxType: 'none', isArchived: false },
  { id: '7', code: '1-1000', name: 'Equipment', type: 'asset', taxType: 'none', isArchived: false },
  { id: '8', code: '2-0000', name: 'Accounts Payable', type: 'liability', taxType: 'none', isArchived: false },
  { id: '9', code: '3-0000', name: 'Retained Earnings', type: 'equity', taxType: 'none', isArchived: false },
];

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ ok: true, data: MOCK_API_ACCOUNTS }),
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  vi.restoreAllMocks();
});

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

describe('ChartOfAccountsPage', () => {
  it('renders the page title', async () => {
    render(<ChartOfAccountsPage />, { wrapper: createWrapper() });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Chart of accounts');
  });

  it('renders the "Add Account" button', () => {
    render(<ChartOfAccountsPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Add Account')).toBeInTheDocument();
  });

  it('renders account type sections after loading', async () => {
    render(<ChartOfAccountsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      // "Revenue" appears as both a tab label and an account group heading
      expect(screen.getAllByText('Revenue').length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText('Expenses').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Assets').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Liabilities').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Equity').length).toBeGreaterThan(0);
  });

  it('renders accounts grouped by type', async () => {
    render(<ChartOfAccountsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Sales')).toBeInTheDocument();
    });

    // Revenue accounts
    expect(screen.getByText('4-0000')).toBeInTheDocument();
    expect(screen.getByText('Other Revenue')).toBeInTheDocument();

    // Expense accounts
    expect(screen.getByText('Advertising')).toBeInTheDocument();
    expect(screen.getByText('Rent')).toBeInTheDocument();

    // Asset accounts
    expect(screen.getByText('Bank Account')).toBeInTheDocument();
    expect(screen.getByText('Equipment')).toBeInTheDocument();

    // Liability accounts
    expect(screen.getByText('Accounts Payable')).toBeInTheDocument();

    // Equity accounts
    expect(screen.getByText('Retained Earnings')).toBeInTheDocument();
  });

  it('filters accounts by tab (Revenue tab shows only revenue accounts)', async () => {
    const user = userEvent.setup();
    render(<ChartOfAccountsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Sales')).toBeInTheDocument();
    });

    // Click the Revenue tab
    await user.click(screen.getByTestId('coa-tab-revenue'));

    // Revenue accounts should still be visible
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('Other Revenue')).toBeInTheDocument();

    // Non-revenue accounts should not be visible
    expect(screen.queryByText('Advertising')).not.toBeInTheDocument();
    expect(screen.queryByText('Bank Account')).not.toBeInTheDocument();
  });

  it('search filters accounts by name or code', async () => {
    const user = userEvent.setup();
    render(<ChartOfAccountsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Sales')).toBeInTheDocument();
    });

    // Type in the search box
    await user.type(screen.getByPlaceholderText('Search accounts'), 'Rent');

    // Only Rent should be visible
    expect(screen.getByText('Rent')).toBeInTheDocument();
    expect(screen.queryByText('Sales')).not.toBeInTheDocument();
  });

  it('renders breadcrumbs with Settings prefix', () => {
    render(<ChartOfAccountsPage />, { wrapper: createWrapper() });
    const breadcrumbNav = screen.getByLabelText('Breadcrumb');
    expect(breadcrumbNav).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('calls fetch with /api/accounts endpoint', async () => {
    render(<ChartOfAccountsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/accounts', expect.anything());
    });
  });
});
