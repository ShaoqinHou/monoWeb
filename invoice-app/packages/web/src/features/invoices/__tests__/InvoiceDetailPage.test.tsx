import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockNavigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ invoiceId: 'inv-1' }),
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

const mockUseInvoice = vi.fn();
const mockUseTransitionInvoice = vi.fn();
const mockUseRecordPayment = vi.fn();

vi.mock('../hooks/useInvoices', () => ({
  useInvoices: () => ({ data: [], isLoading: false }),
  useInvoice: (...args: unknown[]) => mockUseInvoice(...args),
  useCreateInvoice: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateInvoice: () => ({ mutate: vi.fn(), isPending: false }),
  useTransitionInvoice: (...args: unknown[]) => mockUseTransitionInvoice(...args),
  useRecordPayment: (...args: unknown[]) => mockUseRecordPayment(...args),
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

import { InvoiceDetailPage } from '../routes/InvoicesPage';

const SAMPLE_INVOICE = {
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
  lineItems: [
    {
      id: 'li-1',
      description: 'Web Development Services',
      quantity: 40,
      unitPrice: 150,
      accountCode: '200',
      taxRate: 15,
      taxAmount: 900,
      lineAmount: 6000,
      discount: 0,
    },
    {
      id: 'li-2',
      description: 'Hosting (Monthly)',
      quantity: 1,
      unitPrice: 49.99,
      accountCode: '200',
      taxRate: 15,
      taxAmount: 7.5,
      lineAmount: 49.99,
      discount: 0,
    },
  ],
  subTotal: 6049.99,
  totalTax: 907.5,
  total: 6957.49,
  amountDue: 6957.49,
  amountPaid: 0,
  createdAt: '2024-01-15T10:00:00.000Z',
  updatedAt: '2024-01-15T10:00:00.000Z',
};

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

describe('InvoiceDetailPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockUseInvoice.mockReturnValue({
      data: SAMPLE_INVOICE,
      isLoading: false,
      error: null,
    });
    mockUseTransitionInvoice.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    mockUseRecordPayment.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
  });

  it('renders the invoice detail view', () => {
    render(<InvoiceDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('invoice-detail')).toBeInTheDocument();
  });

  it('shows the invoice status badge', () => {
    render(<InvoiceDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('invoice-status-badge')).toBeInTheDocument();
  });

  it('shows the contact name', () => {
    render(<InvoiceDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('detail-contact')).toHaveTextContent('Acme Corporation');
  });

  it('shows the invoice number', () => {
    render(<InvoiceDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('detail-number')).toHaveTextContent('INV-0001');
  });

  it('displays subtotal', () => {
    render(<InvoiceDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('detail-subtotal')).toBeInTheDocument();
  });

  it('displays total', () => {
    render(<InvoiceDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('detail-total')).toBeInTheDocument();
  });

  it('displays amount due', () => {
    render(<InvoiceDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('detail-amount-due')).toBeInTheDocument();
  });

  it('shows action buttons for draft invoice', () => {
    render(<InvoiceDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('invoice-actions')).toBeInTheDocument();
    expect(screen.getByTestId('action-submitted')).toBeInTheDocument();
  });

  it('shows the Edit button for draft invoice', () => {
    render(<InvoiceDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('edit-invoice-button')).toBeInTheDocument();
  });

  it('renders breadcrumbs', () => {
    render(<InvoiceDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Invoices')).toBeInTheDocument();
  });

  it('shows line items in the invoice', () => {
    render(<InvoiceDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Web Development Services')).toBeInTheDocument();
    expect(screen.getByText('Hosting (Monthly)')).toBeInTheDocument();
  });

  it('shows From and To sections', () => {
    render(<InvoiceDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByText('From')).toBeInTheDocument();
    expect(screen.getByText('To')).toBeInTheDocument();
  });

  it('shows "Invoice not found" when invoice is null', () => {
    mockUseInvoice.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });
    render(<InvoiceDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('invoice-not-found')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseInvoice.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });
    render(<InvoiceDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('invoice-detail-loading')).toBeInTheDocument();
  });

  it('navigates to edit page via useNavigate when Edit is clicked', () => {
    render(<InvoiceDetailPage />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByTestId('edit-invoice-button'));
    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/sales/invoices/$invoiceId/edit',
      params: { invoiceId: 'inv-1' },
    });
  });

  it('shows Record Payment button when amountDue > 0 and status is approved', () => {
    mockUseInvoice.mockReturnValue({
      data: { ...SAMPLE_INVOICE, status: 'approved' },
      isLoading: false,
      error: null,
    });
    render(<InvoiceDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('record-payment-button')).toBeInTheDocument();
  });

  it('does not show Record Payment button for draft invoices', () => {
    render(<InvoiceDetailPage />, { wrapper: createWrapper() });
    expect(screen.queryByTestId('record-payment-button')).not.toBeInTheDocument();
  });

  it('shows payment form when Record Payment is clicked', () => {
    mockUseInvoice.mockReturnValue({
      data: { ...SAMPLE_INVOICE, status: 'approved' },
      isLoading: false,
      error: null,
    });
    render(<InvoiceDetailPage />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByTestId('record-payment-button'));
    expect(screen.getByTestId('payment-form')).toBeInTheDocument();
    expect(screen.getByTestId('payment-amount')).toBeInTheDocument();
    expect(screen.getByTestId('payment-date')).toBeInTheDocument();
    expect(screen.getByTestId('payment-reference')).toBeInTheDocument();
  });

  it('does not show Record Payment button when amountDue is 0', () => {
    mockUseInvoice.mockReturnValue({
      data: { ...SAMPLE_INVOICE, amountDue: 0, amountPaid: 6957.49, status: 'paid' },
      isLoading: false,
    });
    render(<InvoiceDetailPage />, { wrapper: createWrapper() });
    expect(screen.queryByTestId('record-payment-button')).not.toBeInTheDocument();
  });
});
