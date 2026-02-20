// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InvoiceForm, CURRENCY_OPTIONS, DEFAULT_EXCHANGE_RATES } from '../components/InvoiceForm';
import { ReminderSettingsForm } from '../components/ReminderSettingsForm';
import { InvoiceList } from '../components/InvoiceList';
import type { Invoice } from '../types';

// Mock api-helpers
vi.mock('../../../lib/api-helpers', () => ({
  apiFetch: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
}));

import { apiFetch, apiPost, apiPut } from '../../../lib/api-helpers';

const uuid = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;

const createQueryWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const SAMPLE_INVOICES: Invoice[] = [
  {
    id: uuid(1),
    invoiceNumber: 'INV-0001',
    contactId: uuid(101),
    contactName: 'Acme Corporation',
    status: 'submitted',
    amountType: 'exclusive',
    currency: 'NZD',
    date: '2024-01-15',
    dueDate: '2024-02-14',
    reference: 'PO-100',
    lineItems: [],
    subTotal: 1000,
    totalTax: 150,
    total: 1150,
    amountDue: 1150,
    amountPaid: 0,
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  },
  {
    id: uuid(2),
    invoiceNumber: 'INV-0002',
    contactId: uuid(102),
    contactName: 'Bay Industries Ltd',
    status: 'draft',
    amountType: 'exclusive',
    currency: 'NZD',
    date: '2024-01-20',
    dueDate: '2024-02-19',
    lineItems: [],
    subTotal: 500,
    totalTax: 75,
    total: 575,
    amountDue: 575,
    amountPaid: 0,
    createdAt: '2024-01-20T09:00:00.000Z',
    updatedAt: '2024-01-20T09:00:00.000Z',
  },
  {
    id: uuid(3),
    invoiceNumber: 'INV-0003',
    contactId: uuid(103),
    contactName: 'Creative Solutions NZ',
    status: 'submitted',
    amountType: 'exclusive',
    currency: 'USD',
    date: '2024-02-01',
    dueDate: '2024-03-02',
    lineItems: [],
    subTotal: 2000,
    totalTax: 300,
    total: 2300,
    amountDue: 2300,
    amountPaid: 0,
    createdAt: '2024-02-01T08:30:00.000Z',
    updatedAt: '2024-02-01T08:30:00.000Z',
  },
];

/* ================================================================
   1. MULTI-CURRENCY INVOICES
   ================================================================ */
describe('Multi-Currency Invoices', () => {
  const defaultFormProps = {
    onSaveDraft: vi.fn(),
    onSubmit: vi.fn(),
  };

  it('renders currency selector with NZD as default', () => {
    render(<InvoiceForm {...defaultFormProps} />);
    const currencySelect = screen.getByTestId('form-currency');
    expect(currencySelect).toBeInTheDocument();
    expect(currencySelect).toHaveValue('NZD');
  });

  it('provides all 5 currency options: NZD, AUD, USD, GBP, EUR', () => {
    expect(CURRENCY_OPTIONS).toHaveLength(5);
    expect(CURRENCY_OPTIONS.map((c) => c.value)).toEqual(['NZD', 'AUD', 'USD', 'GBP', 'EUR']);
  });

  it('shows exchange rate info when non-NZD currency is selected', () => {
    render(<InvoiceForm {...defaultFormProps} />);
    // Initially NZD — no exchange rate shown
    expect(screen.queryByTestId('exchange-rate-info')).not.toBeInTheDocument();

    // Switch to USD
    fireEvent.change(screen.getByTestId('form-currency'), {
      target: { value: 'USD' },
    });
    expect(screen.getByTestId('exchange-rate-info')).toBeInTheDocument();
    expect(screen.getByTestId('exchange-rate-info')).toHaveTextContent('1 NZD = 0.62 USD');
  });

  it('includes currency field in form data when saved', () => {
    const onSaveDraft = vi.fn();
    render(<InvoiceForm onSaveDraft={onSaveDraft} onSubmit={vi.fn()} />);

    // Select a contact
    fireEvent.change(screen.getByTestId('form-contact'), {
      target: { value: '00000000-0000-0000-0000-000000000101' },
    });
    // Change currency to GBP
    fireEvent.change(screen.getByTestId('form-currency'), {
      target: { value: 'GBP' },
    });
    fireEvent.click(screen.getByTestId('save-draft-button'));
    const data = onSaveDraft.mock.calls[0][0];
    expect(data.currency).toBe('GBP');
  });

  it('exports DEFAULT_EXCHANGE_RATES constant with numeric rates', () => {
    expect(DEFAULT_EXCHANGE_RATES).toBeDefined();
    expect(DEFAULT_EXCHANGE_RATES['NZD']).toBe(1.0);
    expect(DEFAULT_EXCHANGE_RATES['USD']).toBe(0.62);
    expect(DEFAULT_EXCHANGE_RATES['GBP']).toBe(0.49);
    expect(DEFAULT_EXCHANGE_RATES['EUR']).toBe(0.57);
    expect(DEFAULT_EXCHANGE_RATES['AUD']).toBe(0.93);
  });
});

/* ================================================================
   2. COPY/DUPLICATE INVOICE (via server endpoint)
   ================================================================ */
describe('useCopyInvoice (server-side copy)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('calls POST /invoices/:id/copy and returns new invoice', async () => {
    const copiedInvoice = {
      id: 'inv-new',
      invoiceNumber: 'INV-0099',
      contactId: 'c-1',
      contactName: 'Acme',
      status: 'draft',
      amountType: 'exclusive',
      currency: 'NZD',
      date: '2024-03-01',
      dueDate: '2024-03-01',
      reference: 'PO-100',
      lineItems: [],
      subTotal: 1000,
      totalTax: 150,
      total: 1150,
      amountDue: 1150,
      amountPaid: 0,
      createdAt: '2024-03-01T00:00:00Z',
      updatedAt: '2024-03-01T00:00:00Z',
    };

    vi.mocked(apiPost).mockResolvedValueOnce(copiedInvoice);

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
      expect(result).toEqual({ invoice: copiedInvoice });
    });

    expect(apiPost).toHaveBeenCalledWith('/invoices/inv-1/copy', {});
  });
});

/* ================================================================
   3. APPLY CREDIT NOTE TO INVOICE
   ================================================================ */
describe('useApplyCreditToInvoice', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('calls POST /invoices/:id/apply-credit with creditNoteId and amount', async () => {
    const result = {
      invoiceId: 'inv-1',
      creditNoteId: 'cn-1',
      amount: 200,
      newAmountDue: 800,
      newRemainingCredit: 300,
    };

    vi.mocked(apiPost).mockResolvedValueOnce(result);

    const { useApplyCreditToInvoice } = await import('../hooks/useApplyCreditToInvoice');

    const Wrapper = createQueryWrapper();
    let mutateAsync: (params: { invoiceId: string; creditNoteId: string; amount: number }) => Promise<unknown>;

    function TestComponent() {
      const mutation = useApplyCreditToInvoice();
      mutateAsync = mutation.mutateAsync;
      return <div data-testid="status">{mutation.status}</div>;
    }

    render(<TestComponent />, { wrapper: Wrapper });

    await waitFor(async () => {
      const res = await mutateAsync!({
        invoiceId: 'inv-1',
        creditNoteId: 'cn-1',
        amount: 200,
      });
      expect(res).toEqual(result);
    });

    expect(apiPost).toHaveBeenCalledWith('/invoices/inv-1/apply-credit', {
      creditNoteId: 'cn-1',
      amount: 200,
    });
  });
});

/* ================================================================
   4. INVOICE REMINDER SETTINGS FORM
   ================================================================ */
describe('ReminderSettingsForm', () => {
  it('renders with default before/after day values', () => {
    render(<ReminderSettingsForm onSave={vi.fn()} />);
    expect(screen.getByTestId('reminder-settings-form')).toBeInTheDocument();
    expect(screen.getByTestId('before-due-day-0')).toHaveValue(7);
    expect(screen.getByTestId('before-due-day-1')).toHaveValue(3);
    expect(screen.getByTestId('before-due-day-2')).toHaveValue(1);
    expect(screen.getByTestId('after-due-day-0')).toHaveValue(1);
    expect(screen.getByTestId('after-due-day-1')).toHaveValue(7);
    expect(screen.getByTestId('after-due-day-2')).toHaveValue(14);
  });

  it('calls onSave with settings when Save is clicked', () => {
    const onSave = vi.fn();
    render(<ReminderSettingsForm onSave={onSave} />);
    fireEvent.click(screen.getByTestId('save-reminder-settings'));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        daysBeforeDue: [7, 3, 1],
        daysAfterDue: [1, 7, 14],
        templateText: expect.any(String),
      }),
    );
  });

  it('can add and remove reminder days', () => {
    render(<ReminderSettingsForm onSave={vi.fn()} />);

    // Add a new "before due" day
    fireEvent.click(screen.getByTestId('add-before-day'));
    expect(screen.getByTestId('before-due-day-3')).toBeInTheDocument();

    // Remove the first "after due" day
    fireEvent.click(screen.getByTestId('remove-after-0'));
    expect(screen.queryByTestId('after-due-day-2')).not.toBeInTheDocument();
  });

  it('updates template text', () => {
    const onSave = vi.fn();
    render(<ReminderSettingsForm onSave={onSave} />);
    fireEvent.change(screen.getByTestId('reminder-template-input'), {
      target: { value: 'Custom reminder message' },
    });
    fireEvent.click(screen.getByTestId('save-reminder-settings'));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ templateText: 'Custom reminder message' }),
    );
  });
});

/* ================================================================
   5. useReminderSettings HOOK
   ================================================================ */
describe('useReminderSettings', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('fetches reminder settings from API', async () => {
    const settingsValue = {
      daysBeforeDue: [7, 3],
      daysAfterDue: [1, 14],
      templateText: 'Pay up',
    };
    vi.mocked(apiFetch).mockResolvedValueOnce({
      key: 'invoice.reminders',
      value: JSON.stringify(settingsValue),
    });

    const { useReminderSettings } = await import('../hooks/useReminderSettings');

    const Wrapper = createQueryWrapper();
    let data: unknown;

    function TestComponent() {
      const result = useReminderSettings();
      data = result.data;
      return <div data-testid="status">{result.status}</div>;
    }

    render(<TestComponent />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(data).toEqual(settingsValue);
    });

    expect(apiFetch).toHaveBeenCalledWith('/settings/invoice.reminders');
  });
});

/* ================================================================
   6. useSaveReminderSettings HOOK
   ================================================================ */
describe('useSaveReminderSettings', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('saves reminder settings via PUT to settings API', async () => {
    vi.mocked(apiPut).mockResolvedValueOnce({ ok: true });

    const { useSaveReminderSettings } = await import('../hooks/useReminderSettings');

    const Wrapper = createQueryWrapper();
    let mutateAsync: (settings: { daysBeforeDue: number[]; daysAfterDue: number[]; templateText: string }) => Promise<unknown>;

    function TestComponent() {
      const mutation = useSaveReminderSettings();
      mutateAsync = mutation.mutateAsync;
      return <div data-testid="status">{mutation.status}</div>;
    }

    render(<TestComponent />, { wrapper: Wrapper });

    const settings = { daysBeforeDue: [7], daysAfterDue: [1], templateText: 'Hello' };
    await waitFor(async () => {
      await mutateAsync!(settings);
    });

    expect(apiPut).toHaveBeenCalledWith('/settings/invoice.reminders', {
      value: JSON.stringify(settings),
    });
  });
});

/* ================================================================
   7. BULK APPROVE INVOICES
   ================================================================ */
describe('useBulkApproveInvoices', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('calls POST /invoices/bulk-approve with invoice IDs', async () => {
    const result = { approved: ['inv-1', 'inv-3'], skipped: ['inv-2'] };
    vi.mocked(apiPost).mockResolvedValueOnce(result);

    const { useBulkApproveInvoices } = await import('../hooks/useBulkApproveInvoices');

    const Wrapper = createQueryWrapper();
    let mutateAsync: (ids: string[]) => Promise<unknown>;

    function TestComponent() {
      const mutation = useBulkApproveInvoices();
      mutateAsync = mutation.mutateAsync;
      return <div data-testid="status">{mutation.status}</div>;
    }

    render(<TestComponent />, { wrapper: Wrapper });

    await waitFor(async () => {
      const res = await mutateAsync!(['inv-1', 'inv-2', 'inv-3']);
      expect(res).toEqual(result);
    });

    expect(apiPost).toHaveBeenCalledWith('/invoices/bulk-approve', {
      invoiceIds: ['inv-1', 'inv-2', 'inv-3'],
    });
  });
});

/* ================================================================
   8. BULK APPROVE UI — InvoiceList + Actions
   ================================================================ */
describe('Bulk Approve UI on InvoiceList', () => {
  it('shows bulk-action-approve in menu when items selected', () => {
    render(
      <InvoiceList
        invoices={SAMPLE_INVOICES}
        onInvoiceClick={vi.fn()}
        onBulkAction={vi.fn()}
      />,
    );
    // Select first invoice
    fireEvent.click(screen.getByTestId(`invoice-checkbox-${SAMPLE_INVOICES[0].id}`));
    fireEvent.click(screen.getByTestId('bulk-actions-button'));
    expect(screen.getByTestId('bulk-action-approve')).toBeInTheDocument();
  });

  it('calls onBulkAction with approve and selected submitted invoice IDs', () => {
    const onBulkAction = vi.fn();
    render(
      <InvoiceList
        invoices={SAMPLE_INVOICES}
        onInvoiceClick={vi.fn()}
        onBulkAction={onBulkAction}
      />,
    );
    // Select the two submitted invoices (index 0 and 2)
    fireEvent.click(screen.getByTestId(`invoice-checkbox-${SAMPLE_INVOICES[0].id}`));
    fireEvent.click(screen.getByTestId(`invoice-checkbox-${SAMPLE_INVOICES[2].id}`));
    fireEvent.click(screen.getByTestId('bulk-actions-button'));
    fireEvent.click(screen.getByTestId('bulk-action-approve'));
    expect(onBulkAction).toHaveBeenCalledWith(
      'approve',
      expect.arrayContaining([SAMPLE_INVOICES[0].id, SAMPLE_INVOICES[2].id]),
    );
  });
});
