import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BillDetailPage } from '../routes/BillsPage';
import type { Bill } from '../types';

const DRAFT_BILL: Bill = {
  id: 'b001',
  billNumber: 'BILL-0001',
  reference: 'PO-001',
  contactId: 'c001',
  contactName: 'Office Supplies Ltd',
  status: 'draft',
  amountType: 'exclusive',
  currency: 'NZD',
  date: '2024-06-01',
  dueDate: '2024-07-01',
  lineItems: [
    {
      id: 'li-001',
      description: 'Printer paper (A4, 5 reams)',
      quantity: 5,
      unitPrice: 12.50,
      accountCode: '429',
      taxRate: 15,
      taxAmount: 9.38,
      lineAmount: 62.50,
      discount: 0,
    },
    {
      id: 'li-002',
      description: 'Ink cartridges',
      quantity: 3,
      unitPrice: 45.00,
      accountCode: '429',
      taxRate: 15,
      taxAmount: 20.25,
      lineAmount: 135.00,
      discount: 0,
    },
  ],
  subTotal: 197.50,
  totalTax: 29.63,
  total: 227.13,
  amountDue: 227.13,
  amountPaid: 0,
  createdAt: '2024-06-01T09:00:00.000Z',
  updatedAt: '2024-06-01T09:00:00.000Z',
};

const PAID_BILL: Bill = {
  id: 'b004',
  billNumber: 'BILL-0004',
  reference: 'INS-2024-Q2',
  contactId: 'c004',
  contactName: 'Kiwi Insurance Group',
  status: 'paid',
  amountType: 'no_tax',
  currency: 'NZD',
  date: '2024-04-01',
  dueDate: '2024-04-30',
  lineItems: [
    {
      id: 'li-006',
      description: 'Business insurance — Q2 2024',
      quantity: 1,
      unitPrice: 1500.00,
      accountCode: '461',
      taxRate: 0,
      taxAmount: 0,
      lineAmount: 1500.00,
      discount: 0,
    },
  ],
  subTotal: 1500.00,
  totalTax: 0,
  total: 1500.00,
  amountDue: 0,
  amountPaid: 1500.00,
  createdAt: '2024-04-01T09:00:00.000Z',
  updatedAt: '2024-04-28T11:00:00.000Z',
};

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
  useSearch: () => ({}),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockFetchBill(bill: Bill | null) {
  if (bill) {
    // GET /api/bills/:id
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, data: bill }),
    });
    // GET /api/bills/:id/payments
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, data: [] }),
    });
    // GET /api/contacts (for suppliers in inline edit)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, data: [] }),
    });
  } else {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 404,
      json: async () => ({ ok: false, error: 'Not found' }),
    });
    // Payments call may still happen, provide empty response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, data: [] }),
    });
    // GET /api/contacts (for suppliers)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, data: [] }),
    });
  }
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

describe('BillDetailPage', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('renders breadcrumbs with Bills link', async () => {
    mockFetchBill(DRAFT_BILL);
    render(<BillDetailPage billId="b001" />, { wrapper: createWrapper() });
    expect(await screen.findByText('Bills')).toBeInTheDocument();
  });

  it('renders the bill number as page title', async () => {
    mockFetchBill(DRAFT_BILL);
    render(<BillDetailPage billId="b001" />, { wrapper: createWrapper() });
    expect(await screen.findByRole('heading', { level: 1, name: 'BILL-0001' })).toBeInTheDocument();
  });

  it('fetches bill from /api/bills/:id', async () => {
    mockFetchBill(DRAFT_BILL);
    render(<BillDetailPage billId="b001" />, { wrapper: createWrapper() });
    await screen.findByTestId('bill-contact');
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/bills/b001',
      expect.objectContaining({ headers: expect.objectContaining({ 'Content-Type': 'application/json' }) }),
    );
  });

  it('renders bill contact name', async () => {
    mockFetchBill(DRAFT_BILL);
    render(<BillDetailPage billId="b001" />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('bill-contact')).toHaveTextContent('Office Supplies Ltd');
  });

  it('renders bill date and due date', async () => {
    mockFetchBill(DRAFT_BILL);
    render(<BillDetailPage billId="b001" />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('bill-date')).toHaveTextContent('2024-06-01');
    expect(screen.getByTestId('bill-due-date')).toHaveTextContent('2024-07-01');
  });

  it('renders the bill status badge', async () => {
    mockFetchBill(DRAFT_BILL);
    render(<BillDetailPage billId="b001" />, { wrapper: createWrapper() });
    // Multiple "Draft" elements exist (ApprovalProgress + StatusBadge), check at least one
    const drafts = await screen.findAllByText('Draft');
    expect(drafts.length).toBeGreaterThan(0);
  });

  it('renders action buttons for draft bill', async () => {
    mockFetchBill(DRAFT_BILL);
    render(<BillDetailPage billId="b001" />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('bill-action-submitted')).toHaveTextContent('Submit');
    expect(screen.getByTestId('bill-action-voided')).toHaveTextContent('Void');
  });

  it('renders edit button for draft bill', async () => {
    mockFetchBill(DRAFT_BILL);
    render(<BillDetailPage billId="b001" />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('bill-edit-btn')).toBeInTheDocument();
  });

  it('renders line items table', async () => {
    mockFetchBill(DRAFT_BILL);
    render(<BillDetailPage billId="b001" />, { wrapper: createWrapper() });
    expect(await screen.findByText('Printer paper (A4, 5 reams)')).toBeInTheDocument();
    expect(screen.getByText('Ink cartridges')).toBeInTheDocument();
  });

  it('renders bill totals', async () => {
    mockFetchBill(DRAFT_BILL);
    render(<BillDetailPage billId="b001" />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('bill-subtotal')).toHaveTextContent('$197.50');
    expect(screen.getByTestId('bill-tax')).toHaveTextContent('$29.63');
    expect(screen.getByTestId('bill-total')).toHaveTextContent('$227.13');
  });

  it('shows not found for invalid bill ID', async () => {
    mockFetchBill(null);
    render(<BillDetailPage billId="nonexistent-id" />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('bill-not-found')).toHaveTextContent('Bill not found');
  });

  it('shows payment history for paid bills', async () => {
    mockFetchBill(PAID_BILL);
    render(<BillDetailPage billId="b004" />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('payment-history')).toBeInTheDocument();
  });

  it('does not show action buttons for paid bills', async () => {
    mockFetchBill(PAID_BILL);
    render(<BillDetailPage billId="b004" />, { wrapper: createWrapper() });
    await screen.findByRole('heading', { level: 1, name: 'BILL-0004' });
    expect(screen.queryByTestId('bill-actions')).not.toBeInTheDocument();
  });
});
