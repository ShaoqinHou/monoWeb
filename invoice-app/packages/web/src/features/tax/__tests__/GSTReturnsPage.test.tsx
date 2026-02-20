// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ── Mock hooks ────────────────────────────────────────────────────────────────

const MOCK_RETURNS = [
  {
    id: 'gst-2026-01',
    period: 'Jan-Feb 2026',
    startDate: '2026-01-01',
    endDate: '2026-02-28',
    dueDate: '2026-03-28',
    status: 'draft' as const,
    gstCollected: 18750,
    gstPaid: 12300,
    netGst: 6450,
    filedAt: null,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'gst-2025-11',
    period: 'Nov-Dec 2025',
    startDate: '2025-11-01',
    endDate: '2025-12-31',
    dueDate: '2026-01-28',
    status: 'overdue' as const,
    gstCollected: 17775,
    gstPaid: 11475,
    netGst: 6300,
    filedAt: null,
    createdAt: '2025-11-01T00:00:00Z',
  },
  {
    id: 'gst-2025-09',
    period: 'Sep-Oct 2025',
    startDate: '2025-09-01',
    endDate: '2025-10-31',
    dueDate: '2025-11-28',
    status: 'filed' as const,
    gstCollected: 21300,
    gstPaid: 13650,
    netGst: 7650,
    filedAt: '2025-11-25T10:00:00Z',
    createdAt: '2025-09-01T00:00:00Z',
  },
  {
    id: 'gst-2025-07',
    period: 'Jul-Aug 2025',
    startDate: '2025-07-01',
    endDate: '2025-08-31',
    dueDate: '2025-09-28',
    status: 'filed' as const,
    gstCollected: 14805,
    gstPaid: 10170,
    netGst: 4635,
    filedAt: '2025-09-25T10:00:00Z',
    createdAt: '2025-07-01T00:00:00Z',
  },
  {
    id: 'gst-2025-05',
    period: 'May-Jun 2025',
    startDate: '2025-05-01',
    endDate: '2025-06-30',
    dueDate: '2025-07-28',
    status: 'filed' as const,
    gstCollected: 16545,
    gstPaid: 10980,
    netGst: 5565,
    filedAt: '2025-07-25T10:00:00Z',
    createdAt: '2025-05-01T00:00:00Z',
  },
  {
    id: 'gst-2025-03',
    period: 'Mar-Apr 2025',
    startDate: '2025-03-01',
    endDate: '2025-04-30',
    dueDate: '2025-05-28',
    status: 'filed' as const,
    gstCollected: 20370,
    gstPaid: 13260,
    netGst: 7110,
    filedAt: '2025-05-25T10:00:00Z',
    createdAt: '2025-03-01T00:00:00Z',
  },
];

vi.mock('../hooks/useGSTReturns', () => ({
  useGSTReturnsApi: () => ({ data: MOCK_RETURNS, isLoading: false }),
  useGSTReturnApi: (id: string) => ({
    data: id ? MOCK_RETURNS.find((r) => r.id === id) : undefined,
  }),
  useCreateGSTReturn: () => ({ mutate: vi.fn(), isPending: false }),
  useFileGSTReturn: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteGSTReturn: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('../hooks/useTax', () => ({
  useTaxSummary: () => ({ data: null }),
}));

vi.mock('../hooks/useActivityStatements', () => ({
  useActivityStatements: () => ({ data: [], isLoading: false }),
}));

vi.mock('../hooks/useTaxSettings', () => ({
  useTaxSettings: () => ({
    data: {
      gstNumber: '111-222-333',
      gstStartDate: '2025-04-01',
      accountingBasis: 'Invoice basis (Accrual)',
      filingPeriod: '2-monthly',
      gstFormType: 'GST101A',
    },
    isLoading: false,
  }),
}));

// ── Component mocks ──────────────────────────────────────────────────────────

vi.mock('../components/GSTReturnDetailApi', () => ({
  GSTReturnDetailApi: ({
    gstReturn,
    onBack,
  }: {
    gstReturn: { period: string; gstCollected: number; gstPaid: number; netGst: number };
    onBack: () => void;
  }) => (
    <div>
      <button data-testid="back-button" onClick={onBack}>Back to returns</button>
      <h2>GST Return: {gstReturn.period}</h2>
      <div data-testid="box-5">{gstReturn.gstCollected}</div>
      <div data-testid="box-6">{gstReturn.gstPaid}</div>
      <div data-testid="box-9">{gstReturn.netGst}</div>
      <div data-testid="box-11">{gstReturn.netGst}</div>
      <div data-testid="box-13">{gstReturn.netGst}</div>
      <div data-testid="net-gst-value">${gstReturn.netGst.toLocaleString('en', { minimumFractionDigits: 2 })}</div>
    </div>
  ),
}));

vi.mock('../components/TaxRateList', () => ({
  TaxRateList: () => <div data-testid="tax-rate-list" />,
}));

vi.mock('../components/TaxSummaryCard', () => ({
  TaxSummaryCard: () => <div />,
}));

vi.mock('../components/ActivityStatementsList', () => ({
  ActivityStatementsList: () => <div />,
}));

// ── Test setup ───────────────────────────────────────────────────────────────

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

import { GSTReturnsPage } from '../routes/TaxPage';

describe('GSTReturnsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page title "GST Returns"', async () => {
    render(<GSTReturnsPage />, { wrapper: createWrapper() });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('GST Returns');
  });

  it('renders GST Returns and Tax Rates tabs', async () => {
    render(<GSTReturnsPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'GST Returns' })).toBeInTheDocument();
    });
    expect(screen.getByRole('tab', { name: 'Tax Rates' })).toBeInTheDocument();
  });

  it('renders 6 GST return periods after loading', async () => {
    render(<GSTReturnsPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('Jan-Feb 2026')).toBeInTheDocument();
    });
    expect(screen.getByText('Nov-Dec 2025')).toBeInTheDocument();
    expect(screen.getByText('Sep-Oct 2025')).toBeInTheDocument();
    expect(screen.getByText('Jul-Aug 2025')).toBeInTheDocument();
    expect(screen.getByText('May-Jun 2025')).toBeInTheDocument();
    expect(screen.getByText('Mar-Apr 2025')).toBeInTheDocument();
  });

  it('displays correct status badges', async () => {
    render(<GSTReturnsPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('Draft')).toBeInTheDocument();
    });
    expect(screen.getByText('Overdue')).toBeInTheDocument();
    // Multiple "Filed" badges
    const filedBadges = screen.getAllByText('Filed');
    expect(filedBadges.length).toBe(4);
  });

  it('renders column headers in the table', async () => {
    render(<GSTReturnsPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('Period')).toBeInTheDocument();
    });
    expect(screen.getByText('Due Date')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('GST Collected')).toBeInTheDocument();
    expect(screen.getByText('GST Paid')).toBeInTheDocument();
    expect(screen.getByText('Net GST')).toBeInTheDocument();
  });

  it('navigates to detail view when clicking a period', async () => {
    render(<GSTReturnsPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('Jan-Feb 2026')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('gst-return-row-gst-2026-01'));

    await waitFor(() => {
      expect(screen.getByText('GST Return: Jan-Feb 2026')).toBeInTheDocument();
    });
  });

  it('shows detail breakdown boxes when a return is selected', async () => {
    render(<GSTReturnsPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('Jan-Feb 2026')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('gst-return-row-gst-2026-01'));

    await waitFor(() => {
      expect(screen.getByTestId('box-5')).toBeInTheDocument();
    });
    expect(screen.getByTestId('box-6')).toBeInTheDocument();
    expect(screen.getByTestId('box-9')).toBeInTheDocument();
    expect(screen.getByTestId('box-11')).toBeInTheDocument();
    expect(screen.getByTestId('box-13')).toBeInTheDocument();
  });

  it('shows back button in detail view and returns to list on click', async () => {
    render(<GSTReturnsPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('Jan-Feb 2026')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('gst-return-row-gst-2026-01'));

    await waitFor(() => {
      expect(screen.getByTestId('back-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('back-button'));

    await waitFor(() => {
      expect(screen.getByText('Jan-Feb 2026')).toBeInTheDocument();
    });
    expect(screen.queryByText('GST Return: Jan-Feb 2026')).not.toBeInTheDocument();
  });

  it('shows net GST value in detail view', async () => {
    render(<GSTReturnsPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('Jan-Feb 2026')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('gst-return-row-gst-2026-01'));

    await waitFor(() => {
      expect(screen.getByTestId('net-gst-value')).toBeInTheDocument();
    });
    expect(screen.getByTestId('net-gst-value')).toHaveTextContent('6,450.00');
  });

  it('renders New Return button', async () => {
    render(<GSTReturnsPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('new-gst-return-btn')).toBeInTheDocument();
    });
  });
});
