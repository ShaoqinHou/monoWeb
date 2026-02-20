// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/* ── Router mock ── */
const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ invoiceId: '' }),
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

/* ── Invoices hooks mock ── */
const mockUseInvoices = vi.fn();
vi.mock('../hooks/useInvoices', () => ({
  useInvoices: (...args: unknown[]) => mockUseInvoices(...args),
  useInvoice: vi.fn().mockReturnValue({ data: null, isLoading: false }),
  useCreateInvoice: () => ({ mutate: vi.fn(), isPending: false }),
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

/* ── Quotes hooks mock ── */
vi.mock('../hooks/useQuotes', () => ({
  useQuotes: () => ({
    data: [
      {
        id: 'q-1',
        quoteNumber: 'QU-0001',
        contactId: 'c1',
        contactName: 'Acme Corp',
        status: 'draft',
        date: '2024-01-15',
        expiryDate: '2024-02-14',
        total: 1000,
        currency: 'NZD',
      },
      {
        id: 'q-2',
        quoteNumber: 'QU-0002',
        contactId: 'c2',
        contactName: 'Bay Ltd',
        status: 'sent',
        date: '2024-01-20',
        expiryDate: '2024-02-19',
        total: 2500,
        currency: 'NZD',
      },
    ],
    isLoading: false,
  }),
}));

import { InvoicesPage } from '../routes/InvoicesPage';
import { InvoiceForm } from '../components/InvoiceForm';
import { InvoiceRow } from '../components/InvoiceRow';
import { QuotesPage } from '../routes/QuotesPage';
import type { Invoice } from '../types';

const uuid = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;

const TEST_CONTACTS = [
  { value: 'ct-1', label: 'Acme Corporation' },
  { value: 'ct-2', label: 'Bay Industries Ltd' },
  { value: 'ct-3', label: 'Creative Solutions NZ' },
];

const SAMPLE_INVOICES: Invoice[] = [
  {
    id: uuid(1),
    invoiceNumber: 'INV-0001',
    contactId: uuid(101),
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
    id: uuid(2),
    invoiceNumber: 'INV-0002',
    contactId: uuid(102),
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
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

/* ================================================================
   1. INVOICES PAGE — Toolbar Buttons
   ================================================================ */
describe('InvoicesPage — Toolbar Buttons', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockUseInvoices.mockReturnValue({
      data: SAMPLE_INVOICES,
      isLoading: false,
      error: null,
    });
  });

  it('renders Send Statements button', () => {
    render(<InvoicesPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('send-statements-button')).toBeInTheDocument();
    expect(screen.getByText('Send Statements')).toBeInTheDocument();
  });

  it('renders Import button', () => {
    render(<InvoicesPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('import-invoices-button')).toBeInTheDocument();
  });

  it('renders Export button', () => {
    render(<InvoicesPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('export-invoices-button')).toBeInTheDocument();
  });

  it('renders Invoice Reminders toggle', () => {
    render(<InvoicesPage />, { wrapper: createWrapper() });
    const btn = screen.getByTestId('invoice-reminders-toggle');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent('Reminders Off');
    fireEvent.click(btn);
    expect(btn).toHaveTextContent('Reminders On');
  });

  it('renders Online Payments button', () => {
    render(<InvoicesPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('online-payments-button')).toBeInTheDocument();
    expect(screen.getByText('Online Payments')).toBeInTheDocument();
  });
});

/* ================================================================
   2. INVOICES PAGE — Advanced Search
   ================================================================ */
describe('InvoicesPage — Advanced Search', () => {
  beforeEach(() => {
    mockUseInvoices.mockReturnValue({
      data: SAMPLE_INVOICES,
      isLoading: false,
    });
  });

  it('shows advanced search toggle button', () => {
    render(<InvoicesPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('toggle-advanced-search')).toBeInTheDocument();
  });

  it('shows advanced search panel when toggle is clicked', () => {
    render(<InvoicesPage />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByTestId('toggle-advanced-search'));
    expect(screen.getByTestId('advanced-search-panel')).toBeInTheDocument();
    expect(screen.getByTestId('adv-number')).toBeInTheDocument();
    expect(screen.getByTestId('adv-contact')).toBeInTheDocument();
    expect(screen.getByTestId('adv-amount')).toBeInTheDocument();
    expect(screen.getByTestId('adv-start-date')).toBeInTheDocument();
    expect(screen.getByTestId('adv-end-date')).toBeInTheDocument();
    expect(screen.getByTestId('adv-unsent-only')).toBeInTheDocument();
    expect(screen.getByTestId('adv-include-deleted')).toBeInTheDocument();
  });
});

/* ================================================================
   3. INVOICE ROW — Ref and Paid columns
   ================================================================ */
describe('InvoiceRow — Ref and Paid columns', () => {
  it('displays reference in Ref column', () => {
    render(
      <table><tbody>
        <InvoiceRow invoice={SAMPLE_INVOICES[0]} onClick={vi.fn()} />
      </tbody></table>,
    );
    expect(screen.getByTestId(`invoice-ref-${uuid(1)}`)).toHaveTextContent('PO-2024-100');
  });

  it('displays paid amount in Paid column', () => {
    render(
      <table><tbody>
        <InvoiceRow invoice={SAMPLE_INVOICES[1]} onClick={vi.fn()} />
      </tbody></table>,
    );
    const paid = screen.getByTestId(`invoice-paid-${uuid(2)}`);
    expect(paid).toBeInTheDocument();
  });
});

/* ================================================================
   4. INVOICE FORM — Save & Close, Approve & Email dropdowns
   ================================================================ */
describe('InvoiceForm — Save & Close and Approve & Email', () => {
  function renderFormWithContact() {
    render(<InvoiceForm contacts={TEST_CONTACTS} onSaveDraft={vi.fn()} onSubmit={vi.fn()} />);
    // Select a contact via combobox to enable buttons
    fireEvent.click(screen.getByTestId('form-contact'));
    fireEvent.click(screen.getByText('Acme Corporation'));
    // Add a line item description so validation passes
    fireEvent.change(screen.getByTestId('line-description-0'), {
      target: { value: 'Test item' },
    });
  }

  it('renders Save & Close dropdown trigger', () => {
    render(<InvoiceForm contacts={TEST_CONTACTS} onSaveDraft={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByTestId('save-close-dropdown')).toBeInTheDocument();
    expect(screen.getByTestId('save-close-trigger')).toBeInTheDocument();
  });

  it('opens Save & Close menu on click', () => {
    renderFormWithContact();
    fireEvent.click(screen.getByTestId('save-close-trigger'));
    expect(screen.getByTestId('save-close-menu')).toBeInTheDocument();
    expect(screen.getByTestId('save-close-option')).toBeInTheDocument();
    expect(screen.getByTestId('save-add-another-option')).toBeInTheDocument();
  });

  it('renders Approve & Email dropdown trigger', () => {
    render(<InvoiceForm contacts={TEST_CONTACTS} onSaveDraft={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByTestId('approve-email-dropdown')).toBeInTheDocument();
    expect(screen.getByTestId('approve-email-trigger')).toBeInTheDocument();
  });

  it('opens Approve & Email menu on click', () => {
    renderFormWithContact();
    fireEvent.click(screen.getByTestId('approve-email-trigger'));
    expect(screen.getByTestId('approve-email-menu')).toBeInTheDocument();
    expect(screen.getByTestId('approve-email-option')).toBeInTheDocument();
    expect(screen.getByTestId('approve-online-option')).toBeInTheDocument();
    expect(screen.getByTestId('approve-print-option')).toBeInTheDocument();
  });
});

/* ================================================================
   5. INVOICE LINE ITEMS — New columns
   ================================================================ */
describe('InvoiceForm — Line item columns', () => {
  it('renders drag handle, Item, Tax Amt, Region, Project column headers', () => {
    render(<InvoiceForm contacts={TEST_CONTACTS} onSaveDraft={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByTestId('col-drag')).toBeInTheDocument();
    expect(screen.getByTestId('col-item')).toBeInTheDocument();
    expect(screen.getByTestId('col-tax-amount')).toBeInTheDocument();
    expect(screen.getByTestId('col-region')).toBeInTheDocument();
    expect(screen.getByTestId('col-project')).toBeInTheDocument();
  });

  it('renders per-line drag handle, item input, tax amount, region, project', () => {
    render(<InvoiceForm contacts={TEST_CONTACTS} onSaveDraft={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByTestId('line-drag-0')).toBeInTheDocument();
    expect(screen.getByTestId('line-item-0')).toBeInTheDocument();
    expect(screen.getByTestId('line-tax-amount-0')).toBeInTheDocument();
    expect(screen.getByTestId('line-region-0')).toBeInTheDocument();
    expect(screen.getByTestId('line-project-0')).toBeInTheDocument();
  });
});

/* ================================================================
   6. QUOTES PAGE — Tabs, Search, Filter, Toolbar
   ================================================================ */
describe('QuotesPage — Tabs, Search, Filter, Toolbar', () => {
  it('renders search input', () => {
    render(<QuotesPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('search-quotes')).toBeInTheDocument();
  });

  it('renders filter button next to search', () => {
    render(<QuotesPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('quote-filter-button')).toBeInTheDocument();
    expect(screen.getByText('Filter')).toBeInTheDocument();
  });

  it('renders status tabs (All, Draft, Sent, Declined, Accepted, Invoiced)', () => {
    render(<QuotesPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('quote-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('quote-tab-all')).toBeInTheDocument();
    expect(screen.getByTestId('quote-tab-draft')).toBeInTheDocument();
    expect(screen.getByTestId('quote-tab-sent')).toBeInTheDocument();
    expect(screen.getByTestId('quote-tab-declined')).toBeInTheDocument();
    expect(screen.getByTestId('quote-tab-accepted')).toBeInTheDocument();
    expect(screen.getByTestId('quote-tab-invoiced')).toBeInTheDocument();
  });

  it('renders "New quote" link and Shortcuts button in toolbar', () => {
    render(<QuotesPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('new-quote-button')).toHaveTextContent('New quote');
    expect(screen.getByTestId('shortcuts-button')).toBeInTheDocument();
  });

  it('renders breadcrumb with "Sales overview"', () => {
    render(<QuotesPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Sales overview')).toBeInTheDocument();
  });

  it('renders quote list data', () => {
    render(<QuotesPage />, { wrapper: createWrapper() });
    expect(screen.getByText('QU-0001')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('filters quotes when a tab is clicked', () => {
    render(<QuotesPage />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByTestId('quote-tab-draft'));
    // Should show the draft quote
    expect(screen.getByText('QU-0001')).toBeInTheDocument();
    // Sent quote should be filtered out
    expect(screen.queryByText('QU-0002')).not.toBeInTheDocument();
  });

  it('shows tab counts for each status', () => {
    render(<QuotesPage />, { wrapper: createWrapper() });
    // Draft tab should show count (1)
    expect(screen.getByTestId('quote-tab-draft')).toHaveTextContent('Draft');
    expect(screen.getByTestId('quote-tab-draft')).toHaveTextContent('(1)');
    // Sent tab should show count (1)
    expect(screen.getByTestId('quote-tab-sent')).toHaveTextContent('Sent');
    expect(screen.getByTestId('quote-tab-sent')).toHaveTextContent('(1)');
  });
});

/* ================================================================
   7. PAGINATION — Invoices page renders pagination
   ================================================================ */
describe('InvoicesPage — Pagination', () => {
  beforeEach(() => {
    mockUseInvoices.mockReturnValue({
      data: SAMPLE_INVOICES,
      isLoading: false,
    });
  });

  it('renders pagination controls', () => {
    render(<InvoicesPage />, { wrapper: createWrapper() });
    expect(screen.getByLabelText('Previous page')).toBeInTheDocument();
    expect(screen.getByLabelText('Next page')).toBeInTheDocument();
    expect(screen.getByLabelText('Page size')).toBeInTheDocument();
  });
});
