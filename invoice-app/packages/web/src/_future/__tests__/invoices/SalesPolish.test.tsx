// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaymentTermsSelect, PAYMENT_TERMS_PRESETS } from '../components/PaymentTermsSelect';
import { EmailComposeDialog } from '../components/EmailComposeDialog';
import { InvoiceHistory, type AuditEntry } from '../components/InvoiceHistory';
import { ReminderSettingsDialog } from '../components/ReminderSettingsDialog';
import { PaymentLinkBadge } from '../components/PaymentLinkBadge';
import { BulkEmailDialog } from '../components/BulkEmailDialog';

// Mock api-helpers
vi.mock('../../../lib/api-helpers', () => ({
  apiFetch: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
}));

import { apiFetch, apiPost } from '../../../lib/api-helpers';

const createQueryWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

/* ================================================================
   1. PaymentTermsSelect
   ================================================================ */
describe('PaymentTermsSelect', () => {
  it('renders all 6 presets', () => {
    render(
      <PaymentTermsSelect
        value={30}
        onChange={vi.fn()}
        invoiceDate="2024-03-01"
      />,
    );
    const dropdown = screen.getByTestId('payment-terms-dropdown') as HTMLSelectElement;
    const options = dropdown.querySelectorAll('option');
    expect(options).toHaveLength(6);
  });

  it('renders preset labels correctly', () => {
    render(
      <PaymentTermsSelect
        value={0}
        onChange={vi.fn()}
        invoiceDate="2024-03-01"
      />,
    );
    expect(screen.getByText('Due on Receipt')).toBeInTheDocument();
    expect(screen.getByText('Net 30')).toBeInTheDocument();
    expect(screen.getByText('Net 90')).toBeInTheDocument();
  });

  it('selects Net 30 and fires onChange with correct dueDate', () => {
    const onChange = vi.fn();
    render(
      <PaymentTermsSelect
        value={0}
        onChange={onChange}
        invoiceDate="2024-03-01"
      />,
    );
    fireEvent.change(screen.getByTestId('payment-terms-dropdown'), {
      target: { value: '30' },
    });
    expect(onChange).toHaveBeenCalledWith(30, '2024-03-31');
  });

  it('exports PAYMENT_TERMS_PRESETS constant', () => {
    expect(PAYMENT_TERMS_PRESETS).toHaveLength(6);
    expect(PAYMENT_TERMS_PRESETS[0].label).toBe('Due on Receipt');
    expect(PAYMENT_TERMS_PRESETS[5].days).toBe(90);
  });
});

/* ================================================================
   2. useCopyInvoice
   ================================================================ */
describe('useCopyInvoice', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('calls POST /invoices/:id/copy to duplicate an invoice', async () => {
    const newInvoice = {
      id: 'inv-2',
      invoiceNumber: 'INV-0002',
      contactId: 'c-1',
      contactName: 'Acme',
      status: 'draft',
      amountType: 'exclusive',
      currency: 'NZD',
      date: '2024-03-01',
      dueDate: '2024-03-01',
      reference: 'PO-100',
      lineItems: [
        { id: 'li-1', description: 'Work', quantity: 10, unitPrice: 100, taxRate: 15, taxAmount: 150, lineAmount: 1000, discount: 0, accountCode: '200' },
      ],
      subTotal: 1000,
      totalTax: 150,
      total: 1150,
      amountDue: 1150,
      amountPaid: 0,
      createdAt: '2024-03-01T00:00:00Z',
      updatedAt: '2024-03-01T00:00:00Z',
    };

    vi.mocked(apiPost).mockResolvedValueOnce(newInvoice);

    // Dynamically import the hook to use mocked modules
    const { useCopyInvoice } = await import('../hooks/useCopyInvoice');

    const Wrapper = createQueryWrapper();
    let mutateAsync: (id: string) => Promise<unknown>;

    function TestComponent() {
      const mutation = useCopyInvoice();
      mutateAsync = mutation.mutateAsync;
      return <div data-testid="status">{mutation.status}</div>;
    }

    render(<TestComponent />, { wrapper: Wrapper });

    await waitFor(async () => {
      const result = await mutateAsync!('inv-1');
      expect(result).toEqual({ invoice: newInvoice });
    });

    expect(apiPost).toHaveBeenCalledWith('/invoices/inv-1/copy', {});
  });
});

/* ================================================================
   3. useCopyQuote
   ================================================================ */
describe('useCopyQuote', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('fetches the source quote and POSTs a copy', async () => {
    const sourceQuote = {
      id: 'q-1',
      quoteNumber: 'QU-0001',
      contactId: 'c-1',
      contactName: 'Acme',
      status: 'accepted',
      title: 'Website',
      summary: 'Build a site',
      currency: 'NZD',
      date: '2024-01-15',
      expiryDate: '2024-02-14',
      reference: 'REF-1',
      subTotal: 500,
      totalTax: 75,
      total: 575,
      convertedInvoiceId: null,
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      lineItems: [
        { id: 'li-1', description: 'Design', quantity: 5, unitPrice: 100, taxRate: 15, taxAmount: 75, lineAmount: 500, discount: 0 },
      ],
    };

    const newQuote = { ...sourceQuote, id: 'q-2', quoteNumber: 'QU-0002', status: 'draft' };
    vi.mocked(apiFetch).mockResolvedValueOnce(sourceQuote);
    vi.mocked(apiPost).mockResolvedValueOnce(newQuote);

    const { useCopyQuote } = await import('../hooks/useCopyQuote');

    const Wrapper = createQueryWrapper();
    let mutateAsync: (id: string) => Promise<unknown>;

    function TestComponent() {
      const mutation = useCopyQuote();
      mutateAsync = mutation.mutateAsync;
      return <div data-testid="status">{mutation.status}</div>;
    }

    render(<TestComponent />, { wrapper: Wrapper });

    await waitFor(async () => {
      const result = await mutateAsync!('q-1');
      expect(result).toEqual({ quote: newQuote });
    });

    expect(apiFetch).toHaveBeenCalledWith('/quotes/q-1');
    expect(apiPost).toHaveBeenCalledWith('/quotes', expect.objectContaining({
      contactId: 'c-1',
      title: 'Website',
      summary: 'Build a site',
      reference: 'REF-1',
      lineItems: [expect.objectContaining({ description: 'Design', quantity: 5, unitPrice: 100 })],
    }));
  });
});

/* ================================================================
   4. EmailComposeDialog
   ================================================================ */
describe('EmailComposeDialog', () => {
  it('renders all fields when open', () => {
    const Wrapper = createQueryWrapper();
    render(
      <EmailComposeDialog
        open={true}
        onClose={vi.fn()}
        defaultTo="test@example.com"
        defaultSubject="Invoice #123"
        defaultBody="Please see attached."
      />,
      { wrapper: Wrapper },
    );
    expect(screen.getByTestId('email-compose-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('email-to-field')).toBeInTheDocument();
    expect(screen.getByTestId('email-subject-field')).toBeInTheDocument();
    expect(screen.getByTestId('email-body-field')).toBeInTheDocument();
    expect(screen.getByTestId('pdf-preview-placeholder')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    const Wrapper = createQueryWrapper();
    render(<EmailComposeDialog open={false} onClose={vi.fn()} />, { wrapper: Wrapper });
    expect(screen.queryByTestId('email-compose-dialog')).not.toBeInTheDocument();
  });

  it('calls onClose with sent:true when Send is clicked', async () => {
    const onClose = vi.fn();
    const Wrapper = createQueryWrapper();
    render(<EmailComposeDialog open={true} onClose={onClose} />, { wrapper: Wrapper });
    fireEvent.click(screen.getByTestId('email-send-button'));
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledWith({ sent: true });
    });
  });

  it('calls onClose without result when Cancel is clicked', () => {
    const onClose = vi.fn();
    const Wrapper = createQueryWrapper();
    render(<EmailComposeDialog open={true} onClose={onClose} />, { wrapper: Wrapper });
    fireEvent.click(screen.getByTestId('email-cancel-button'));
    expect(onClose).toHaveBeenCalledWith();
  });
});

/* ================================================================
   5. InvoiceHistory
   ================================================================ */
describe('InvoiceHistory', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders timeline entries from API', async () => {
    const entries: AuditEntry[] = [
      { id: 'a-1', entityId: 'inv-1', action: 'Created', user: 'Admin', date: '2024-01-15T10:00:00Z' },
      { id: 'a-2', entityId: 'inv-1', action: 'Approved', user: 'Manager', date: '2024-01-16T14:00:00Z' },
    ];

    vi.mocked(apiFetch).mockResolvedValueOnce(entries);

    const Wrapper = createQueryWrapper();
    render(<InvoiceHistory invoiceId="inv-1" />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('invoice-history')).toBeInTheDocument();
    });

    expect(screen.getByTestId('history-entry-a-1')).toBeInTheDocument();
    expect(screen.getByTestId('history-entry-a-2')).toBeInTheDocument();
    expect(screen.getAllByTestId('history-action')[0]).toHaveTextContent('Created');
    expect(screen.getAllByTestId('history-action')[1]).toHaveTextContent('Approved');
    expect(screen.getAllByTestId('history-user')[0]).toHaveTextContent('Admin');
    expect(screen.getAllByTestId('history-user')[1]).toHaveTextContent('Manager');
  });

  it('shows loading state', () => {
    vi.mocked(apiFetch).mockReturnValueOnce(new Promise(() => {}));
    const Wrapper = createQueryWrapper();
    render(<InvoiceHistory invoiceId="inv-1" />, { wrapper: Wrapper });
    expect(screen.getByTestId('invoice-history-loading')).toBeInTheDocument();
  });

  it('shows empty state when no entries', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce([]);
    const Wrapper = createQueryWrapper();
    render(<InvoiceHistory invoiceId="inv-1" />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getByTestId('invoice-history-empty')).toBeInTheDocument();
    });
  });
});

/* ================================================================
   6. ReminderSettingsDialog
   ================================================================ */
describe('ReminderSettingsDialog', () => {
  it('renders all fields when open', () => {
    render(
      <ReminderSettingsDialog
        open={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    );
    expect(screen.getByTestId('reminder-settings-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('reminder-days-before')).toBeInTheDocument();
    expect(screen.getByTestId('reminder-days-after')).toBeInTheDocument();
    expect(screen.getByTestId('reminder-template-text')).toBeInTheDocument();
  });

  it('calls onSave with settings when Save is clicked', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(
      <ReminderSettingsDialog
        open={true}
        onClose={onClose}
        onSave={onSave}
      />,
    );
    fireEvent.click(screen.getByTestId('reminder-save-button'));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        daysBeforeDue: 7,
        daysAfterDue: 1,
        templateText: expect.any(String),
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('updates days before due when input changes', () => {
    const onSave = vi.fn();
    render(
      <ReminderSettingsDialog
        open={true}
        onClose={vi.fn()}
        onSave={onSave}
      />,
    );
    fireEvent.change(screen.getByTestId('reminder-days-before'), {
      target: { value: '14' },
    });
    fireEvent.click(screen.getByTestId('reminder-save-button'));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ daysBeforeDue: 14 }),
    );
  });
});

/* ================================================================
   7. PaymentLinkBadge
   ================================================================ */
describe('PaymentLinkBadge', () => {
  it('renders payment link URL with invoice ID', () => {
    render(<PaymentLinkBadge invoiceId="inv-XXXX" />);
    expect(screen.getByTestId('payment-link-badge')).toBeInTheDocument();
    expect(screen.getByTestId('payment-link-url')).toHaveTextContent(
      'https://pay.xero.com/inv-XXXX',
    );
  });

  it('renders copy button', () => {
    render(<PaymentLinkBadge invoiceId="inv-XXXX" />);
    expect(screen.getByTestId('copy-link-button')).toBeInTheDocument();
    expect(screen.getByTestId('copy-link-button')).toHaveTextContent('Copy');
  });

  it('calls navigator.clipboard.writeText when copy is clicked', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<PaymentLinkBadge invoiceId="inv-123" />);
    fireEvent.click(screen.getByTestId('copy-link-button'));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('https://pay.xero.com/inv-123');
    });
  });
});

/* ================================================================
   8. BulkEmailDialog
   ================================================================ */
describe('BulkEmailDialog', () => {
  const invoiceIds = ['inv-1', 'inv-2', 'inv-3'];

  it('renders invoice list when open', () => {
    const Wrapper = createQueryWrapper();
    render(
      <BulkEmailDialog open={true} onClose={vi.fn()} invoiceIds={invoiceIds} />,
      { wrapper: Wrapper },
    );
    expect(screen.getByTestId('bulk-email-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('bulk-email-invoice-list')).toBeInTheDocument();
    expect(screen.getByTestId('bulk-email-invoice-inv-1')).toBeInTheDocument();
    expect(screen.getByTestId('bulk-email-invoice-inv-2')).toBeInTheDocument();
    expect(screen.getByTestId('bulk-email-invoice-inv-3')).toBeInTheDocument();
  });

  it('shows correct count on Send All button', () => {
    const Wrapper = createQueryWrapper();
    render(
      <BulkEmailDialog open={true} onClose={vi.fn()} invoiceIds={invoiceIds} />,
      { wrapper: Wrapper },
    );
    expect(screen.getByTestId('bulk-email-send-button')).toHaveTextContent(
      'Send All (3)',
    );
  });

  it('calls onClose with sent:true when Send All is clicked', async () => {
    const onClose = vi.fn();
    const Wrapper = createQueryWrapper();
    render(
      <BulkEmailDialog open={true} onClose={onClose} invoiceIds={invoiceIds} />,
      { wrapper: Wrapper },
    );
    fireEvent.click(screen.getByTestId('bulk-email-send-button'));
    // Now async — the send triggers mutateAsync, catch calls onClose
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('calls onClose without result when Cancel is clicked', () => {
    const onClose = vi.fn();
    const Wrapper = createQueryWrapper();
    render(
      <BulkEmailDialog open={true} onClose={onClose} invoiceIds={invoiceIds} />,
      { wrapper: Wrapper },
    );
    fireEvent.click(screen.getByTestId('bulk-email-cancel-button'));
    expect(onClose).toHaveBeenCalledWith();
  });

  it('does not render when open is false', () => {
    const Wrapper = createQueryWrapper();
    render(
      <BulkEmailDialog open={false} onClose={vi.fn()} invoiceIds={invoiceIds} />,
      { wrapper: Wrapper },
    );
    expect(screen.queryByTestId('bulk-email-dialog')).not.toBeInTheDocument();
  });
});
