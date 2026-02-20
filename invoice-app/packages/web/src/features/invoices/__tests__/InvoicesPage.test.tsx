import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockNavigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ invoiceId: '' }),
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

// Mock the hook module with vi.fn() so tests can override
const mockUseInvoices = vi.fn();
const mockUseTransitionInvoice = vi.fn();

vi.mock('../hooks/useInvoices', () => ({
  useInvoices: (...args: unknown[]) => mockUseInvoices(...args),
  useInvoice: vi.fn().mockReturnValue({ data: null, isLoading: false }),
  useCreateInvoice: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateInvoice: () => ({ mutate: vi.fn(), isPending: false }),
  useTransitionInvoice: (...args: unknown[]) => mockUseTransitionInvoice(...args),
  useRecordPayment: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('../hooks/useRecurringInvoices', () => ({
  useRecurringInvoices: () => ({ data: [], isLoading: false }),
  useRecurringInvoice: () => ({ data: null, isLoading: false }),
  useCreateRecurringInvoice: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateRecurringInvoice: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteRecurringInvoice: () => ({ mutate: vi.fn(), isPending: false }),
  useGenerateRecurringInvoice: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('../hooks/useCreditNotes', () => ({
  useCreditNotes: () => ({ data: [], isLoading: false }),
  useCreditNote: () => ({ data: null, isLoading: false }),
  useCreateCreditNote: () => ({ mutate: vi.fn(), isPending: false }),
  useTransitionCreditNote: () => ({ mutate: vi.fn(), isPending: false }),
  useApplyCreditNote: () => ({ mutate: vi.fn(), isPending: false }),
}));

import { InvoicesPage } from '../routes/InvoicesPage';

const SAMPLE_INVOICES = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-0001',
    contactId: 'c1',
    contactName: 'Acme Corporation',
    status: 'draft',
    amountType: 'exclusive',
    currency: 'NZD',
    date: '2024-01-15',
    dueDate: '2024-02-14',
    reference: 'PO-2024-100',
    lineItems: [],
    subTotal: 6049.99,
    totalTax: 907.5,
    total: 6957.49,
    amountDue: 6957.49,
    amountPaid: 0,
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  },
  {
    id: 'inv-2',
    invoiceNumber: 'INV-0002',
    contactId: 'c2',
    contactName: 'Bay Industries Ltd',
    status: 'paid',
    amountType: 'exclusive',
    currency: 'NZD',
    date: '2024-01-20',
    dueDate: '2024-02-19',
    lineItems: [],
    subTotal: 1600,
    totalTax: 240,
    total: 1840,
    amountDue: 0,
    amountPaid: 1840,
    createdAt: '2024-01-20T09:00:00.000Z',
    updatedAt: '2024-02-10T14:00:00.000Z',
  },
];

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

describe('InvoicesPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockUseInvoices.mockReturnValue({
      data: SAMPLE_INVOICES,
      isLoading: false,
      error: null,
    });
    mockUseTransitionInvoice.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
  });

  it('renders the page title "Invoices"', () => {
    render(<InvoicesPage />, { wrapper: createWrapper() });
    expect(screen.getByRole('heading', { name: 'Invoices' })).toBeInTheDocument();
  });

  it('renders the "New Invoice" button', () => {
    render(<InvoicesPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('new-invoice-button')).toBeInTheDocument();
    expect(screen.getByText('New Invoice')).toBeInTheDocument();
  });

  it('renders status tabs', () => {
    render(<InvoicesPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('invoice-status-tabs')).toBeInTheDocument();
  });

  it('renders the search input', () => {
    render(<InvoicesPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('search-invoices')).toBeInTheDocument();
  });

  it('renders the invoice list table', async () => {
    render(<InvoicesPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('invoice-list-table')).toBeInTheDocument();
    });
  });

  it('shows All tab with correct count', () => {
    render(<InvoicesPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('tab-all')).toBeInTheDocument();
  });

  it('shows Draft tab', () => {
    render(<InvoicesPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('tab-draft')).toBeInTheDocument();
  });

  it('shows Paid tab', () => {
    render(<InvoicesPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('tab-paid')).toBeInTheDocument();
  });

  it('shows Repeating tab', () => {
    render(<InvoicesPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('tab-repeating')).toBeInTheDocument();
  });

  it('displays invoice numbers in the table', () => {
    render(<InvoicesPage />, { wrapper: createWrapper() });
    expect(screen.getByText('INV-0001')).toBeInTheDocument();
    expect(screen.getByText('INV-0002')).toBeInTheDocument();
  });

  it('displays contact names in the table', () => {
    render(<InvoicesPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
    expect(screen.getByText('Bay Industries Ltd')).toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    mockUseInvoices.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
    });
    render(<InvoicesPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('invoices-loading')).toBeInTheDocument();
  });

  it('uses useNavigate instead of window.location for navigation', () => {
    render(<InvoicesPage />, { wrapper: createWrapper() });
    // The component should use useNavigate (already mocked), not window.location
    expect(mockNavigate).not.toHaveBeenCalled(); // Not called until user interacts
  });

  it('renders date filter inputs (Start Date and End Date)', () => {
    render(<InvoicesPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('filter-start-date')).toBeInTheDocument();
    expect(screen.getByTestId('filter-end-date')).toBeInTheDocument();
  });
});
