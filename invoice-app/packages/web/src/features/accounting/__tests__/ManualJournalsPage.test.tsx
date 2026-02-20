// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ManualJournalsPage } from '../routes/AccountingPage';

// Mock TanStack Router — Link renders as a plain <a> with href
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...rest }: Record<string, unknown>) => (
    <a href={to as string} {...rest}>{children as React.ReactNode}</a>
  ),
  useNavigate: () => vi.fn(),
}));

const MOCK_JOURNALS = [
  {
    id: 'j-1',
    date: '2024-01-15',
    narration: 'Monthly depreciation',
    status: 'posted',
    lines: [
      { id: 'jl-1', accountId: '4', accountName: 'Advertising', description: 'Depreciation charge', debit: 500, credit: 0 },
      { id: 'jl-2', accountId: '10', accountName: 'Equipment', description: 'Accumulated depreciation', debit: 0, credit: 500 },
    ],
  },
  {
    id: 'j-2',
    date: '2024-01-20',
    narration: 'Accrued wages',
    status: 'posted',
    lines: [
      { id: 'jl-3', accountId: '7', accountName: 'Wages and Salaries', description: 'Jan wages accrual', debit: 3000, credit: 0 },
      { id: 'jl-4', accountId: '11', accountName: 'Accounts Payable', description: 'Wages payable', debit: 0, credit: 3000 },
    ],
  },
  {
    id: 'j-3',
    date: '2024-02-01',
    narration: 'Prepaid rent adjustment',
    status: 'draft',
    lines: [
      { id: 'jl-5', accountId: '6', accountName: 'Rent', description: 'Feb rent expense', debit: 2000, credit: 0 },
      { id: 'jl-6', accountId: '8', accountName: 'Bank Account', description: 'Rent prepayment', debit: 0, credit: 2000 },
    ],
  },
];

const MOCK_ACCOUNTS = [
  { id: '1', code: '4-0000', name: 'Sales', type: 'revenue', taxType: 'output', isArchived: false },
  { id: '2', code: '6-0100', name: 'Advertising', type: 'expense', taxType: 'input', isArchived: false },
];

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn().mockImplementation((url: string) => {
    if (url.includes('/api/journals')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ ok: true, data: MOCK_JOURNALS }),
      });
    }
    if (url.includes('/api/accounts')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ ok: true, data: MOCK_ACCOUNTS }),
      });
    }
    return Promise.resolve({
      ok: true,
      json: async () => ({ ok: true, data: [] }),
    });
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

describe('ManualJournalsPage', () => {
  it('renders the page title', () => {
    render(<ManualJournalsPage />, { wrapper: createWrapper() });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Manual journals');
  });

  it('renders the "New Journal" button', () => {
    render(<ManualJournalsPage />, { wrapper: createWrapper() });
    expect(screen.getByText('New Journal')).toBeInTheDocument();
  });

  it('renders journal entries after loading', async () => {
    render(<ManualJournalsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Monthly depreciation')).toBeInTheDocument();
    });
    expect(screen.getByText('Accrued wages')).toBeInTheDocument();
    expect(screen.getByText('Prepaid rent adjustment')).toBeInTheDocument();
  });

  it('renders journal dates', async () => {
    render(<ManualJournalsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('2024-01-15')).toBeInTheDocument();
    });
    expect(screen.getByText('2024-01-20')).toBeInTheDocument();
    expect(screen.getByText('2024-02-01')).toBeInTheDocument();
  });

  it('does not render status column in the table', async () => {
    render(<ManualJournalsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Monthly depreciation')).toBeInTheDocument();
    });
    // Table headers should not include "Status"
    const table = screen.getByTestId('journal-table');
    const headers = table.querySelectorAll('th');
    const headerTexts = Array.from(headers).map((h) => h.textContent);
    expect(headerTexts).not.toContain('Status');
  });

  it('shows "No items selected" when no checkboxes are checked', async () => {
    render(<ManualJournalsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Monthly depreciation')).toBeInTheDocument();
    });
    expect(screen.getByTestId('journal-selection-info')).toHaveTextContent('No items selected');
  });

  it('shows selection count when checkboxes are checked', async () => {
    const user = userEvent.setup();
    render(<ManualJournalsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Monthly depreciation')).toBeInTheDocument();
    });

    const checkbox = screen.getByLabelText('Select Monthly depreciation');
    await user.click(checkbox);
    expect(screen.getByTestId('journal-selection-info')).toHaveTextContent('1 item selected');
  });

  it('shows journal entry form when "New Journal" is clicked', async () => {
    const user = userEvent.setup();
    render(<ManualJournalsPage />, { wrapper: createWrapper() });

    await user.click(screen.getByText('New Journal'));

    expect(screen.getByText('New Journal Entry')).toBeInTheDocument();
    expect(screen.getByLabelText('Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Narration')).toBeInTheDocument();
  });

  it('hides "New Journal" button when form is shown', async () => {
    const user = userEvent.setup();
    render(<ManualJournalsPage />, { wrapper: createWrapper() });

    await user.click(screen.getByText('New Journal'));

    // The "New Journal" action button should not be visible
    // (the heading "New Journal Entry" is different from the button)
    const buttons = screen.queryAllByRole('button');
    const newJournalButton = buttons.find(
      (b) => b.textContent === 'New Journal' && b.closest('[class*="actions"]'),
    );
    expect(newJournalButton).toBeUndefined();
  });

  it('hides form when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<ManualJournalsPage />, { wrapper: createWrapper() });

    await user.click(screen.getByText('New Journal'));
    expect(screen.getByText('New Journal Entry')).toBeInTheDocument();

    await user.click(screen.getByText('Cancel'));
    expect(screen.queryByText('New Journal Entry')).not.toBeInTheDocument();
  });

  it('renders breadcrumbs', () => {
    render(<ManualJournalsPage />, { wrapper: createWrapper() });
    const breadcrumbNav = screen.getByLabelText('Breadcrumb');
    expect(breadcrumbNav).toBeInTheDocument();
    expect(screen.getByText('Accounting')).toBeInTheDocument();
  });

  it('calls fetch with /api/journals endpoint', async () => {
    render(<ManualJournalsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/journals', expect.anything());
    });
  });
});
