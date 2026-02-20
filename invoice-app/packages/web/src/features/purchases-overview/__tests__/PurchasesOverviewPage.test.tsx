import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PurchasesOverviewPage } from '../routes/PurchasesOverviewPage';
import type { Bill } from '../../bills/types';

// Recharts ResponsiveContainer uses ResizeObserver which is not in jsdom
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to, ...rest }: { children: React.ReactNode; to: string; className?: string }) => (
    <a href={to} {...rest}>{children}</a>
  ),
}));

const currentYear = new Date().getFullYear();

const MOCK_BILLS: Bill[] = [
  {
    id: 'b001',
    billNumber: 'BILL-0001',
    reference: 'PO-001',
    contactId: 'c001',
    contactName: 'Office Supplies NZ',
    status: 'submitted',
    amountType: 'exclusive',
    currency: 'NZD',
    date: `${currentYear}-02-12`,
    dueDate: `${currentYear}-03-12`,
    lineItems: [],
    subTotal: 1000,
    totalTax: 150,
    total: 1250,
    amountDue: 1250,
    amountPaid: 0,
    createdAt: `${currentYear}-02-12T00:00:00.000Z`,
    updatedAt: `${currentYear}-02-12T00:00:00.000Z`,
  },
  {
    id: 'b002',
    billNumber: 'BILL-0002',
    reference: '',
    contactId: 'c002',
    contactName: 'Auckland Power Co',
    status: 'paid',
    amountType: 'inclusive',
    currency: 'NZD',
    date: `${currentYear}-02-08`,
    dueDate: `${currentYear}-03-08`,
    lineItems: [],
    subTotal: 400,
    totalTax: 60,
    total: 485.30,
    amountDue: 0,
    amountPaid: 485.30,
    createdAt: `${currentYear}-02-08T00:00:00.000Z`,
    updatedAt: `${currentYear}-02-08T00:00:00.000Z`,
  },
  {
    id: 'b003',
    billNumber: 'BILL-0003',
    reference: '',
    contactId: 'c003',
    contactName: 'NZ Telecom',
    status: 'approved',
    amountType: 'exclusive',
    currency: 'NZD',
    date: `${currentYear}-01-30`,
    dueDate: '2020-01-01',
    lineItems: [],
    subTotal: 280,
    totalTax: 40,
    total: 320,
    amountDue: 320,
    amountPaid: 0,
    createdAt: `${currentYear}-01-30T00:00:00.000Z`,
    updatedAt: `${currentYear}-01-30T00:00:00.000Z`,
  },
  {
    id: 'b004',
    billNumber: 'BILL-0004',
    reference: '',
    contactId: 'c004',
    contactName: 'CloudHost Ltd',
    status: 'draft',
    amountType: 'exclusive',
    currency: 'NZD',
    date: `${currentYear}-01-22`,
    dueDate: `${currentYear}-02-22`,
    lineItems: [],
    subTotal: 800,
    totalTax: 90,
    total: 890,
    amountDue: 890,
    amountPaid: 0,
    createdAt: `${currentYear}-01-22T00:00:00.000Z`,
    updatedAt: `${currentYear}-01-22T00:00:00.000Z`,
  },
];

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockFetchBills() {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ ok: true, data: MOCK_BILLS }),
  });
}

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

describe('PurchasesOverviewPage', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('renders the page title', () => {
    mockFetchBills();
    render(<PurchasesOverviewPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Purchases Overview')).toBeInTheDocument();
  });

  it('renders quick action buttons', () => {
    mockFetchBills();
    render(<PurchasesOverviewPage />, { wrapper: createWrapper() });
    expect(screen.getByText('New Bill')).toBeInTheDocument();
    expect(screen.getByText('View All Bills')).toBeInTheDocument();
  });

  it('renders breadcrumb navigation', () => {
    mockFetchBills();
    render(<PurchasesOverviewPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Purchases')).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
  });

  it('renders summary cards after data loads', async () => {
    mockFetchBills();
    render(<PurchasesOverviewPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('Total Purchases (YTD)')).toBeInTheDocument();
    });
    expect(screen.getByText('Outstanding Bills')).toBeInTheDocument();
    expect(screen.getByText('Overdue Amount')).toBeInTheDocument();
  });

  it('renders the purchases chart card', async () => {
    mockFetchBills();
    render(<PurchasesOverviewPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('purchases-chart')).toBeInTheDocument();
    });
    expect(screen.getByText('Monthly Purchases')).toBeInTheDocument();
  });

  it('renders recent bills section', async () => {
    mockFetchBills();
    render(<PurchasesOverviewPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('recent-bills')).toBeInTheDocument();
    });
    expect(screen.getByText('Recent Bills')).toBeInTheDocument();
  });

  it('fetches bills data from /api/bills', async () => {
    mockFetchBills();
    render(<PurchasesOverviewPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('Total Purchases (YTD)')).toBeInTheDocument();
    });
    // Should make multiple calls to /api/bills (summary, chart, recent)
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/bills',
      expect.objectContaining({ headers: expect.objectContaining({ 'Content-Type': 'application/json' }) }),
    );
  });

  it('shows loading state initially', () => {
    mockFetchBills();
    render(<PurchasesOverviewPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('purchases-chart')).toBeInTheDocument();
  });

  it('displays supplier names in recent bills', async () => {
    mockFetchBills();
    render(<PurchasesOverviewPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('Office Supplies NZ')).toBeInTheDocument();
    });
    expect(screen.getByText('Auckland Power Co')).toBeInTheDocument();
  });
});
