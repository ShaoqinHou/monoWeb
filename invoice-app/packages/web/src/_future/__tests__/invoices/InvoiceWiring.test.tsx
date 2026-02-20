// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock api-helpers BEFORE importing any component that uses them
vi.mock('../../../lib/api-helpers', () => ({
  apiFetch: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
}));

// Mock @xero-replica/shared for components that use it
vi.mock('@xero-replica/shared', () => ({
  calcLineItem: (input: { quantity: number; unitPrice: number; discount: number; taxRate: number }, _amountType: string) => {
    const discountMultiplier = 1 - input.discount / 100;
    const lineAmount = Math.round(input.quantity * input.unitPrice * discountMultiplier * 100) / 100;
    const taxAmount = Math.round(lineAmount * input.taxRate / 100 * 100) / 100;
    return { lineAmount, taxAmount };
  },
  calcInvoiceTotals: vi.fn(() => ({ subTotal: 0, totalTax: 0, total: 0 })),
  calcAmountDue: (total: number, paid: number) => total - paid,
  formatCurrency: (amount: number, _currency?: string) => `$${amount.toFixed(2)}`,
  DEFAULT_TAX_RATE: 15,
  INVOICE_NUMBER_PREFIX: 'INV-',
}));

import { apiPost } from '../../../lib/api-helpers';

// Polyfill crypto.randomUUID for jsdom
if (typeof crypto.randomUUID !== 'function') {
  Object.defineProperty(crypto, 'randomUUID', {
    value: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    }),
  });
}

const createQueryWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

/* ================================================================
   1. Recurring Invoice Auto-Creation (useGenerateRecurringInvoice)
   ================================================================ */
describe('Feature 1: Recurring invoice auto-creation', () => {
  beforeEach(() => vi.resetAllMocks());

  it('useGenerateRecurringInvoice calls POST /recurring-invoices/:id/generate', async () => {
    vi.mocked(apiPost).mockResolvedValueOnce({ id: 'new-inv', invoiceNumber: 'INV-0001' });

    const { useGenerateRecurringInvoice } = await import('../hooks/useRecurringInvoices');
    const Wrapper = createQueryWrapper();
    let mutateAsync: (id: string) => Promise<unknown>;

    function TestComponent() {
      const mutation = useGenerateRecurringInvoice();
      mutateAsync = mutation.mutateAsync;
      return <div data-testid="status">{mutation.status}</div>;
    }

    render(<TestComponent />, { wrapper: Wrapper });

    await waitFor(async () => {
      await mutateAsync!('rec-1');
    });

    expect(apiPost).toHaveBeenCalledWith('/recurring-invoices/rec-1/generate', {});
  });

  it('RecurringInvoiceDetail renders Generate Invoice Now button for active invoices', async () => {
    const { RecurringInvoiceDetail } = await import('../components/RecurringInvoiceDetail');
    const invoice = {
      id: 'rec-1',
      templateName: 'Monthly Report',
      contactId: 'c-1',
      contactName: 'Acme',
      frequency: 'monthly' as const,
      nextDate: '2025-04-01',
      endDate: null,
      daysUntilDue: 30,
      status: 'active' as const,
      subTotal: 1000,
      totalTax: 150,
      total: 1150,
      timesGenerated: 3,
      createdAt: '2024-01-01T00:00:00Z',
    };

    render(
      <RecurringInvoiceDetail
        invoice={invoice}
        onEdit={vi.fn()}
        onPauseResume={vi.fn()}
        onGenerate={vi.fn()}
      />,
    );

    const button = screen.getByTestId('generate-invoice-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Generate Invoice Now');
    expect(button).not.toBeDisabled();
  });
});

/* ================================================================
   2. Email Compose Sends (useSendInvoiceEmail)
   ================================================================ */
describe('Feature 2: Email compose sends', () => {
  beforeEach(() => vi.resetAllMocks());

  it('useSendInvoiceEmail calls POST /invoices/:id/email', async () => {
    vi.mocked(apiPost).mockResolvedValueOnce({ ok: true, sentAt: '2025-01-15T10:00:00Z' });

    const { useSendInvoiceEmail } = await import('../hooks/useSendInvoiceEmail');
    const Wrapper = createQueryWrapper();
    let mutateAsync: (args: { invoiceId: string; to: string; subject: string; body: string }) => Promise<unknown>;

    function TestComponent() {
      const mutation = useSendInvoiceEmail();
      mutateAsync = mutation.mutateAsync;
      return <div data-testid="status">{mutation.status}</div>;
    }

    render(<TestComponent />, { wrapper: Wrapper });

    await waitFor(async () => {
      const result = await mutateAsync!({
        invoiceId: 'inv-1',
        to: 'test@example.com',
        subject: 'Invoice',
        body: 'Please pay',
      });
      expect(result).toEqual({ ok: true, sentAt: '2025-01-15T10:00:00Z' });
    });

    expect(apiPost).toHaveBeenCalledWith('/invoices/inv-1/email', {
      to: 'test@example.com',
      subject: 'Invoice',
      body: 'Please pay',
    });
  });

  it('EmailComposeDialog renders send button with invoiceId prop', async () => {
    const { EmailComposeDialog } = await import('../components/EmailComposeDialog');
    const onClose = vi.fn();
    const Wrapper = createQueryWrapper();

    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <EmailComposeDialog open={true} onClose={onClose} invoiceId="inv-1" />
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('email-send-button')).toBeInTheDocument();
  });
});

/* ================================================================
   3. Bulk Email Sends (useBulkEmail)
   ================================================================ */
describe('Feature 3: Bulk email sends', () => {
  beforeEach(() => vi.resetAllMocks());

  it('useBulkEmail calls POST /invoices/bulk-email with invoice IDs', async () => {
    vi.mocked(apiPost).mockResolvedValueOnce({ ok: true, sentCount: 3 });

    const { useBulkEmail } = await import('../hooks/useBulkEmail');
    const Wrapper = createQueryWrapper();
    let mutateAsync: (args: { invoiceIds: string[]; subject: string }) => Promise<unknown>;

    function TestComponent() {
      const mutation = useBulkEmail();
      mutateAsync = mutation.mutateAsync;
      return <div data-testid="status">{mutation.status}</div>;
    }

    render(<TestComponent />, { wrapper: Wrapper });

    await waitFor(async () => {
      const result = await mutateAsync!({
        invoiceIds: ['inv-1', 'inv-2', 'inv-3'],
        subject: 'Your invoices',
      });
      expect(result).toEqual({ ok: true, sentCount: 3 });
    });

    expect(apiPost).toHaveBeenCalledWith('/invoices/bulk-email', {
      invoiceIds: ['inv-1', 'inv-2', 'inv-3'],
      subject: 'Your invoices',
    });
  });
});

/* ================================================================
   4. PDF Download
   ================================================================ */
describe('Feature 4: PDF download', () => {
  it('InvoicePDFPreview renders Download PDF button', async () => {
    const { InvoicePDFPreview } = await import('../components/InvoicePDFPreview');
    const invoice = {
      id: 'inv-1',
      invoiceNumber: 'INV-0001',
      contactName: 'Acme Corp',
      contactId: 'c-1',
      status: 'submitted' as const,
      amountType: 'exclusive' as const,
      currency: 'NZD',
      date: '2024-03-01',
      dueDate: '2024-03-31',
      reference: '',
      lineItems: [
        { id: 'li-1', description: 'Work', quantity: 10, unitPrice: 100, taxRate: 15, taxAmount: 150, lineAmount: 1000, discount: 0, accountCode: '200' },
      ],
      subTotal: 1000,
      totalTax: 150,
      total: 1150,
      amountDue: 1150,
      amountPaid: 0,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    render(<InvoicePDFPreview invoice={invoice} open={true} onClose={vi.fn()} />);

    const downloadButton = screen.getByTestId('download-pdf-button');
    expect(downloadButton).toBeInTheDocument();
    expect(downloadButton).toHaveTextContent('Download PDF');
  });
});

/* ================================================================
   5. Invoice Numbering Auto-Gen (already in API)
   ================================================================ */
describe('Feature 5: Invoice numbering auto-gen', () => {
  it('useCreateInvoice sends data without invoiceNumber — server auto-generates', async () => {
    vi.mocked(apiPost).mockResolvedValueOnce({ id: 'inv-new', invoiceNumber: 'INV-0005' });

    const { useCreateInvoice } = await import('../hooks/useInvoices');
    const Wrapper = createQueryWrapper();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mutateAsync: any;

    function TestComponent() {
      const mutation = useCreateInvoice();
      mutateAsync = mutation.mutateAsync;
      return <div data-testid="status">{mutation.status}</div>;
    }

    render(<TestComponent />, { wrapper: Wrapper });

    const createData = {
      contactId: 'c-1',
      date: '2024-03-01',
      dueDate: '2024-03-31',
      lineItems: [{ description: 'Work', quantity: 1, unitPrice: 100 }],
    };

    await waitFor(async () => {
      const result = await mutateAsync!(createData);
      expect(result).toEqual(expect.objectContaining({ invoiceNumber: 'INV-0005' }));
    });

    // Verify no invoiceNumber was sent in the payload
    expect(apiPost).toHaveBeenCalledWith('/invoices', createData);
  });
});

/* ================================================================
   6. Multiple Tax Rates Per Line
   ================================================================ */
describe('Feature 6: Multiple tax rates per line', () => {
  it('TAX_RATE_OPTIONS has 5 entries (0%, 5%, 10%, 15%, 20%)', async () => {
    const { TAX_RATE_OPTIONS } = await import('../components/InvoiceLineRow');
    expect(TAX_RATE_OPTIONS).toHaveLength(5);
    expect(TAX_RATE_OPTIONS.map((o: { value: string }) => o.value)).toEqual(['0', '5', '10', '15', '20']);
  });

  it('Tax rate select renders all 5 options in the DOM', async () => {
    const { InvoiceLineRow } = await import('../components/InvoiceLineRow');
    const line = {
      key: 'k-1',
      description: 'Test',
      quantity: 1,
      unitPrice: 100,
      accountCode: '200',
      taxRate: 15,
      discount: 0,
      discountType: 'percent' as const,
    };

    render(
      <table><tbody>
        <InvoiceLineRow line={line} index={0} amountType="exclusive" canRemove={false} onChange={vi.fn()} onRemove={vi.fn()} />
      </tbody></table>,
    );

    const taxSelect = screen.getByTestId('line-tax-0');
    const options = taxSelect.querySelectorAll('option');
    expect(options.length).toBe(5);
  });
});

/* ================================================================
   7. Discount Per Line (% or Fixed)
   ================================================================ */
describe('Feature 7: Discount per line (% or fixed)', () => {
  it('InvoiceLineRow renders discount input and type toggle showing %', async () => {
    const { InvoiceLineRow } = await import('../components/InvoiceLineRow');
    const line = {
      key: 'k-1', description: 'Service', quantity: 2, unitPrice: 100,
      accountCode: '200', taxRate: 15, discount: 10, discountType: 'percent' as const,
    };

    render(
      <table><tbody>
        <InvoiceLineRow line={line} index={0} amountType="exclusive" canRemove={false} onChange={vi.fn()} onRemove={vi.fn()} />
      </tbody></table>,
    );

    expect(screen.getByTestId('line-discount-0')).toBeInTheDocument();
    expect(screen.getByTestId('line-discount-type-0')).toHaveTextContent('%');
  });

  it('clicking discount type toggle calls onChange with "fixed"', async () => {
    const { InvoiceLineRow } = await import('../components/InvoiceLineRow');
    const onChange = vi.fn();
    const line = {
      key: 'k-1', description: 'Service', quantity: 2, unitPrice: 100,
      accountCode: '200', taxRate: 15, discount: 10, discountType: 'percent' as const,
    };

    render(
      <table><tbody>
        <InvoiceLineRow line={line} index={0} amountType="exclusive" canRemove={false} onChange={onChange} onRemove={vi.fn()} />
      </tbody></table>,
    );

    fireEvent.click(screen.getByTestId('line-discount-type-0'));
    expect(onChange).toHaveBeenCalledWith(0, 'discountType', 'fixed');
  });
});

/* ================================================================
   8. Quote Expiry Enforcement
   ================================================================ */
describe('Feature 8: Quote expiry enforcement', () => {
  it('QuoteForm includes expiry date field', async () => {
    const { QuoteForm } = await import('../components/QuoteForm');
    render(<QuoteForm onSaveDraft={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByTestId('form-expiry-date')).toBeInTheDocument();
  });
});

/* ================================================================
   9. Payment Links
   ================================================================ */
describe('Feature 9: Payment links', () => {
  it('PaymentLinkBadge generates URL from invoiceId', async () => {
    const { PaymentLinkBadge } = await import('../components/PaymentLinkBadge');
    render(<PaymentLinkBadge invoiceId="inv-ABC" />);
    expect(screen.getByTestId('payment-link-url')).toHaveTextContent('https://pay.xero.com/inv-ABC');
  });

  it('Copy button shows "Copied!" after click', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    const { PaymentLinkBadge } = await import('../components/PaymentLinkBadge');
    render(<PaymentLinkBadge invoiceId="inv-123" />);

    expect(screen.getByTestId('copy-link-button')).toHaveTextContent('Copy');
    fireEvent.click(screen.getByTestId('copy-link-button'));

    await waitFor(() => {
      expect(screen.getByTestId('copy-link-button')).toHaveTextContent('Copied!');
    });

    expect(writeText).toHaveBeenCalledWith('https://pay.xero.com/inv-123');
  });
});

/* ================================================================
   10. Recurring Bill Auto-Creation (useGenerateRecurringBill)
   ================================================================ */
describe('Feature 10: Recurring bill auto-creation', () => {
  beforeEach(() => vi.resetAllMocks());

  it('useGenerateRecurringBill calls POST /recurring-bills/:id/generate', async () => {
    vi.mocked(apiPost).mockResolvedValueOnce({ id: 'new-bill', billNumber: 'BILL-0001' });

    const { useGenerateRecurringBill } = await import('../../bills/hooks/useRecurringBills');
    const Wrapper = createQueryWrapper();
    let mutateAsync: (id: string) => Promise<unknown>;

    function TestComponent() {
      const mutation = useGenerateRecurringBill();
      mutateAsync = mutation.mutateAsync;
      return <div data-testid="status">{mutation.status}</div>;
    }

    render(<TestComponent />, { wrapper: Wrapper });

    await waitFor(async () => {
      await mutateAsync!('rec-bill-1');
    });

    expect(apiPost).toHaveBeenCalledWith('/recurring-bills/rec-bill-1/generate', {});
  });
});
