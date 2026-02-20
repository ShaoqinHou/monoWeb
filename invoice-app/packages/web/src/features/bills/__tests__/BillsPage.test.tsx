// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BillsPage } from '../routes/BillsPage';
import type { Bill } from '../types';

const MOCK_BILLS: Bill[] = [
  {
    id: 'b001',
    billNumber: 'BILL-0001',
    reference: 'PO-001',
    contactId: 'c001',
    contactName: 'Alpha Corp',
    status: 'draft',
    amountType: 'exclusive',
    currency: 'NZD',
    date: '2024-06-01',
    dueDate: '2024-07-01',
    lineItems: [],
    subTotal: 100,
    totalTax: 15,
    total: 115,
    amountDue: 115,
    amountPaid: 0,
    createdAt: '2024-06-01T00:00:00.000Z',
    updatedAt: '2024-06-01T00:00:00.000Z',
  },
  {
    id: 'b002',
    billNumber: 'BILL-0002',
    reference: '',
    contactId: 'c002',
    contactName: 'Beta Ltd',
    status: 'submitted',
    amountType: 'exclusive',
    currency: 'NZD',
    date: '2024-05-15',
    dueDate: '2024-06-14',
    lineItems: [],
    subTotal: 200,
    totalTax: 30,
    total: 230,
    amountDue: 230,
    amountPaid: 0,
    createdAt: '2024-05-15T00:00:00.000Z',
    updatedAt: '2024-05-15T00:00:00.000Z',
  },
];

const MOCK_RECURRING_BILLS = [
  {
    id: 'rb-1',
    templateName: 'Monthly Rent',
    contactId: 'c-1',
    contactName: 'Landlord Corp',
    frequency: 'monthly',
    nextDate: '2026-03-01',
    endDate: null,
    daysUntilDue: 20,
    status: 'active',
    subTotal: 2000,
    totalTax: 300,
    total: 2300,
    timesGenerated: 5,
    createdAt: '2025-10-01T00:00:00Z',
  },
];

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
  useSearch: () => ({}),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockFetchBillsAndRecurring(bills: unknown, recurring: unknown = []) {
  // GET /api/bills
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ ok: true, data: bills }),
  });
  // GET /api/recurring-bills
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ ok: true, data: recurring }),
  });
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('BillsPage', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('renders the page title', () => {
    mockFetchBillsAndRecurring(MOCK_BILLS);
    render(<BillsPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Bills')).toBeInTheDocument();
  });

  it('renders the New bill button', () => {
    mockFetchBillsAndRecurring(MOCK_BILLS);
    render(<BillsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('new-bill-btn')).toHaveTextContent('New bill');
  });

  it('renders overflow menu button with repeating bill option', () => {
    mockFetchBillsAndRecurring(MOCK_BILLS);
    render(<BillsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('bills-overflow-menu-btn')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('bills-overflow-menu-btn'));
    expect(screen.getByTestId('bills-overflow-repeating')).toHaveTextContent('New Repeating Bill');
  });

  it('renders Purchases overview breadcrumb', () => {
    mockFetchBillsAndRecurring(MOCK_BILLS);
    render(<BillsPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Purchases overview')).toBeInTheDocument();
  });

  it('fetches bills from /api/bills', async () => {
    mockFetchBillsAndRecurring(MOCK_BILLS);
    render(<BillsPage />, { wrapper: createWrapper() });
    await screen.findByText('Alpha Corp');
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/bills',
      expect.objectContaining({ headers: expect.objectContaining({ 'Content-Type': 'application/json' }) }),
    );
  });

  it('shows bills table after data loads', async () => {
    mockFetchBillsAndRecurring(MOCK_BILLS);
    render(<BillsPage />, { wrapper: createWrapper() });
    expect(await screen.findByText('Alpha Corp')).toBeInTheDocument();
    expect(screen.getByText('Beta Ltd')).toBeInTheDocument();
  });

  it('renders page-level tabs', () => {
    mockFetchBillsAndRecurring(MOCK_BILLS);
    render(<BillsPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('bills-tab-all')).toHaveTextContent('All');
    expect(screen.getByTestId('bills-tab-draft')).toHaveTextContent('Draft');
    expect(screen.getByTestId('bills-tab-awaiting_approval')).toHaveTextContent('Awaiting approval');
    expect(screen.getByTestId('bills-tab-awaiting_payment')).toHaveTextContent(/Awaiting payment/);
    expect(screen.getByTestId('bills-tab-paid')).toHaveTextContent('Paid');
    expect(screen.getByTestId('bills-tab-repeating')).toHaveTextContent('Repeating');
  });

  it('renders the search input after data loads', async () => {
    mockFetchBillsAndRecurring(MOCK_BILLS);
    render(<BillsPage />, { wrapper: createWrapper() });
    expect(await screen.findByPlaceholderText('Enter a contact, amount, or reference')).toBeInTheDocument();
  });

  it('renders table headers after data loads', async () => {
    mockFetchBillsAndRecurring(MOCK_BILLS);
    render(<BillsPage />, { wrapper: createWrapper() });
    // Wait for data to load
    await screen.findByText('Alpha Corp');
    expect(screen.getByText('From')).toBeInTheDocument();
    expect(screen.getByText('Reference')).toBeInTheDocument();
    // "Due date" appears in both column header and date-type filter
    const dueHeaders = screen.getAllByText('Due date');
    expect(dueHeaders.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('switches to Repeating tab and shows recurring bills list', async () => {
    mockFetchBillsAndRecurring(MOCK_BILLS, MOCK_RECURRING_BILLS);
    render(<BillsPage />, { wrapper: createWrapper() });

    // Wait for bills to load first
    await screen.findByText('Alpha Corp');

    // Click on Repeating tab
    fireEvent.click(screen.getByTestId('bills-tab-repeating'));

    // Should show the recurring bills list
    expect(await screen.findByText('Monthly Rent')).toBeInTheDocument();
    expect(screen.getByText('Landlord Corp')).toBeInTheDocument();
  });

  it('filters to Draft tab showing only draft bills', async () => {
    mockFetchBillsAndRecurring(MOCK_BILLS);
    render(<BillsPage />, { wrapper: createWrapper() });

    await screen.findByText('Alpha Corp');

    fireEvent.click(screen.getByTestId('bills-tab-draft'));

    // Only the draft bill (Alpha Corp) should be visible
    expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
    // The submitted bill should not be in the filtered list
    expect(screen.queryByText('Beta Ltd')).not.toBeInTheDocument();
  });

  it('filters to Awaiting Approval tab showing only submitted bills', async () => {
    mockFetchBillsAndRecurring(MOCK_BILLS);
    render(<BillsPage />, { wrapper: createWrapper() });

    await screen.findByText('Alpha Corp');

    fireEvent.click(screen.getByTestId('bills-tab-awaiting_approval'));

    // Only the submitted bill (Beta Ltd) should be visible
    expect(screen.getByText('Beta Ltd')).toBeInTheDocument();
    expect(screen.queryByText('Alpha Corp')).not.toBeInTheDocument();
  });
});
