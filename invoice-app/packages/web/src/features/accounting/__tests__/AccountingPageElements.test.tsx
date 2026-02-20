// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChartOfAccountsPage, ManualJournalsPage } from '../routes/AccountingPage';
import { FixedAssetsPage } from '../routes/FixedAssetsPage';
import { AssuranceDashboardPage } from '../routes/AssuranceDashboardPage';
import { HistoryAndNotesPage } from '../routes/HistoryAndNotesPage';

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...rest }: Record<string, unknown>) => (
    <a href={to as string} {...rest}>{children as React.ReactNode}</a>
  ),
  useNavigate: () => vi.fn(),
}));

const MOCK_API_ACCOUNTS = [
  { id: '1', code: '4-0000', name: 'Sales', type: 'revenue', taxType: 'output', isArchived: false },
  { id: '2', code: '610', name: 'Accounts Receivable', type: 'asset', taxType: 'none', isArchived: false },
  { id: '3', code: '5-0000', name: 'Cost of Goods Sold', type: 'expense', taxType: 'input', isArchived: false },
];

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
    date: '2024-02-01',
    narration: 'Prepaid rent adjustment',
    status: 'draft',
    lines: [
      { id: 'jl-3', accountId: '6', accountName: 'Rent', description: 'Feb rent expense', debit: 2000, credit: 0 },
      { id: 'jl-4', accountId: '8', accountName: 'Bank Account', description: 'Rent prepayment', debit: 0, credit: 2000 },
    ],
  },
];

const MOCK_FIXED_ASSETS = [
  {
    id: 'a1', name: 'Office Laptop', assetNumber: 'FA-0001', purchaseDate: '2025-01-15',
    purchasePrice: 2000, depreciationMethod: 'straight_line', depreciationRate: 25,
    currentValue: 1500, accumulatedDepreciation: 500, assetAccountCode: '1-0500',
    depreciationAccountCode: '6-0300', status: 'draft', disposalDate: null,
    disposalPrice: null, createdAt: '2025-01-15T10:00:00.000Z',
  },
  {
    id: 'a2', name: 'Company Vehicle', assetNumber: 'FA-0002', purchaseDate: '2024-06-01',
    purchasePrice: 35000, depreciationMethod: 'diminishing_value', depreciationRate: 20,
    currentValue: 28000, accumulatedDepreciation: 7000, assetAccountCode: '1-0600',
    depreciationAccountCode: '6-0400', status: 'registered', disposalDate: null,
    disposalPrice: null, createdAt: '2024-06-01T08:00:00.000Z',
  },
];

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn().mockImplementation((url: string) => {
    if (url.includes('/api/journals')) {
      return Promise.resolve({ ok: true, json: async () => ({ ok: true, data: MOCK_JOURNALS }) });
    }
    if (url.includes('/api/accounts')) {
      return Promise.resolve({ ok: true, json: async () => ({ ok: true, data: MOCK_API_ACCOUNTS }) });
    }
    if (url.includes('/api/fixed-assets')) {
      return Promise.resolve({ ok: true, json: async () => ({ ok: true, data: MOCK_FIXED_ASSETS }) });
    }
    return Promise.resolve({ ok: true, json: async () => ({ ok: true, data: [] }) });
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  vi.restoreAllMocks();
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

/* ─── Chart of Accounts ─── */
describe('ChartOfAccountsPage — enhanced elements', () => {
  it('renders toolbar buttons (6 items)', async () => {
    render(<ChartOfAccountsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('coa-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('coa-add-bank')).toHaveTextContent('Add Bank Account');
    expect(screen.getByTestId('coa-print-pdf')).toHaveTextContent('Print PDF');
    expect(screen.getByTestId('coa-import')).toHaveTextContent('Import');
    expect(screen.getByTestId('coa-export')).toHaveTextContent('Export');
    expect(screen.getByTestId('coa-edit-report-codes')).toHaveTextContent('Edit Report Code Mappings');
  });

  it('renders bulk actions bar with Delete, Archive, Change Tax Rate', () => {
    render(<ChartOfAccountsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('coa-bulk-actions')).toBeInTheDocument();
    expect(screen.getByTestId('coa-delete')).toHaveTextContent('Delete');
    expect(screen.getByTestId('coa-archive')).toHaveTextContent('Archive');
    expect(screen.getByTestId('coa-change-tax')).toHaveTextContent('Change Tax Rate');
  });

  it('shows "No accounts selected" text when none selected', () => {
    render(<ChartOfAccountsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('coa-no-selection-text')).toHaveTextContent('No accounts selected');
  });

  it('renders search textbox with Search button', () => {
    render(<ChartOfAccountsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('coa-search-input')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search accounts')).toBeInTheDocument();
    expect(screen.getByTestId('coa-search-btn')).toHaveTextContent('Search');
  });

  it('renders proper table columns (Checkbox, Code, Name, Type, Tax Rate, Report Code, YTD)', async () => {
    render(<ChartOfAccountsPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('Sales')).toBeInTheDocument();
    });
    expect(screen.getByText('Code')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Tax Rate')).toBeInTheDocument();
    expect(screen.getByText('Report Code')).toBeInTheDocument();
    expect(screen.getByText('YTD')).toBeInTheDocument();
    expect(screen.getByTestId('coa-select-all')).toBeInTheDocument();
  });

  it('renders tabs matching Xero', () => {
    render(<ChartOfAccountsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('coa-tab-all')).toHaveTextContent('All Accounts');
    expect(screen.getByTestId('coa-tab-asset')).toHaveTextContent('Assets');
    expect(screen.getByTestId('coa-tab-liability')).toHaveTextContent('Liabilities');
    expect(screen.getByTestId('coa-tab-equity')).toHaveTextContent('Equity');
    expect(screen.getByTestId('coa-tab-expense')).toHaveTextContent('Expenses');
    expect(screen.getByTestId('coa-tab-revenue')).toHaveTextContent('Revenue');
    expect(screen.getByTestId('coa-tab-archive')).toHaveTextContent('Archive');
  });

  it('renders lock icon for system accounts', async () => {
    render(<ChartOfAccountsPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('Accounts Receivable')).toBeInTheDocument();
    });
    // Account code '610' is a system account
    expect(screen.getByTestId('lock-2')).toBeInTheDocument();
  });

  it('renders pagination', async () => {
    render(<ChartOfAccountsPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('Sales')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Previous page')).toBeInTheDocument();
    expect(screen.getByLabelText('Next page')).toBeInTheDocument();
  });
});

/* ─── Manual Journals ─── */
describe('ManualJournalsPage — enhanced elements', () => {
  it('renders all 6 journal tabs', () => {
    render(<ManualJournalsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('journal-tab-all')).toHaveTextContent('All');
    expect(screen.getByTestId('journal-tab-draft')).toHaveTextContent('Draft');
    expect(screen.getByTestId('journal-tab-posted')).toHaveTextContent('Posted');
    expect(screen.getByTestId('journal-tab-voided')).toHaveTextContent('Voided');
    expect(screen.getByTestId('journal-tab-repeating')).toHaveTextContent('Repeating');
    expect(screen.getByTestId('journal-tab-archive')).toHaveTextContent('Archive');
  });

  it('renders toolbar with action buttons', () => {
    render(<ManualJournalsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('journal-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('journal-new-repeating')).toHaveTextContent('New Repeating Journal');
    expect(screen.getByTestId('journal-import')).toHaveTextContent('Import');
    expect(screen.getByTestId('journal-archive')).toHaveTextContent('Archive');
    expect(screen.getByTestId('journal-void')).toHaveTextContent('Void');
  });

  it('renders Debit NZD / Credit NZD columns and select-all checkbox', async () => {
    render(<ManualJournalsPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('Monthly depreciation')).toBeInTheDocument();
    });
    expect(screen.getByText('Debit NZD')).toBeInTheDocument();
    expect(screen.getByText('Credit NZD')).toBeInTheDocument();
    expect(screen.getByTestId('journal-select-all')).toBeInTheDocument();
  });

  it('renders item count', async () => {
    render(<ManualJournalsPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('journal-item-count')).toHaveTextContent('2 items');
    });
  });
});

/* ─── Fixed Assets ─── */
describe('FixedAssetsPage — enhanced elements', () => {
  it('renders tab counts', async () => {
    render(<FixedAssetsPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('asset-tab-draft')).toHaveTextContent('Draft (1)');
    });
    expect(screen.getByTestId('asset-tab-registered')).toHaveTextContent('Registered (1)');
    expect(screen.getByTestId('asset-tab-disposed')).toHaveTextContent('Sold/Disposed (0)');
  });

  it('renders search box', () => {
    render(<FixedAssetsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('assets-search-input')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search draft assets by name, number, type or description')).toBeInTheDocument();
  });

  it('renders help banner with correct text and video link', () => {
    render(<FixedAssetsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('assets-help-banner')).toBeInTheDocument();
    expect(screen.getByText('Track business assets to manage their depreciation and disposals.')).toBeInTheDocument();
    expect(screen.getByTestId('assets-video-link')).toHaveTextContent('Watch video [2:33]');
    expect(screen.getByTestId('assets-hide-banner')).toHaveTextContent('Hide');
  });

  it('hides help banner when Hide is clicked', async () => {
    const user = userEvent.setup();
    render(<FixedAssetsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('assets-help-banner')).toBeInTheDocument();
    await user.click(screen.getByTestId('assets-hide-banner'));
    expect(screen.queryByTestId('assets-help-banner')).not.toBeInTheDocument();
  });

  it('renders last depreciation info', () => {
    render(<FixedAssetsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('last-depreciation-info')).toHaveTextContent('Last depreciation: none');
  });

  it('renders toolbar with Run depreciation, More options, and New asset buttons', () => {
    render(<FixedAssetsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('assets-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('assets-run-depreciation')).toHaveTextContent('Run depreciation');
    expect(screen.getByTestId('assets-more-options')).toBeInTheDocument();
    expect(screen.getByTestId('assets-new-asset')).toHaveTextContent('New asset');
  });

  it('renders bulk actions bar with Delete and Register for draft tab', async () => {
    render(<FixedAssetsPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('assets-bulk-actions')).toBeInTheDocument();
    });
    expect(screen.getByTestId('assets-bulk-delete')).toHaveTextContent('Delete');
    expect(screen.getByTestId('assets-bulk-register')).toHaveTextContent('Register');
  });

  it('renders item count above the table', async () => {
    render(<FixedAssetsPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('assets-item-count')).toBeInTheDocument();
    });
    expect(screen.getByTestId('assets-item-count')).toHaveTextContent(/\d+ items total/);
  });
});

/* ─── Assurance Dashboard ─── */
describe('AssuranceDashboardPage', () => {
  it('renders 4 tabs', () => {
    render(<AssuranceDashboardPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('assurance-tab-user-activity')).toHaveTextContent('User Activity');
    expect(screen.getByTestId('assurance-tab-bank-accounts')).toHaveTextContent('Bank Accounts');
    expect(screen.getByTestId('assurance-tab-contacts')).toHaveTextContent('Contacts');
    expect(screen.getByTestId('assurance-tab-invoices-bills')).toHaveTextContent('Invoices & Bills');
  });

  it('renders activity heatmap with 12 month columns', () => {
    render(<AssuranceDashboardPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('activity-heatmap')).toBeInTheDocument();
    expect(screen.getByText('Jan')).toBeInTheDocument();
    expect(screen.getByText('Dec')).toBeInTheDocument();
  });

  it('renders show deleted users toggle switch', () => {
    render(<AssuranceDashboardPage />, { wrapper: createWrapper() });
    const toggle = screen.getByTestId('show-deleted-switch');
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute('role', 'switch');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('shows deleted users when toggle is activated', async () => {
    const user = userEvent.setup();
    render(<AssuranceDashboardPage />, { wrapper: createWrapper() });

    // Initially, Bob Wilson (deleted) should not be visible
    expect(screen.queryByTestId('heatmap-row-u3')).not.toBeInTheDocument();

    // Enable show deleted
    await user.click(screen.getByTestId('show-deleted-switch'));

    // Now Bob Wilson should appear
    expect(screen.getByTestId('heatmap-row-u3')).toBeInTheDocument();
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    expect(screen.getByText('(deleted)')).toBeInTheDocument();
  });
});

/* ─── History and Notes ─── */
describe('HistoryAndNotesPage', () => {
  it('renders table with Date, User, Type, Detail columns', () => {
    render(<HistoryAndNotesPage />, { wrapper: createWrapper() });
    const table = screen.getByTestId('history-table');
    expect(within(table).getByText('Date')).toBeInTheDocument();
    expect(within(table).getByText('User')).toBeInTheDocument();
    expect(within(table).getByText('Type')).toBeInTheDocument();
    expect(within(table).getByText('Detail')).toBeInTheDocument();
  });

  it('renders filters (start date, end date, user, type, search)', () => {
    render(<HistoryAndNotesPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('history-filters')).toBeInTheDocument();
    expect(screen.getByTestId('history-start-date')).toBeInTheDocument();
    expect(screen.getByTestId('history-end-date')).toBeInTheDocument();
    expect(screen.getByTestId('history-user-filter')).toBeInTheDocument();
    expect(screen.getByTestId('history-type-filter')).toBeInTheDocument();
    expect(screen.getByTestId('history-search')).toBeInTheDocument();
  });

  it('renders Export button', () => {
    render(<HistoryAndNotesPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('history-export')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('renders "Showing N results" count', () => {
    render(<HistoryAndNotesPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('history-result-count')).toHaveTextContent('Showing 8 results');
  });

  it('renders history entries in the table', () => {
    render(<HistoryAndNotesPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Logged in from 192.168.1.1')).toBeInTheDocument();
    expect(screen.getByText('Created invoice INV-0042')).toBeInTheDocument();
    // John Smith appears both in the User filter dropdown and in multiple table rows
    expect(screen.getAllByText('John Smith').length).toBeGreaterThanOrEqual(2);
  });
});
