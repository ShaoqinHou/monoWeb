// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockNavigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ creditNoteId: 'cn-1' }),
}));

const mockUseCreditNote = vi.fn();
const mockCreateMutate = vi.fn();
const mockTransitionMutate = vi.fn();

vi.mock('../hooks/useCreditNotes', () => ({
  useCreditNotes: () => ({ data: [], isLoading: false }),
  useCreditNote: (...args: unknown[]) => mockUseCreditNote(...args),
  useCreateCreditNote: () => ({ mutate: mockCreateMutate, isPending: false }),
  useTransitionCreditNote: () => ({ mutate: mockTransitionMutate, isPending: false }),
  useApplyCreditNote: () => ({ mutate: vi.fn(), isPending: false }),
}));

import {
  CreditNoteDetailPage,
  CreditNoteEditPage,
  CreditNoteCreatePage,
} from '../../../_future/components/invoices/CreditNoteSubPages';

const SAMPLE_CREDIT_NOTE = {
  id: 'cn-1',
  creditNoteNumber: 'CN-0001',
  type: 'sales' as const,
  contactId: '00000000-0000-0000-0000-000000000101',
  contactName: 'Acme Corporation',
  linkedInvoiceId: 'inv-1',
  linkedBillId: null,
  status: 'draft' as const,
  date: '2024-01-20',
  subTotal: 500,
  totalTax: 75,
  total: 575,
  remainingCredit: 575,
  createdAt: '2024-01-20T10:00:00.000Z',
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
   CreditNoteDetailPage
   ════════════════════════════════════════════ */
describe('CreditNoteDetailPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockTransitionMutate.mockClear();
    mockUseCreditNote.mockReturnValue({
      data: SAMPLE_CREDIT_NOTE,
      isLoading: false,
      error: null,
    });
  });

  it('renders the credit note detail view', () => {
    render(<CreditNoteDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('credit-note-detail')).toBeInTheDocument();
  });

  it('shows the credit note status badge', () => {
    render(<CreditNoteDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('credit-note-status-badge')).toBeInTheDocument();
  });

  it('shows the contact name', () => {
    render(<CreditNoteDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('detail-contact')).toHaveTextContent('Acme Corporation');
  });

  it('shows the credit note number', () => {
    render(<CreditNoteDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('detail-number')).toHaveTextContent('CN-0001');
  });

  it('displays subtotal', () => {
    render(<CreditNoteDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('detail-subtotal')).toBeInTheDocument();
  });

  it('displays total', () => {
    render(<CreditNoteDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('detail-total')).toBeInTheDocument();
  });

  it('displays remaining credit', () => {
    render(<CreditNoteDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('detail-remaining')).toHaveTextContent('575.00');
  });

  it('shows the Edit button for draft credit note', () => {
    render(<CreditNoteDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('edit-credit-note-button')).toBeInTheDocument();
  });

  it('shows Submit for Approval action for draft credit note', () => {
    render(<CreditNoteDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('action-submit')).toBeInTheDocument();
  });

  it('shows Void action for draft credit note', () => {
    render(<CreditNoteDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('action-void')).toBeInTheDocument();
  });

  it('navigates to edit page when Edit is clicked', () => {
    render(<CreditNoteDetailPage />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByTestId('edit-credit-note-button'));
    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/sales/credit-notes/$creditNoteId/edit',
      params: { creditNoteId: 'cn-1' },
    });
  });

  it('does not show Edit button for non-draft credit notes', () => {
    mockUseCreditNote.mockReturnValue({
      data: { ...SAMPLE_CREDIT_NOTE, status: 'approved' },
      isLoading: false,
      error: null,
    });
    render(<CreditNoteDetailPage />, { wrapper: createWrapper() });
    expect(screen.queryByTestId('edit-credit-note-button')).not.toBeInTheDocument();
  });

  it('shows Approve action for submitted credit notes', () => {
    mockUseCreditNote.mockReturnValue({
      data: { ...SAMPLE_CREDIT_NOTE, status: 'submitted' },
      isLoading: false,
      error: null,
    });
    render(<CreditNoteDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('action-approve')).toBeInTheDocument();
  });

  it('shows Apply action for approved credit notes', () => {
    mockUseCreditNote.mockReturnValue({
      data: { ...SAMPLE_CREDIT_NOTE, status: 'approved' },
      isLoading: false,
      error: null,
    });
    render(<CreditNoteDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('action-apply')).toBeInTheDocument();
  });

  it('shows "Credit note not found" when credit note is null', () => {
    mockUseCreditNote.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });
    render(<CreditNoteDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('credit-note-not-found')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseCreditNote.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });
    render(<CreditNoteDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('credit-note-detail-loading')).toBeInTheDocument();
  });

  it('renders breadcrumbs with "Credit Notes" link', () => {
    render(<CreditNoteDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Credit Notes')).toBeInTheDocument();
  });

  it('shows From and To sections', () => {
    render(<CreditNoteDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByText('From')).toBeInTheDocument();
    expect(screen.getByText('To')).toBeInTheDocument();
  });

  it('shows the credit note type', () => {
    render(<CreditNoteDetailPage />, { wrapper: createWrapper() });
    expect(screen.getByText('sales')).toBeInTheDocument();
  });
});

/* ════════════════════════════════════════════
   CreditNoteEditPage
   ════════════════════════════════════════════ */
describe('CreditNoteEditPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockCreateMutate.mockClear();
    mockUseCreditNote.mockReturnValue({
      data: SAMPLE_CREDIT_NOTE,
      isLoading: false,
      error: null,
    });
  });

  it('renders the page title "Edit Credit Note"', () => {
    render(<CreditNoteEditPage />, { wrapper: createWrapper() });
    expect(screen.getByRole('heading', { name: 'Edit Credit Note' })).toBeInTheDocument();
  });

  it('renders the credit note form', () => {
    render(<CreditNoteEditPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('credit-note-form')).toBeInTheDocument();
  });

  it('pre-fills the contact from existing data', () => {
    render(<CreditNoteEditPage />, { wrapper: createWrapper() });
    const contactSelect = screen.getByTestId('form-contact');
    expect(contactSelect).toHaveValue('00000000-0000-0000-0000-000000000101');
  });

  it('pre-fills the type from existing data', () => {
    render(<CreditNoteEditPage />, { wrapper: createWrapper() });
    const typeSelect = screen.getByTestId('form-type');
    expect(typeSelect).toHaveValue('sales');
  });

  it('shows the existing credit note number', () => {
    render(<CreditNoteEditPage />, { wrapper: createWrapper() });
    const numberInput = screen.getByTestId('form-credit-note-number');
    expect(numberInput).toHaveValue('CN-0001');
  });

  it('shows loading state', () => {
    mockUseCreditNote.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });
    render(<CreditNoteEditPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('credit-note-edit-loading')).toBeInTheDocument();
  });

  it('shows "Credit note not found" when credit note is null', () => {
    mockUseCreditNote.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });
    render(<CreditNoteEditPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('credit-note-not-found')).toBeInTheDocument();
  });

  it('renders breadcrumbs with "Credit Notes" link', () => {
    render(<CreditNoteEditPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Credit Notes')).toBeInTheDocument();
  });

  it('renders Save as Draft and Submit buttons', () => {
    render(<CreditNoteEditPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Save as Draft')).toBeInTheDocument();
    expect(screen.getByText('Submit for Approval')).toBeInTheDocument();
  });
});

/* ════════════════════════════════════════════
   CreditNoteCreatePage
   ════════════════════════════════════════════ */
describe('CreditNoteCreatePage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockCreateMutate.mockClear();
  });

  it('renders the page title "New Credit Note"', () => {
    render(<CreditNoteCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByRole('heading', { name: 'New Credit Note' })).toBeInTheDocument();
  });

  it('renders the credit note form', () => {
    render(<CreditNoteCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('credit-note-form')).toBeInTheDocument();
  });

  it('renders breadcrumbs with "Credit Notes" link', () => {
    render(<CreditNoteCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByText('Credit Notes')).toBeInTheDocument();
  });

  it('renders the contact selector', () => {
    render(<CreditNoteCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('form-contact')).toBeInTheDocument();
  });

  it('renders the type selector', () => {
    render(<CreditNoteCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('form-type')).toBeInTheDocument();
  });

  it('renders the date field', () => {
    render(<CreditNoteCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('form-date')).toBeInTheDocument();
  });

  it('renders the amount fields', () => {
    render(<CreditNoteCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('form-subtotal')).toBeInTheDocument();
    expect(screen.getByTestId('form-total-tax')).toBeInTheDocument();
    expect(screen.getByTestId('form-total')).toBeInTheDocument();
  });

  it('renders Save as Draft and Submit buttons', () => {
    render(<CreditNoteCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByText('Save as Draft')).toBeInTheDocument();
    expect(screen.getByText('Submit for Approval')).toBeInTheDocument();
  });

  it('calls create mutation when Save as Draft is clicked with a contact selected', () => {
    render(<CreditNoteCreatePage />, { wrapper: createWrapper() });
    const contactSelect = screen.getByTestId('form-contact');
    fireEvent.change(contactSelect, {
      target: { value: '00000000-0000-0000-0000-000000000101' },
    });
    fireEvent.click(screen.getByTestId('save-draft-button'));
    expect(mockCreateMutate).toHaveBeenCalledTimes(1);
    const [mutationData] = mockCreateMutate.mock.calls[0];
    expect(mutationData.contactId).toBe('00000000-0000-0000-0000-000000000101');
    expect(mutationData.type).toBe('sales');
  });

  it('renders linked invoice and bill ID fields', () => {
    render(<CreditNoteCreatePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('form-linked-invoice')).toBeInTheDocument();
    expect(screen.getByTestId('form-linked-bill')).toBeInTheDocument();
  });
});
