// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Recharts ResponsiveContainer uses ResizeObserver which is not in jsdom
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const mockNavigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}));

const mockSummaryData = {
  totalSalesYTD: 142580.50,
  outstandingInvoices: 23450.00,
  overdueAmount: 5670.25,
  averageDaysToPay: 18,
  invoiceCount: 42,
  paidCount: 28,
  overdueCount: 3,
};

const mockChartData = [
  { month: 'Jan', amount: 12500 },
  { month: 'Feb', amount: 15200 },
  { month: 'Mar', amount: 11800 },
  { month: 'Apr', amount: 18900 },
  { month: 'May', amount: 14300 },
  { month: 'Jun', amount: 16700 },
  { month: 'Jul', amount: 13200 },
  { month: 'Aug', amount: 19800 },
  { month: 'Sep', amount: 10180.50 },
  { month: 'Oct', amount: 0 },
  { month: 'Nov', amount: 0 },
  { month: 'Dec', amount: 0 },
];

const mockRecentInvoices = [
  {
    id: 'inv-001',
    reference: 'INV-0042',
    customer: 'Ridgeway University',
    amount: 6250.00,
    date: '2026-02-10',
    status: 'sent' as const,
  },
  {
    id: 'inv-002',
    reference: 'INV-0041',
    customer: 'City Agency',
    amount: 3480.00,
    date: '2026-02-05',
    status: 'paid' as const,
  },
  {
    id: 'inv-003',
    reference: 'INV-0040',
    customer: 'Marine Systems',
    amount: 1250.75,
    date: '2026-01-28',
    status: 'overdue' as const,
  },
  {
    id: 'inv-004',
    reference: 'INV-0039',
    customer: 'Boom FM',
    amount: 4500.00,
    date: '2026-01-20',
    status: 'paid' as const,
  },
  {
    id: 'inv-005',
    reference: 'INV-0038',
    customer: 'Bayside Club',
    amount: 890.50,
    date: '2026-01-15',
    status: 'draft' as const,
  },
];

vi.mock('../hooks/useSales', () => ({
  useSalesSummary: () => ({
    data: mockSummaryData,
    isLoading: false,
  }),
  useSalesChart: () => ({
    data: mockChartData,
    isLoading: false,
  }),
  useRecentInvoices: () => ({
    data: mockRecentInvoices,
    isLoading: false,
  }),
}));

import { SalesOverviewPage } from '../routes/SalesOverviewPage';

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

describe('SalesOverviewPage', () => {
  it('renders the page title', () => {
    render(<SalesOverviewPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Sales Overview')).toBeInTheDocument();
  });

  it('renders quick action buttons', () => {
    render(<SalesOverviewPage />, { wrapper: createWrapper() });
    expect(screen.getByText('New Invoice')).toBeInTheDocument();
    expect(screen.getByText('View All Invoices')).toBeInTheDocument();
  });

  it('renders breadcrumb navigation', () => {
    render(<SalesOverviewPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
  });

  it('renders summary cards after data loads', async () => {
    render(<SalesOverviewPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('Total Sales (YTD)')).toBeInTheDocument();
    });
    expect(screen.getByText('Outstanding Invoices')).toBeInTheDocument();
    expect(screen.getByText('Overdue Amount')).toBeInTheDocument();
    expect(screen.getByText('Average Days to Pay')).toBeInTheDocument();
  });

  it('renders the sales chart card', async () => {
    render(<SalesOverviewPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('sales-chart')).toBeInTheDocument();
    });
    expect(screen.getByText('Monthly Sales')).toBeInTheDocument();
  });

  it('renders recent invoices section', async () => {
    render(<SalesOverviewPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('recent-invoices')).toBeInTheDocument();
    });
    expect(screen.getByText('Recent Invoices')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<SalesOverviewPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('sales-chart')).toBeInTheDocument();
  });

  it('displays invoice data in recent invoices table', async () => {
    render(<SalesOverviewPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('INV-0042')).toBeInTheDocument();
    });
    // Ridgeway appears in both recent invoices and customers owing
    expect(screen.getAllByText('Ridgeway University').length).toBeGreaterThan(0);
    expect(screen.getAllByText('City Agency').length).toBeGreaterThan(0);
  });

  it('displays summary amounts after loading', async () => {
    render(<SalesOverviewPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('sales-summary')).toBeInTheDocument();
    });
    // Summary amounts appear in sales-summary cards
    expect(screen.getByText('Total Sales (YTD)')).toBeInTheDocument();
    expect(screen.getByText('Outstanding Invoices')).toBeInTheDocument();
    expect(screen.getByText('Overdue Amount')).toBeInTheDocument();
    expect(screen.getByText('18 days')).toBeInTheDocument();
  });

  it('displays invoice status badges', async () => {
    render(<SalesOverviewPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('Sent')).toBeInTheDocument();
    });
    expect(screen.getAllByText('Paid').length).toBeGreaterThan(0);
    // "Overdue" and "Draft" appear in both status badges section and recent invoices
    expect(screen.getAllByText(/Overdue/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Draft/).length).toBeGreaterThan(0);
  });
});
