// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockNavigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ invoiceId: '' }),
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

const mockMutate = vi.fn();

vi.mock('../hooks/useInvoices', () => ({
  useInvoices: () => ({ data: [], isLoading: false }),
  useInvoice: () => ({ data: null, isLoading: false }),
  useCreateInvoice: () => ({ mutate: mockMutate, isPending: false }),
  useUpdateInvoice: () => ({ mutate: vi.fn(), isPending: false }),
  useTransitionInvoice: () => ({ mutate: vi.fn(), isPending: false }),
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

vi.mock('../../contacts/hooks/useContacts', () => ({
  useContacts: () => ({
    data: [
      { id: 'ct-1', name: 'Acme Corporation', type: 'customer', email: '', phone: '', isArchived: false },
      { id: 'ct-2', name: 'Bay Industries Ltd', type: 'customer', email: '', phone: '', isArchived: false },
      { id: 'ct-3', name: 'Creative Solutions NZ', type: 'customer', email: '', phone: '', isArchived: false },
    ],
    isLoading: false,
  }),
}));

import { InvoiceCreatePage } from '../routes/InvoicesPage';

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

describe('InvoiceCreatePage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockMutate.mockClear();
  });

  it('renders the page title "New Invoice"', () => {
    render(<InvoiceCreatePage />, { wrapper: createWrapper() });
    const heading = screen.getByRole('heading', { name: 'New Invoice' });
    expect(heading).toBeInTheDocument();
  });

  it('renders the invoice form', () => {
    render(<InvoiceCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('invoice-form')).toBeInTheDocument();
  });

  it('renders breadcrumbs with "Invoices" link', () => {
    render(<InvoiceCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByText('Invoices')).toBeInTheDocument();
  });

  it('renders the contact selector', () => {
    render(<InvoiceCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('form-contact')).toBeInTheDocument();
  });

  it('renders the line items section', () => {
    render(<InvoiceCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('invoice-line-items')).toBeInTheDocument();
  });

  it('renders the totals section', () => {
    render(<InvoiceCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('invoice-totals')).toBeInTheDocument();
  });

  it('renders the notes field', () => {
    render(<InvoiceCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('form-notes')).toBeInTheDocument();
  });

  it('renders Save as Draft and Submit buttons', () => {
    render(<InvoiceCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByText('Save as Draft')).toBeInTheDocument();
    expect(screen.getByText('Submit for Approval')).toBeInTheDocument();
  });

  it('starts with one empty line item', () => {
    render(<InvoiceCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('line-row-0')).toBeInTheDocument();
    expect(screen.queryByTestId('line-row-1')).not.toBeInTheDocument();
  });

  it('can add a line item via Add row button', () => {
    render(<InvoiceCreatePage />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByTestId('add-line-button'));
    expect(screen.getByTestId('line-row-1')).toBeInTheDocument();
  });

  it('renders amount type selector with Tax Exclusive default', () => {
    render(<InvoiceCreatePage />, { wrapper: createWrapper() });
    const selectEl = screen.getByTestId('form-amount-type');
    expect(selectEl).toHaveValue('exclusive');
  });

  it('has date and due date fields', () => {
    render(<InvoiceCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('form-date')).toBeInTheDocument();
    expect(screen.getByTestId('form-due-date')).toBeInTheDocument();
  });

  it('calls create mutation when Save as Draft is clicked with a contact selected', () => {
    render(<InvoiceCreatePage />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByTestId('form-contact'));
    fireEvent.click(screen.getByText('Acme Corporation'));
    // Add a line item description so validation passes
    fireEvent.change(screen.getByTestId('line-description-0'), {
      target: { value: 'Test item' },
    });
    fireEvent.click(screen.getByTestId('save-draft-button'));
    expect(mockMutate).toHaveBeenCalledTimes(1);
    const [mutationData] = mockMutate.mock.calls[0];
    expect(mutationData.contactId).toBe('ct-1');
    expect(mutationData.currency).toBe('NZD');
  });
});
