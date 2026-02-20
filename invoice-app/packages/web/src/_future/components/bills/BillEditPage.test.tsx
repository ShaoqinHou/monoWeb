// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BillEditPage } from '../routes/BillEditPage';
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
  ],
  subTotal: 62.50,
  totalTax: 9.38,
  total: 71.88,
  amountDue: 71.88,
  amountPaid: 0,
  createdAt: '2024-06-01T09:00:00.000Z',
  updatedAt: '2024-06-01T09:00:00.000Z',
};

const MOCK_CONTACTS = [
  {
    id: 'c001',
    name: 'Office Supplies Ltd',
    type: 'supplier',
    outstandingBalance: 0,
    overdueBalance: 0,
    isArchived: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ billId: 'b001' }),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockFetchBillAndContacts(bill: Bill | null) {
  if (bill) {
    // GET /api/bills/:id
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, data: bill }),
    });
    // GET /api/contacts (for suppliers)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, data: MOCK_CONTACTS }),
    });
  } else {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 404,
      json: async () => ({ ok: false, error: 'Not found' }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, data: MOCK_CONTACTS }),
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

describe('BillEditPage', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('renders the page title "Edit Bill"', async () => {
    mockFetchBillAndContacts(DRAFT_BILL);
    render(<BillEditPage />, { wrapper: createWrapper() });
    expect(await screen.findByRole('heading', { level: 1, name: 'Edit Bill' })).toBeInTheDocument();
  });

  it('renders breadcrumbs with Bills link', async () => {
    mockFetchBillAndContacts(DRAFT_BILL);
    render(<BillEditPage />, { wrapper: createWrapper() });
    expect(await screen.findByText('Bills')).toBeInTheDocument();
  });

  it('renders breadcrumb with bill number', async () => {
    mockFetchBillAndContacts(DRAFT_BILL);
    render(<BillEditPage />, { wrapper: createWrapper() });
    expect(await screen.findByText('BILL-0001')).toBeInTheDocument();
  });

  it('renders the bill form pre-filled with bill data', async () => {
    mockFetchBillAndContacts(DRAFT_BILL);
    render(<BillEditPage />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('bill-form')).toBeInTheDocument();
  });

  it('pre-fills date input with bill date', async () => {
    mockFetchBillAndContacts(DRAFT_BILL);
    render(<BillEditPage />, { wrapper: createWrapper() });
    const dateInput = await screen.findByTestId('bill-date-input');
    expect(dateInput).toHaveValue('2024-06-01');
  });

  it('pre-fills due date input', async () => {
    mockFetchBillAndContacts(DRAFT_BILL);
    render(<BillEditPage />, { wrapper: createWrapper() });
    const dueDateInput = await screen.findByTestId('bill-due-date-input');
    expect(dueDateInput).toHaveValue('2024-07-01');
  });

  it('shows loading state initially', () => {
    // Never resolve fetch to stay in loading
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(<BillEditPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('bill-edit-loading')).toHaveTextContent('Loading bill...');
  });

  it('shows not found for invalid bill', async () => {
    mockFetchBillAndContacts(null);
    render(<BillEditPage />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('bill-not-found')).toHaveTextContent('Bill not found');
  });

  it('renders line items editor', async () => {
    mockFetchBillAndContacts(DRAFT_BILL);
    render(<BillEditPage />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('bill-line-items')).toBeInTheDocument();
  });

  it('renders Save as Draft button', async () => {
    mockFetchBillAndContacts(DRAFT_BILL);
    render(<BillEditPage />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('save-draft-btn')).toHaveTextContent('Save as Draft');
  });
});
