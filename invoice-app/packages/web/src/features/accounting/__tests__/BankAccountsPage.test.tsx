// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BankAccountsPage } from '../routes/AccountingPage';

// Mock TanStack Router — Link renders as a plain <a> with href
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...rest }: Record<string, unknown>) => (
    <a href={to as string} {...rest}>{children as React.ReactNode}</a>
  ),
  useNavigate: () => vi.fn(),
}));

const MOCK_API_ACCOUNTS = [
  { id: '1', code: '4-0000', name: 'Sales', type: 'revenue', taxType: 'output', isArchived: false },
  { id: '2', code: '1-0000', name: 'Business Cheque Account', type: 'asset', taxType: 'none', isArchived: false },
  { id: '3', code: '1-0100', name: 'Business Savings', type: 'asset', taxType: 'none', isArchived: false },
  { id: '4', code: '1-0200', name: 'Credit Card', type: 'asset', taxType: 'none', isArchived: false },
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

describe('BankAccountsPage', () => {
  it('renders the page title', () => {
    render(<BankAccountsPage />, { wrapper: createWrapper() });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Bank Accounts');
  });

  it('renders bank account cards after loading (asset-type accounts)', async () => {
    render(<BankAccountsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Business Cheque Account')).toBeInTheDocument();
    });
    expect(screen.getByText('Business Savings')).toBeInTheDocument();
    expect(screen.getByText('Credit Card')).toBeInTheDocument();
  });

  it('renders account codes as account numbers', async () => {
    render(<BankAccountsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('1-0000')).toBeInTheDocument();
    });
    expect(screen.getByText('1-0100')).toBeInTheDocument();
    expect(screen.getByText('1-0200')).toBeInTheDocument();
  });

  it('does not show non-asset accounts', async () => {
    render(<BankAccountsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Business Cheque Account')).toBeInTheDocument();
    });

    // Revenue account should not appear
    expect(screen.queryByText('Sales')).not.toBeInTheDocument();
  });

  it('renders breadcrumbs', () => {
    render(<BankAccountsPage />, { wrapper: createWrapper() });
    const breadcrumbNav = screen.getByLabelText('Breadcrumb');
    expect(breadcrumbNav).toBeInTheDocument();
    expect(screen.getByText('Accounting')).toBeInTheDocument();
  });

  it('renders cards in a grid layout', async () => {
    const { container } = render(<BankAccountsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Business Cheque Account')).toBeInTheDocument();
    });

    // The grid container should exist
    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
  });

  it('calls fetch with /api/accounts endpoint', async () => {
    render(<BankAccountsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/accounts', expect.anything());
    });
  });
});
