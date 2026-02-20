// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockNavigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ quoteId: 'q-1' }),
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

const mockUseQuote = vi.fn();
const mockCreateMutate = vi.fn();
const mockUpdateMutate = vi.fn();
const mockTransitionMutate = vi.fn();
const mockConvertMutate = vi.fn();

vi.mock('../hooks/useQuotes', () => ({
  useQuotes: () => ({ data: [], isLoading: false }),
  useQuote: (...args: unknown[]) => mockUseQuote(...args),
  useCreateQuote: () => ({ mutate: mockCreateMutate, isPending: false }),
  useUpdateQuote: () => ({ mutate: mockUpdateMutate, isPending: false }),
  useTransitionQuote: () => ({ mutate: mockTransitionMutate, isPending: false }),
  useConvertQuote: () => ({ mutate: mockConvertMutate, isPending: false }),
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

import { QuoteDetailPage, QuoteEditPage, QuoteCreatePage } from '../routes/QuoteSubPages';

const SAMPLE_QUOTE = {
  id: 'q-1',
  quoteNumber: 'QU-0001',
  reference: 'REF-100',
  contactId: 'ct-1',
  contactName: 'Acme Corporation',
  status: 'draft' as const,
  title: 'Web Development Proposal',
  summary: 'Proposal for redesigning the company website',
  currency: 'NZD',
  date: '2024-01-15',
  expiryDate: '2024-02-14',
  subTotal: 6000,
  totalTax: 900,
  total: 6900,
  convertedInvoiceId: null,
  createdAt: '2024-01-15T10:00:00.000Z',
  updatedAt: '2024-01-15T10:00:00.000Z',
  lineItems: [
    {
      id: 'li-1',
      description: 'Web Development Services',
      quantity: 40,
      unitPrice: 150,
      taxRate: 15,
      taxAmount: 900,
      lineAmount: 6000,
      discount: 0,
    },
  ],
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

/* ════════════════════════════════════════════
   QuoteDetailPage
   ════════════════════════════════════════════ */
describe('QuoteDetailPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockTransitionMutate.mockClear();
    mockConvertMutate.mockClear();
    mockUseQuote.mockReturnValue({
      data: SAMPLE_QUOTE,
      isLoading: false,
      error: null,
    });
  });

  it('renders the quote detail view', () => {
    render(<QuoteDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('quote-detail')).toBeInTheDocument();
  });

  it('shows the quote status badge', () => {
    render(<QuoteDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('quote-status-badge')).toBeInTheDocument();
  });

  it('shows the contact name', () => {
    render(<QuoteDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('detail-contact')).toHaveTextContent('Acme Corporation');
  });

  it('shows the quote number', () => {
    render(<QuoteDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('detail-number')).toHaveTextContent('QU-0001');
  });

  it('displays subtotal', () => {
    render(<QuoteDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('detail-subtotal')).toBeInTheDocument();
  });

  it('displays total', () => {
    render(<QuoteDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('detail-total')).toBeInTheDocument();
  });

  it('shows the title when present', () => {
    render(<QuoteDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('detail-title')).toHaveTextContent('Web Development Proposal');
  });

  it('shows the Edit button for draft quote', () => {
    render(<QuoteDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('edit-quote-button')).toBeInTheDocument();
  });

  it('shows the Send action for draft quote', () => {
    render(<QuoteDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('action-send')).toBeInTheDocument();
  });

  it('switches to inline edit mode when Edit is clicked', () => {
    render(<QuoteDetailPage />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByTestId('edit-quote-button'));
    // Inline edit mode shows the quote form instead of navigating
    expect(screen.getByTestId('quote-form')).toBeInTheDocument();
    // A Cancel button should appear
    expect(screen.getByTestId('cancel-edit-button')).toBeInTheDocument();
  });

  it('shows Convert to Invoice button for accepted quotes', () => {
    mockUseQuote.mockReturnValue({
      data: { ...SAMPLE_QUOTE, status: 'accepted' },
      isLoading: false,
      error: null,
    });
    render(<QuoteDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('convert-quote-button')).toBeInTheDocument();
  });

  it('does not show Edit button for non-draft quotes', () => {
    mockUseQuote.mockReturnValue({
      data: { ...SAMPLE_QUOTE, status: 'sent' },
      isLoading: false,
      error: null,
    });
    render(<QuoteDetailPage />, { wrapper: createWrapper() });
    expect(screen.queryByTestId('edit-quote-button')).not.toBeInTheDocument();
  });

  it('shows Accept/Decline actions for sent quotes', () => {
    mockUseQuote.mockReturnValue({
      data: { ...SAMPLE_QUOTE, status: 'sent' },
      isLoading: false,
      error: null,
    });
    render(<QuoteDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('action-accept')).toBeInTheDocument();
    expect(screen.getByTestId('action-decline')).toBeInTheDocument();
  });

  it('shows "Quote not found" when quote is null', () => {
    mockUseQuote.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });
    render(<QuoteDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('quote-not-found')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseQuote.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });
    render(<QuoteDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('quote-detail-loading')).toBeInTheDocument();
  });

  it('renders breadcrumbs with "Quotes" link', () => {
    render(<QuoteDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Quotes')).toBeInTheDocument();
  });

  it('shows From and To sections', () => {
    render(<QuoteDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByText('From')).toBeInTheDocument();
    expect(screen.getByText('To')).toBeInTheDocument();
  });

  it('shows line items in the quote', () => {
    render(<QuoteDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Web Development Services')).toBeInTheDocument();
  });
});

/* ════════════════════════════════════════════
   QuoteEditPage — Now redirects to detail (edit route removed)
   ════════════════════════════════════════════ */
describe('QuoteEditPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockUpdateMutate.mockClear();
  });

  it('redirects to the detail page (edit route removed)', () => {
    render(<QuoteEditPage />, { wrapper: createWrapper() });
    // QuoteEditPage now attempts to redirect to the detail page
    expect(mockNavigate).toHaveBeenCalled();
  });
});

/* ════════════════════════════════════════════
   QuoteCreatePage
   ════════════════════════════════════════════ */
describe('QuoteCreatePage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockCreateMutate.mockClear();
  });

  it('renders the page title "New Quote"', () => {
    render(<QuoteCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByRole('heading', { name: 'New Quote' })).toBeInTheDocument();
  });

  it('renders the quote form', () => {
    render(<QuoteCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('quote-form')).toBeInTheDocument();
  });

  it('renders breadcrumbs with "Quotes" link', () => {
    render(<QuoteCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByText('Quotes')).toBeInTheDocument();
  });

  it('renders the contact selector', () => {
    render(<QuoteCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('form-contact')).toBeInTheDocument();
  });

  it('renders the title field', () => {
    render(<QuoteCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('form-title')).toBeInTheDocument();
  });

  it('renders the date and expiry date fields', () => {
    render(<QuoteCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('form-date')).toBeInTheDocument();
    expect(screen.getByTestId('form-expiry-date')).toBeInTheDocument();
  });

  it('renders the line items section', () => {
    render(<QuoteCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('invoice-line-items')).toBeInTheDocument();
  });

  it('renders the totals section', () => {
    render(<QuoteCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('invoice-totals')).toBeInTheDocument();
  });

  it('renders Save as Draft and Send Quote buttons', () => {
    render(<QuoteCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByText('Save as Draft')).toBeInTheDocument();
    expect(screen.getByText('Send Quote')).toBeInTheDocument();
  });

  it('calls create mutation when Save as Draft is clicked with a contact selected', () => {
    render(<QuoteCreatePage />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByTestId('form-contact'));
    fireEvent.click(screen.getByText('Acme Corporation'));
    fireEvent.click(screen.getByTestId('save-draft-button'));
    expect(mockCreateMutate).toHaveBeenCalledTimes(1);
    const [mutationData] = mockCreateMutate.mock.calls[0];
    expect(mutationData.contactId).toBe('ct-1');
    expect(mutationData.currency).toBe('NZD');
  });

  it('renders the summary text area', () => {
    render(<QuoteCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('form-summary')).toBeInTheDocument();
  });
});
