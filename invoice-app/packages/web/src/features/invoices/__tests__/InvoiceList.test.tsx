import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  useNavigate: () => vi.fn(),
}));

import { InvoiceList } from '../components/InvoiceList';
import type { Invoice } from '../types';

const uuid = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;

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
    status: 'submitted',
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

describe('InvoiceList', () => {
  it('renders the invoice table', () => {
    render(<InvoiceList invoices={SAMPLE_INVOICES} onInvoiceClick={vi.fn()} />);
    expect(screen.getByTestId('invoice-list-table')).toBeInTheDocument();
  });

  it('renders table header columns', () => {
    render(<InvoiceList invoices={SAMPLE_INVOICES} onInvoiceClick={vi.fn()} />);
    const headers = screen.getAllByRole('columnheader');
    const headerTexts = headers.map((h) => h.textContent?.trim());
    expect(headerTexts).toContain('Number');
    expect(headerTexts).toContain('Ref');
    expect(headerTexts).toContain('To');
    expect(headerTexts).toContain('Date');
    expect(headerTexts).toContain('Due Date');
    expect(headerTexts).toContain('Paid');
    expect(headerTexts).toContain('Due');
    expect(headerTexts).toContain('Status');
    expect(headerTexts).toContain('Sent');
  });

  it('renders all invoice rows', () => {
    render(<InvoiceList invoices={SAMPLE_INVOICES} onInvoiceClick={vi.fn()} />);
    SAMPLE_INVOICES.forEach((inv) => {
      expect(screen.getByTestId(`invoice-row-${inv.id}`)).toBeInTheDocument();
    });
  });

  it('displays invoice numbers', () => {
    render(<InvoiceList invoices={SAMPLE_INVOICES.slice(0, 3)} onInvoiceClick={vi.fn()} />);
    expect(screen.getByText('INV-0001')).toBeInTheDocument();
    expect(screen.getByText('INV-0002')).toBeInTheDocument();
    expect(screen.getByText('INV-0003')).toBeInTheDocument();
  });

  it('displays contact names', () => {
    render(<InvoiceList invoices={SAMPLE_INVOICES.slice(0, 2)} onInvoiceClick={vi.fn()} />);
    expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
    expect(screen.getByText('Bay Industries Ltd')).toBeInTheDocument();
  });

  it('calls onInvoiceClick when a row is clicked', () => {
    const onClick = vi.fn();
    render(<InvoiceList invoices={SAMPLE_INVOICES.slice(0, 1)} onInvoiceClick={onClick} />);
    fireEvent.click(screen.getByTestId(`invoice-row-${SAMPLE_INVOICES[0].id}`));
    expect(onClick).toHaveBeenCalledWith(SAMPLE_INVOICES[0].id);
  });

  it('shows empty state when no invoices', () => {
    render(<InvoiceList invoices={[]} onInvoiceClick={vi.fn()} />);
    expect(screen.getByTestId('invoice-list-empty')).toBeInTheDocument();
    expect(screen.getByText('No invoices yet')).toBeInTheDocument();
  });

  it('displays item count below the table', () => {
    render(<InvoiceList invoices={SAMPLE_INVOICES} onInvoiceClick={vi.fn()} />);
    expect(screen.getByTestId('invoice-item-count')).toHaveTextContent('3 items');
  });

  it('displays singular "item" for single invoice', () => {
    render(<InvoiceList invoices={SAMPLE_INVOICES.slice(0, 1)} onInvoiceClick={vi.fn()} />);
    expect(screen.getByTestId('invoice-item-count')).toHaveTextContent('1 item');
  });

  it('renders Sent column in each row', () => {
    render(<InvoiceList invoices={SAMPLE_INVOICES} onInvoiceClick={vi.fn()} />);
    SAMPLE_INVOICES.forEach((inv) => {
      expect(screen.getByTestId(`invoice-sent-${inv.id}`)).toBeInTheDocument();
    });
  });

  it('renders status badges in each row', () => {
    render(<InvoiceList invoices={SAMPLE_INVOICES.slice(0, 3)} onInvoiceClick={vi.fn()} />);
    // INV-0001 is draft, INV-0002 is paid, INV-0003 is submitted
    expect(screen.getByText('Draft')).toBeInTheDocument();
    // "Paid" appears both as column header and status badge — use getAllByText
    const paidElements = screen.getAllByText('Paid');
    expect(paidElements.length).toBeGreaterThanOrEqual(2); // header + badge
    expect(screen.getByText('Awaiting Approval')).toBeInTheDocument();
  });
});
