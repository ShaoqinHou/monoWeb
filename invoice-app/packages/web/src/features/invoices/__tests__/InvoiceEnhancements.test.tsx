// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  useNavigate: () => vi.fn(),
}));

import { InvoiceList, type BulkActionType } from '../components/InvoiceList';
import { InvoiceForm, RECURRING_OPTIONS } from '../components/InvoiceForm';
import { InvoicePDFPreview } from '../components/InvoicePDFPreview';
import { InvoiceRow } from '../components/InvoiceRow';
import { InvoiceDetail } from '../components/InvoiceDetail';
import type { Invoice, RecurringSchedule } from '../types';

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
  {
    id: uuid(3),
    invoiceNumber: 'INV-0003',
    contactId: uuid(103),
    contactName: 'Creative Solutions NZ',
    status: 'approved',
    amountType: 'exclusive',
    currency: 'NZD',
    date: '2024-02-01',
    dueDate: '2024-03-02',
    lineItems: [],
    subTotal: 4000,
    totalTax: 600,
    total: 4600,
    amountDue: 4600,
    amountPaid: 0,
    createdAt: '2024-02-01T08:30:00.000Z',
    updatedAt: '2024-02-01T08:30:00.000Z',
  },
];

const DETAILED_INVOICE: Invoice = {
  id: uuid(10),
  invoiceNumber: 'INV-0010',
  contactId: uuid(101),
  contactName: 'Acme Corporation',
  status: 'paid',
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
  amountDue: 0,
  amountPaid: 6957.49,
  createdAt: '2024-01-15T10:00:00.000Z',
  updatedAt: '2024-02-10T14:00:00.000Z',
};

/* ================================================================
   1. RECURRING INVOICE SETUP
   ================================================================ */
describe('Recurring Invoice — Form', () => {
  const defaultFormProps = {
    contacts: TEST_CONTACTS,
    onSaveDraft: vi.fn(),
    onSubmit: vi.fn(),
  };

  it('renders the Repeat dropdown with "None" as default', () => {
    render(<InvoiceForm {...defaultFormProps} />);
    const repeatSelect = screen.getByTestId('form-recurring');
    expect(repeatSelect).toBeInTheDocument();
    expect(repeatSelect).toHaveValue('none');
  });

  it('provides all recurring options: None, Weekly, Fortnightly, Monthly, Quarterly', () => {
    render(<InvoiceForm {...defaultFormProps} />);
    const repeatSelect = screen.getByTestId('form-recurring');
    const options = repeatSelect.querySelectorAll('option');
    const values = Array.from(options).map((o) => o.value);
    expect(values).toEqual(['none', 'weekly', 'fortnightly', 'monthly', 'quarterly']);
  });

  it('includes recurring field in form data when saved', () => {
    const onSaveDraft = vi.fn();
    render(<InvoiceForm contacts={TEST_CONTACTS} onSaveDraft={onSaveDraft} onSubmit={vi.fn()} />);

    // Select a contact via combobox (required for save)
    fireEvent.click(screen.getByTestId('form-contact'));
    fireEvent.click(screen.getByText('Acme Corporation'));

    // Add a line item description so validation passes
    fireEvent.change(screen.getByTestId('line-description-0'), {
      target: { value: 'Test item' },
    });

    // Change to monthly
    fireEvent.change(screen.getByTestId('form-recurring'), {
      target: { value: 'monthly' },
    });

    fireEvent.click(screen.getByTestId('save-draft-button'));
    expect(onSaveDraft).toHaveBeenCalledTimes(1);
    const data = onSaveDraft.mock.calls[0][0];
    expect(data.recurring).toBe('monthly');
  });

  it('defaults recurring to "none" in form data', () => {
    const onSaveDraft = vi.fn();
    render(<InvoiceForm contacts={TEST_CONTACTS} onSaveDraft={onSaveDraft} onSubmit={vi.fn()} />);
    // Select a contact via combobox (required for save)
    fireEvent.click(screen.getByTestId('form-contact'));
    fireEvent.click(screen.getByText('Acme Corporation'));
    // Add a line item description so validation passes
    fireEvent.change(screen.getByTestId('line-description-0'), {
      target: { value: 'Test item' },
    });
    fireEvent.click(screen.getByTestId('save-draft-button'));
    expect(onSaveDraft.mock.calls[0][0].recurring).toBe('none');
  });

  it('exports RECURRING_OPTIONS constant', () => {
    expect(RECURRING_OPTIONS).toHaveLength(5);
    expect(RECURRING_OPTIONS[0].value).toBe('none');
    expect(RECURRING_OPTIONS[4].value).toBe('quarterly');
  });
});

describe('Recurring Invoice — Row Icon', () => {
  it('shows recurring icon when invoice has a non-none schedule', () => {
    render(
      <table>
        <tbody>
          <InvoiceRow
            invoice={SAMPLE_INVOICES[0]}
            onClick={vi.fn()}
            recurring="monthly"
          />
        </tbody>
      </table>,
    );
    expect(screen.getByTestId(`recurring-icon-${SAMPLE_INVOICES[0].id}`)).toBeInTheDocument();
  });

  it('does not show recurring icon when schedule is none', () => {
    render(
      <table>
        <tbody>
          <InvoiceRow
            invoice={SAMPLE_INVOICES[0]}
            onClick={vi.fn()}
            recurring="none"
          />
        </tbody>
      </table>,
    );
    expect(screen.queryByTestId(`recurring-icon-${SAMPLE_INVOICES[0].id}`)).not.toBeInTheDocument();
  });

  it('does not show recurring icon when recurring is undefined', () => {
    render(
      <table>
        <tbody>
          <InvoiceRow invoice={SAMPLE_INVOICES[0]} onClick={vi.fn()} />
        </tbody>
      </table>,
    );
    expect(screen.queryByTestId(`recurring-icon-${SAMPLE_INVOICES[0].id}`)).not.toBeInTheDocument();
  });
});

/* ================================================================
   2. CREDIT NOTE SUPPORT
   ================================================================ */
describe('Credit Note — Row Badge', () => {
  it('shows credit note badge when isCreditNote is true', () => {
    render(
      <table>
        <tbody>
          <InvoiceRow
            invoice={SAMPLE_INVOICES[0]}
            onClick={vi.fn()}
            isCreditNote={true}
          />
        </tbody>
      </table>,
    );
    expect(screen.getByTestId(`credit-note-badge-${SAMPLE_INVOICES[0].id}`)).toBeInTheDocument();
    expect(screen.getByText('CN')).toBeInTheDocument();
  });

  it('does not show credit note badge when isCreditNote is false', () => {
    render(
      <table>
        <tbody>
          <InvoiceRow invoice={SAMPLE_INVOICES[0]} onClick={vi.fn()} />
        </tbody>
      </table>,
    );
    expect(screen.queryByTestId(`credit-note-badge-${SAMPLE_INVOICES[0].id}`)).not.toBeInTheDocument();
  });
});

describe('Credit Note — Detail Page Button', () => {
  it('shows "Create Credit Note" button for paid invoices', () => {
    render(
      <InvoiceDetail
        invoice={DETAILED_INVOICE}
        onTransition={vi.fn()}
        onEdit={vi.fn()}
        onCreateCreditNote={vi.fn()}
      />,
    );
    expect(screen.getByTestId('create-credit-note-button')).toBeInTheDocument();
    expect(screen.getByText('Create Credit Note')).toBeInTheDocument();
  });

  it('shows "Create Credit Note" button for approved invoices', () => {
    render(
      <InvoiceDetail
        invoice={{ ...DETAILED_INVOICE, status: 'approved' }}
        onTransition={vi.fn()}
        onEdit={vi.fn()}
        onCreateCreditNote={vi.fn()}
      />,
    );
    expect(screen.getByTestId('create-credit-note-button')).toBeInTheDocument();
  });

  it('does not show "Create Credit Note" button for draft invoices', () => {
    render(
      <InvoiceDetail
        invoice={{ ...DETAILED_INVOICE, status: 'draft' }}
        onTransition={vi.fn()}
        onEdit={vi.fn()}
        onCreateCreditNote={vi.fn()}
      />,
    );
    expect(screen.queryByTestId('create-credit-note-button')).not.toBeInTheDocument();
  });

  it('calls onCreateCreditNote when button is clicked', () => {
    const onCreateCreditNote = vi.fn();
    render(
      <InvoiceDetail
        invoice={DETAILED_INVOICE}
        onTransition={vi.fn()}
        onEdit={vi.fn()}
        onCreateCreditNote={onCreateCreditNote}
      />,
    );
    fireEvent.click(screen.getByTestId('create-credit-note-button'));
    expect(onCreateCreditNote).toHaveBeenCalledTimes(1);
  });
});

/* ================================================================
   3. INVOICE PDF PREVIEW
   ================================================================ */
describe('Invoice PDF Preview', () => {
  it('renders the preview dialog when open is true', () => {
    render(
      <InvoicePDFPreview invoice={DETAILED_INVOICE} open={true} onClose={vi.fn()} />,
    );
    expect(screen.getByTestId('pdf-preview-content')).toBeInTheDocument();
    expect(screen.getByText('TAX INVOICE')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(
      <InvoicePDFPreview invoice={DETAILED_INVOICE} open={false} onClose={vi.fn()} />,
    );
    expect(screen.queryByTestId('pdf-preview-content')).not.toBeInTheDocument();
  });

  it('displays the company name "My Organisation"', () => {
    render(
      <InvoicePDFPreview invoice={DETAILED_INVOICE} open={true} onClose={vi.fn()} />,
    );
    expect(screen.getByText('My Organisation')).toBeInTheDocument();
  });

  it('displays the contact name', () => {
    render(
      <InvoicePDFPreview invoice={DETAILED_INVOICE} open={true} onClose={vi.fn()} />,
    );
    expect(screen.getByTestId('preview-contact')).toHaveTextContent('Acme Corporation');
  });

  it('displays the invoice number', () => {
    render(
      <InvoicePDFPreview invoice={DETAILED_INVOICE} open={true} onClose={vi.fn()} />,
    );
    expect(screen.getByTestId('preview-number')).toHaveTextContent('INV-0010');
  });

  it('displays line items', () => {
    render(
      <InvoicePDFPreview invoice={DETAILED_INVOICE} open={true} onClose={vi.fn()} />,
    );
    expect(screen.getByText('Web Development Services')).toBeInTheDocument();
    expect(screen.getByText('Hosting (Monthly)')).toBeInTheDocument();
  });

  it('displays subtotal, tax, total, and amount due', () => {
    render(
      <InvoicePDFPreview invoice={DETAILED_INVOICE} open={true} onClose={vi.fn()} />,
    );
    expect(screen.getByTestId('preview-subtotal')).toBeInTheDocument();
    expect(screen.getByTestId('preview-total')).toBeInTheDocument();
    expect(screen.getByTestId('preview-amount-due')).toBeInTheDocument();
  });

  it('renders the Print button', () => {
    render(
      <InvoicePDFPreview invoice={DETAILED_INVOICE} open={true} onClose={vi.fn()} />,
    );
    expect(screen.getByTestId('print-button')).toBeInTheDocument();
    expect(screen.getByText('Print')).toBeInTheDocument();
  });

  it('calls window.print when Print button is clicked', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(
      <InvoicePDFPreview invoice={DETAILED_INVOICE} open={true} onClose={vi.fn()} />,
    );
    fireEvent.click(screen.getByTestId('print-button'));
    expect(printSpy).toHaveBeenCalledTimes(1);
    printSpy.mockRestore();
  });

  it('shows Preview button on InvoiceDetail', () => {
    render(
      <InvoiceDetail
        invoice={DETAILED_INVOICE}
        onTransition={vi.fn()}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getByTestId('preview-invoice-button')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('opens the preview dialog when Preview button is clicked', () => {
    render(
      <InvoiceDetail
        invoice={DETAILED_INVOICE}
        onTransition={vi.fn()}
        onEdit={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId('preview-invoice-button'));
    expect(screen.getByTestId('pdf-preview-content')).toBeInTheDocument();
    expect(screen.getByText('TAX INVOICE')).toBeInTheDocument();
  });
});

/* ================================================================
   4. INVOICE LIST — bulk-select checkboxes
   ================================================================ */
describe('InvoiceList — checkbox columns', () => {
  it('renders select-all checkbox', () => {
    render(
      <InvoiceList
        invoices={SAMPLE_INVOICES}
        onInvoiceClick={vi.fn()}
        onBulkAction={vi.fn()}
      />,
    );
    expect(screen.getByTestId('select-all-checkbox')).toBeInTheDocument();
  });

  it('renders per-row checkboxes', () => {
    render(
      <InvoiceList invoices={SAMPLE_INVOICES} onInvoiceClick={vi.fn()} />,
    );
    expect(screen.getByTestId(`invoice-checkbox-${SAMPLE_INVOICES[0].id}`)).toBeInTheDocument();
  });

  it('shows bulk actions bar when rows are selected', () => {
    render(
      <InvoiceList
        invoices={SAMPLE_INVOICES}
        onInvoiceClick={vi.fn()}
        onBulkAction={vi.fn()}
      />,
    );
    // Select first invoice
    fireEvent.click(screen.getByTestId(`invoice-checkbox-${SAMPLE_INVOICES[0].id}`));
    expect(screen.getByTestId('bulk-actions-bar')).toBeInTheDocument();
    expect(screen.getByText('1 selected')).toBeInTheDocument();
  });

  it('select-all selects all rows', () => {
    render(
      <InvoiceList
        invoices={SAMPLE_INVOICES}
        onInvoiceClick={vi.fn()}
        onBulkAction={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId('select-all-checkbox'));
    expect(screen.getByTestId('bulk-actions-bar')).toBeInTheDocument();
    expect(screen.getByText(`${SAMPLE_INVOICES.length} selected`)).toBeInTheDocument();
  });
});

/* ================================================================
   5. INVOICE LIST — recurring map and credit note ids forwarding
   ================================================================ */
describe('InvoiceList with recurring and credit note props', () => {
  it('passes recurring schedule to InvoiceRow via recurringMap', () => {
    const recurringMap = new Map<string, RecurringSchedule>([
      [SAMPLE_INVOICES[0].id, 'weekly'],
    ]);
    render(
      <InvoiceList
        invoices={SAMPLE_INVOICES}
        onInvoiceClick={vi.fn()}
        recurringMap={recurringMap}
      />,
    );
    // The first invoice should have the recurring icon
    expect(screen.getByTestId(`recurring-icon-${SAMPLE_INVOICES[0].id}`)).toBeInTheDocument();
    // Others should not
    expect(screen.queryByTestId(`recurring-icon-${SAMPLE_INVOICES[1].id}`)).not.toBeInTheDocument();
  });

  it('passes credit note status to InvoiceRow via creditNoteIds', () => {
    const creditNoteIds = new Set([SAMPLE_INVOICES[1].id]);
    render(
      <InvoiceList
        invoices={SAMPLE_INVOICES}
        onInvoiceClick={vi.fn()}
        creditNoteIds={creditNoteIds}
      />,
    );
    expect(screen.getByTestId(`credit-note-badge-${SAMPLE_INVOICES[1].id}`)).toBeInTheDocument();
    expect(screen.queryByTestId(`credit-note-badge-${SAMPLE_INVOICES[0].id}`)).not.toBeInTheDocument();
  });
});
