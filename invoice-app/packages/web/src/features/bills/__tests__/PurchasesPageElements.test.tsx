// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BillList } from '../components/BillList';
import { BillDetail } from '../components/BillDetail';
import { PurchaseOrderList } from '../components/PurchaseOrderList';
import type { Bill } from '../types';
import type { PurchaseOrder } from '../hooks/usePurchaseOrders';

// Mock @shared/calc/currency
vi.mock('@shared/calc/currency', () => ({
  formatCurrency: (amount: number, currency: string) =>
    `$${amount.toFixed(2)}`,
}));

// Mock @shared/rules/invoice-status
vi.mock('@shared/rules/invoice-status', () => ({
  canReceivePayment: (status: string) => status === 'approved',
  nextStatuses: (status: string) => {
    if (status === 'draft') return ['submitted', 'voided'];
    return [];
  },
  isEditable: (status: string) => status === 'draft',
  canTransition: () => true,
}));

// Mock fetch for ActivityLog
const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ data: [] }),
});
global.fetch = mockFetch;

const SAMPLE_BILLS: Bill[] = [
  {
    id: 'b001',
    billNumber: 'BILL-0001',
    reference: 'REF-A',
    contactId: 'c001',
    contactName: 'Alpha Corp',
    status: 'draft',
    amountType: 'exclusive',
    currency: 'NZD',
    date: '2024-06-01',
    dueDate: '2024-07-01',
    lineItems: [
      {
        id: 'li-001',
        description: 'Test item',
        quantity: 1,
        unitPrice: 100,
        accountCode: '200',
        taxRate: 15,
        taxAmount: 15,
        lineAmount: 100,
        discount: 0,
      },
    ],
    subTotal: 100,
    totalTax: 15,
    total: 115,
    amountDue: 115,
    amountPaid: 0,
    createdAt: '2024-06-01T00:00:00.000Z',
    updatedAt: '2024-06-01T00:00:00.000Z',
  },
  {
    id: 'b002',
    billNumber: 'BILL-0002',
    reference: '',
    contactId: 'c002',
    contactName: 'Beta Ltd',
    status: 'submitted',
    amountType: 'exclusive',
    currency: 'NZD',
    date: '2024-05-15',
    dueDate: '2024-06-14',
    lineItems: [],
    subTotal: 200,
    totalTax: 30,
    total: 230,
    amountDue: 230,
    amountPaid: 0,
    createdAt: '2024-05-15T00:00:00.000Z',
    updatedAt: '2024-05-15T00:00:00.000Z',
  },
];

const uuid = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;

const SAMPLE_POS: PurchaseOrder[] = [
  {
    id: uuid(1),
    poNumber: 'PO-0001',
    reference: null,
    contactId: uuid(101),
    contactName: 'Supplier A',
    status: 'draft',
    deliveryDate: '2026-02-28',
    deliveryAddress: null,
    currency: 'NZD',
    date: '2026-01-20',
    subTotal: 2500,
    totalTax: 375,
    total: 2875,
    convertedBillId: null,
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-01-20T10:00:00Z',
  },
  {
    id: uuid(2),
    poNumber: 'PO-0002',
    reference: 'REQ-100',
    contactId: uuid(102),
    contactName: 'Supplier B',
    status: 'approved',
    deliveryDate: '2026-03-15',
    deliveryAddress: '123 Main St',
    currency: 'NZD',
    date: '2026-02-01',
    subTotal: 8000,
    totalTax: 1200,
    total: 9200,
    convertedBillId: null,
    createdAt: '2026-02-01T09:00:00Z',
    updatedAt: '2026-02-01T09:00:00Z',
  },
];

describe('BillList — new page elements', () => {
  it('renders Filter button', () => {
    render(<BillList bills={SAMPLE_BILLS} />);
    expect(screen.getByTestId('bill-filter-btn')).toHaveTextContent('Filter');
  });

  it('renders Columns button', () => {
    render(<BillList bills={SAMPLE_BILLS} />);
    expect(screen.getByTestId('bill-columns-btn')).toHaveTextContent('Columns');
  });

  it('renders toolbar overflow menu button', () => {
    render(<BillList bills={SAMPLE_BILLS} />);
    expect(screen.getByTestId('bill-toolbar-overflow')).toBeInTheDocument();
  });

  it('shows overflow menu on click', () => {
    render(<BillList bills={SAMPLE_BILLS} />);
    fireEvent.click(screen.getByTestId('bill-toolbar-overflow'));
    expect(screen.getByTestId('bill-toolbar-menu')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
    expect(screen.getByText('Import')).toBeInTheDocument();
  });

  it('renders items count and total display combined', () => {
    render(<BillList bills={SAMPLE_BILLS} />);
    const countEl = screen.getByTestId('bill-items-count');
    expect(countEl).toHaveTextContent(/2 items/);
    expect(countEl).toHaveTextContent(/\|/);
  });

  it('renders View, From, Status, Reference, Paid, and Due column headers', () => {
    render(<BillList bills={SAMPLE_BILLS} />);
    // "View" appears both as column header and as row action buttons — use columnheader role
    expect(screen.getByRole('columnheader', { name: /View/i })).toBeInTheDocument();
    expect(screen.getByText('From')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Reference')).toBeInTheDocument();
    expect(screen.getByText('Paid')).toBeInTheDocument();
    expect(screen.getByText('Due')).toBeInTheDocument();
  });

  it('renders pagination controls', () => {
    render(<BillList bills={SAMPLE_BILLS} />);
    expect(screen.getByText(/1-2 of 2/)).toBeInTheDocument();
  });
});

describe('BillDetail — new page elements', () => {
  const bill = SAMPLE_BILLS[0];

  it('renders Bill Options button', () => {
    render(
      <BillDetail bill={bill} onStatusChange={vi.fn()} />,
    );
    expect(screen.getByTestId('bill-options-btn')).toHaveTextContent('Bill Options');
  });

  it('shows Bill Options dropdown menu on click', () => {
    render(
      <BillDetail bill={bill} onStatusChange={vi.fn()} />,
    );
    fireEvent.click(screen.getByTestId('bill-options-btn'));
    expect(screen.getByTestId('bill-options-menu')).toBeInTheDocument();
    expect(screen.getByTestId('bill-option-copy')).toHaveTextContent('Copy');
    expect(screen.getByTestId('bill-option-email')).toHaveTextContent('Email');
    expect(screen.getByTestId('bill-option-print-pdf')).toHaveTextContent('Print PDF');
    expect(screen.getByTestId('bill-option-void')).toHaveTextContent('Void');
    expect(screen.getByTestId('bill-option-delete')).toHaveTextContent('Delete');
  });

  it('renders Print PDF button', () => {
    render(
      <BillDetail bill={bill} onStatusChange={vi.fn()} />,
    );
    expect(screen.getByTestId('print-button')).toHaveTextContent('Print PDF');
  });

  it('renders History & Notes section (collapsed by default)', () => {
    render(
      <BillDetail bill={bill} onStatusChange={vi.fn()} />,
    );
    expect(screen.getByTestId('history-notes-toggle')).toBeInTheDocument();
    expect(screen.getByText('History & Notes')).toBeInTheDocument();
    // Content should be hidden
    expect(screen.queryByTestId('history-notes-content')).not.toBeInTheDocument();
  });

  it('expands History & Notes on click and shows Add Note', () => {
    render(
      <BillDetail bill={bill} onStatusChange={vi.fn()} />,
    );
    fireEvent.click(screen.getByTestId('history-notes-toggle'));
    expect(screen.getByTestId('history-notes-content')).toBeInTheDocument();
    expect(screen.getByTestId('add-note-section')).toBeInTheDocument();
    expect(screen.getByTestId('note-input')).toBeInTheDocument();
    expect(screen.getByTestId('add-note-btn')).toHaveTextContent('Add Note');
  });
});

describe('PurchaseOrderList — new page elements', () => {
  it('renders Sent and Files column headers', () => {
    render(<PurchaseOrderList purchaseOrders={SAMPLE_POS} onPurchaseOrderClick={vi.fn()} />);
    expect(screen.getByText('Sent')).toBeInTheDocument();
    expect(screen.getByText('Files')).toBeInTheDocument();
  });

  it('renders search toolbar with date inputs', () => {
    render(<PurchaseOrderList purchaseOrders={SAMPLE_POS} onPurchaseOrderClick={vi.fn()} />);
    expect(screen.getByTestId('po-search-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('po-search')).toBeInTheDocument();
    expect(screen.getByTestId('po-start-date')).toBeInTheDocument();
    expect(screen.getByTestId('po-end-date')).toBeInTheDocument();
  });

  it('renders Filter and Columns buttons', () => {
    render(<PurchaseOrderList purchaseOrders={SAMPLE_POS} onPurchaseOrderClick={vi.fn()} />);
    expect(screen.getByTestId('po-filter-btn')).toHaveTextContent('Filter');
    expect(screen.getByTestId('po-columns-btn')).toHaveTextContent('Columns');
  });

  it('renders pagination for PO list', () => {
    render(<PurchaseOrderList purchaseOrders={SAMPLE_POS} onPurchaseOrderClick={vi.fn()} />);
    expect(screen.getByLabelText('Previous page')).toBeInTheDocument();
    expect(screen.getByLabelText('Next page')).toBeInTheDocument();
  });

  it('shows sent indicator for non-draft POs', () => {
    render(<PurchaseOrderList purchaseOrders={SAMPLE_POS} onPurchaseOrderClick={vi.fn()} />);
    // Approved PO should have the sent checkmark
    expect(screen.getByTestId(`po-sent-${uuid(2)}`)).toBeInTheDocument();
  });

  it('filters purchase orders by search text', () => {
    render(<PurchaseOrderList purchaseOrders={SAMPLE_POS} onPurchaseOrderClick={vi.fn()} />);
    fireEvent.change(screen.getByTestId('po-search'), { target: { value: 'Supplier B' } });
    expect(screen.getByText('PO-0002')).toBeInTheDocument();
    expect(screen.queryByText('PO-0001')).not.toBeInTheDocument();
  });
});
