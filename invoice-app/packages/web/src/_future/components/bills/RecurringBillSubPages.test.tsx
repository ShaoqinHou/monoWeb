// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  RecurringBillDetailPage,
  RecurringBillEditPage,
  RecurringBillCreatePage,
} from '../routes/RecurringBillSubPages';
import type { RecurringBill } from '../hooks/useRecurringBills';

const mockNavigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...rest }: any) => <a href={to} {...rest}>{children}</a>,
  useParams: () => ({ recurringBillId: 'rb-1' }),
  useNavigate: () => mockNavigate,
}));

// Mock @shared/calc imports used by BillLineItems -> BillLineRow -> BillTotals
vi.mock('@shared/calc/line-item-calc', () => ({
  calcLineItem: () => ({ lineAmount: 0, taxAmount: 0 }),
}));

vi.mock('@shared/calc/invoice-calc', () => ({
  calcInvoiceTotals: () => ({ subTotal: 0, totalTax: 0, total: 0 }),
}));

vi.mock('@shared/calc/currency', () => ({
  formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
}));

const SAMPLE_BILL: RecurringBill = {
  id: 'rb-1',
  templateName: 'Monthly Office Rent',
  contactId: 'c-101',
  contactName: 'Landlord Properties',
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
};

const PAUSED_BILL: RecurringBill = {
  ...SAMPLE_BILL,
  id: 'rb-2',
  templateName: 'Weekly Cleaning',
  status: 'paused',
};

const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockFetchBill(bill: RecurringBill | null) {
  if (bill) {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, data: bill }),
    });
  } else {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: false, error: 'Not found' }),
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

/* ══════════════════════════════════════
   RecurringBillDetailPage
   ══════════════════════════════════════ */
describe('RecurringBillDetailPage', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockNavigate.mockReset();
  });

  it('shows loading state initially', () => {
    mockFetchBill(SAMPLE_BILL);
    render(<RecurringBillDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('rb-detail-loading')).toBeInTheDocument();
  });

  it('renders bill template name as page title', async () => {
    mockFetchBill(SAMPLE_BILL);
    render(<RecurringBillDetailPage />, { wrapper: createWrapper() });
    expect(await screen.findByRole('heading', { level: 1, name: 'Monthly Office Rent' })).toBeInTheDocument();
  });

  it('renders breadcrumbs with Recurring Bills link', async () => {
    mockFetchBill(SAMPLE_BILL);
    render(<RecurringBillDetailPage />, { wrapper: createWrapper() });
    expect(await screen.findByText('Recurring Bills')).toBeInTheDocument();
    expect(screen.getByText('Purchases')).toBeInTheDocument();
  });

  it('renders the status badge', async () => {
    mockFetchBill(SAMPLE_BILL);
    render(<RecurringBillDetailPage />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('rb-detail-status')).toHaveTextContent('Active');
  });

  it('renders supplier name', async () => {
    mockFetchBill(SAMPLE_BILL);
    render(<RecurringBillDetailPage />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('rb-detail-contact')).toHaveTextContent('Landlord Properties');
  });

  it('renders schedule summary', async () => {
    mockFetchBill(SAMPLE_BILL);
    render(<RecurringBillDetailPage />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('rb-schedule-summary')).toBeInTheDocument();
    expect(screen.getByTestId('rb-detail-frequency')).toHaveTextContent('Monthly');
    expect(screen.getByTestId('rb-detail-next-date')).toHaveTextContent('2026-03-01');
    expect(screen.getByTestId('rb-detail-end-date')).toHaveTextContent('No end date');
  });

  it('renders totals', async () => {
    mockFetchBill(SAMPLE_BILL);
    render(<RecurringBillDetailPage />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('rb-detail-subtotal')).toHaveTextContent('NZD 2000.00');
    expect(screen.getByTestId('rb-detail-tax')).toHaveTextContent('NZD 300.00');
    expect(screen.getByTestId('rb-detail-total')).toHaveTextContent('NZD 2300.00');
  });

  it('renders action buttons for active bill', async () => {
    mockFetchBill(SAMPLE_BILL);
    render(<RecurringBillDetailPage />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('rb-detail-actions')).toBeInTheDocument();
    expect(screen.getByTestId('rb-pause-resume-btn')).toHaveTextContent('Pause');
    expect(screen.getByTestId('rb-edit-btn')).toHaveTextContent('Edit');
    expect(screen.getByTestId('rb-generate-btn')).toHaveTextContent('Generate Bill Now');
  });

  it('shows Resume button for paused bill', async () => {
    mockFetchBill(PAUSED_BILL);
    render(<RecurringBillDetailPage />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('rb-pause-resume-btn')).toHaveTextContent('Resume');
  });

  it('shows not found for invalid ID', async () => {
    mockFetchBill(null);
    render(<RecurringBillDetailPage />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('rb-not-found')).toHaveTextContent('Recurring bill not found');
  });

  it('renders times generated count', async () => {
    mockFetchBill(SAMPLE_BILL);
    render(<RecurringBillDetailPage />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('rb-detail-times-generated')).toHaveTextContent('5');
  });
});

/* ══════════════════════════════════════
   RecurringBillEditPage
   ══════════════════════════════════════ */
describe('RecurringBillEditPage', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockNavigate.mockReset();
  });

  it('shows loading state initially', () => {
    mockFetchBill(SAMPLE_BILL);
    render(<RecurringBillEditPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('rb-edit-loading')).toBeInTheDocument();
  });

  it('renders Edit Recurring Bill title', async () => {
    mockFetchBill(SAMPLE_BILL);
    render(<RecurringBillEditPage />, { wrapper: createWrapper() });
    expect(await screen.findByRole('heading', { level: 1, name: 'Edit Recurring Bill' })).toBeInTheDocument();
  });

  it('pre-fills form with existing bill data', async () => {
    mockFetchBill(SAMPLE_BILL);
    render(<RecurringBillEditPage />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('rb-template-name')).toHaveValue('Monthly Office Rent');
    expect(screen.getByTestId('rb-contact-name')).toHaveValue('Landlord Properties');
    expect(screen.getByTestId('rb-next-date')).toHaveValue('2026-03-01');
  });

  it('shows not found for invalid ID', async () => {
    mockFetchBill(null);
    render(<RecurringBillEditPage />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('rb-not-found')).toHaveTextContent('Recurring bill not found');
  });

  it('renders the form for editing', async () => {
    mockFetchBill(SAMPLE_BILL);
    render(<RecurringBillEditPage />, { wrapper: createWrapper() });
    expect(await screen.findByTestId('recurring-bill-form')).toBeInTheDocument();
  });
});

/* ══════════════════════════════════════
   RecurringBillCreatePage
   ══════════════════════════════════════ */
describe('RecurringBillCreatePage', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockNavigate.mockReset();
  });

  it('renders New Recurring Bill title', () => {
    render(<RecurringBillCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByRole('heading', { level: 1, name: 'New Recurring Bill' })).toBeInTheDocument();
  });

  it('renders breadcrumbs', () => {
    render(<RecurringBillCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByText('Recurring Bills')).toBeInTheDocument();
    expect(screen.getByText('Purchases')).toBeInTheDocument();
  });

  it('renders an empty form', () => {
    render(<RecurringBillCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('recurring-bill-form')).toBeInTheDocument();
    expect(screen.getByTestId('rb-template-name')).toHaveValue('');
    expect(screen.getByTestId('rb-contact-name')).toHaveValue('');
  });

  it('renders save button', () => {
    render(<RecurringBillCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('rb-save-btn')).toHaveTextContent('Save');
  });

  it('submits creation and navigates to list on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, data: { id: 'rb-new', templateName: 'New Template' } }),
    });

    render(<RecurringBillCreatePage />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByTestId('rb-template-name'), { target: { value: 'New Template' } });
    fireEvent.change(screen.getByTestId('rb-contact-name'), { target: { value: 'New Supplier' } });
    fireEvent.change(screen.getByTestId('line-description-0'), { target: { value: 'Service' } });
    fireEvent.change(screen.getByTestId('line-unit-price-0'), { target: { value: '500' } });

    fireEvent.click(screen.getByTestId('rb-save-btn'));

    // Wait for mutation
    await screen.findByTestId('recurring-bill-form');

    // Verify the fetch was called with correct endpoint
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/recurring-bills',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
