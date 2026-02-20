// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BillForm } from '../components/BillForm';
import { BillDetail } from '../components/BillDetail';
import { BillAttachments } from '../components/BillAttachments';
import { SupplierCreditNoteForm } from '../components/SupplierCreditNoteForm';
import { SupplierCreditNoteList } from '../components/SupplierCreditNoteList';
import { SupplierPrepaymentForm } from '../components/SupplierPrepaymentForm';
import type { Bill } from '../types';
import type { SupplierCreditNote } from '../components/SupplierCreditNoteList';

// --- Mock api-helpers ---
vi.mock('../../../lib/api-helpers', () => ({
  apiFetch: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
}));

// --- Mock localStorage ---
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// --- Test data ---

const SUPPLIERS = [
  { id: 's1', name: 'Supplier A' },
  { id: 's2', name: 'Supplier B' },
];

function makeBill(overrides: Partial<Bill> = {}): Bill {
  return {
    id: 'b001',
    billNumber: 'BILL-0001',
    reference: 'PO-001',
    contactId: 'c001',
    contactName: 'Test Supplier',
    status: 'draft',
    amountType: 'exclusive',
    currency: 'NZD',
    date: '2024-06-01',
    dueDate: '2024-07-01',
    lineItems: [
      {
        id: 'li1',
        description: 'Widget',
        quantity: 10,
        unitPrice: 10,
        taxRate: 15,
        taxAmount: 15,
        lineAmount: 100,
        discount: 0,
        accountCode: '200',
      },
    ],
    subTotal: 100,
    totalTax: 15,
    total: 115,
    amountDue: 115,
    amountPaid: 0,
    createdAt: '2024-06-01T00:00:00.000Z',
    updatedAt: '2024-06-01T00:00:00.000Z',
    ...overrides,
  };
}

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  localStorageMock.clear();
});

// =========================================================
// 1. Copy/Duplicate Bill — Duplicate button on BillDetail
// =========================================================

describe('Copy/Duplicate Bill', () => {
  it('renders Duplicate button when onDuplicate provided', () => {
    const bill = makeBill();
    render(
      <BillDetail bill={bill} onStatusChange={vi.fn()} onDuplicate={vi.fn()} />,
    );
    expect(screen.getByTestId('bill-duplicate-btn')).toHaveTextContent('Duplicate');
  });

  it('calls onDuplicate when Duplicate is clicked', () => {
    const onDuplicate = vi.fn();
    const bill = makeBill();
    render(
      <BillDetail bill={bill} onStatusChange={vi.fn()} onDuplicate={onDuplicate} />,
    );
    fireEvent.click(screen.getByTestId('bill-duplicate-btn'));
    expect(onDuplicate).toHaveBeenCalledTimes(1);
  });

  it('useCopyBill hook module exports correctly', async () => {
    const mod = await import('../hooks/useCopyBill');
    expect(typeof mod.useCopyBill).toBe('function');
  });
});

// =========================================================
// 2. Multi-currency Bills
// =========================================================

describe('Multi-currency Bills', () => {
  it('renders currency select with default NZD', () => {
    render(<BillForm suppliers={SUPPLIERS} onSave={vi.fn()} />);
    const select = screen.getByTestId('bill-currency-select');
    expect(select).toBeInTheDocument();
    expect((select as HTMLSelectElement).value).toBe('NZD');
  });

  it('shows exchange rate text when non-NZD currency selected', () => {
    render(
      <BillForm suppliers={SUPPLIERS} onSave={vi.fn()} initialData={{ currency: 'USD' }} />,
    );
    expect(screen.getByTestId('exchange-rate-text')).toBeInTheDocument();
    expect(screen.getByTestId('exchange-rate-text')).toHaveTextContent('USD');
    expect(screen.getByTestId('exchange-rate-text')).toHaveTextContent('NZD');
  });

  it('does not show exchange rate text for NZD', () => {
    render(<BillForm suppliers={SUPPLIERS} onSave={vi.fn()} />);
    expect(screen.queryByTestId('exchange-rate-text')).not.toBeInTheDocument();
  });

  it('includes currency in form data on save', () => {
    const onSave = vi.fn();
    render(
      <BillForm
        suppliers={SUPPLIERS}
        onSave={onSave}
        initialData={{ currency: 'AUD' }}
      />,
    );
    // Fill required fields
    fireEvent.change(screen.getByTestId('bill-supplier-select'), { target: { value: 's1' } });
    fireEvent.change(screen.getByTestId('line-description-0'), { target: { value: 'Test item' } });
    fireEvent.change(screen.getByTestId('line-unit-price-0'), { target: { value: '100' } });
    fireEvent.click(screen.getByTestId('save-draft-btn'));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0].currency).toBe('AUD');
  });
});

// =========================================================
// 3. Bill Attachments
// =========================================================

describe('Bill Attachments', () => {
  it('renders attachments section with upload button', () => {
    render(<BillAttachments billId="b001" />);
    expect(screen.getByTestId('bill-attachments')).toBeInTheDocument();
    expect(screen.getByTestId('attachment-upload-btn')).toBeInTheDocument();
  });

  it('shows "No files attached" when empty', () => {
    render(<BillAttachments billId="b001" />);
    expect(screen.getByTestId('no-attachments')).toHaveTextContent('No files attached.');
  });

  it('renders in BillDetail', () => {
    const bill = makeBill();
    render(
      <BillDetail bill={bill} onStatusChange={vi.fn()} />,
    );
    expect(screen.getByTestId('bill-attachments')).toBeInTheDocument();
  });
});

// =========================================================
// 4. Supplier Credit Notes (Debit Notes)
// =========================================================

describe('Supplier Credit Notes', () => {
  it('renders SupplierCreditNoteForm with all fields', () => {
    render(<SupplierCreditNoteForm suppliers={SUPPLIERS} onSave={vi.fn()} />);
    expect(screen.getByTestId('supplier-credit-note-form')).toBeInTheDocument();
    expect(screen.getByTestId('scn-supplier-select')).toBeInTheDocument();
    expect(screen.getByTestId('scn-date-input')).toBeInTheDocument();
    expect(screen.getByTestId('scn-amount-input')).toBeInTheDocument();
    expect(screen.getByTestId('scn-tax-rate-input')).toBeInTheDocument();
  });

  it('calculates tax and total correctly', () => {
    render(<SupplierCreditNoteForm suppliers={SUPPLIERS} onSave={vi.fn()} />);
    fireEvent.change(screen.getByTestId('scn-amount-input'), { target: { value: '100' } });
    const totals = screen.getByTestId('scn-totals');
    expect(totals).toHaveTextContent('Tax: $15.00');
    expect(totals).toHaveTextContent('Total: $115.00');
  });

  it('SupplierCreditNoteList renders rows', () => {
    const notes: SupplierCreditNote[] = [
      { id: 'cn1', creditNoteNumber: 'CN-0001', contactName: 'Supplier A', date: '2024-06-01', total: 100, remainingCredit: 100, status: 'draft' },
    ];
    render(<SupplierCreditNoteList creditNotes={notes} />);
    expect(screen.getByTestId('scn-list')).toBeInTheDocument();
    expect(screen.getByTestId('scn-row-cn1')).toBeInTheDocument();
  });

  it('SupplierCreditNoteList shows empty state', () => {
    render(<SupplierCreditNoteList creditNotes={[]} />);
    expect(screen.getByTestId('scn-list-empty')).toHaveTextContent('No supplier credit notes found.');
  });

  it('useSupplierCreditNotes hook exports correctly', async () => {
    const mod = await import('../hooks/useSupplierCreditNotes');
    expect(typeof mod.useSupplierCreditNotes).toBe('function');
    expect(typeof mod.useCreateSupplierCreditNote).toBe('function');
  });
});

// =========================================================
// 5. Supplier Prepayments
// =========================================================

describe('Supplier Prepayments', () => {
  it('renders SupplierPrepaymentForm with all fields', () => {
    render(<SupplierPrepaymentForm suppliers={SUPPLIERS} onSave={vi.fn()} />);
    expect(screen.getByTestId('supplier-prepayment-form')).toBeInTheDocument();
    expect(screen.getByTestId('prepay-supplier-select')).toBeInTheDocument();
    expect(screen.getByTestId('prepay-date-input')).toBeInTheDocument();
    expect(screen.getByTestId('prepay-amount-input')).toBeInTheDocument();
    expect(screen.getByTestId('prepay-reference-input')).toBeInTheDocument();
  });

  it('calls onSave with form data when valid', () => {
    const onSave = vi.fn();
    render(<SupplierPrepaymentForm suppliers={SUPPLIERS} onSave={onSave} />);
    fireEvent.change(screen.getByTestId('prepay-supplier-select'), { target: { value: 's1' } });
    fireEvent.change(screen.getByTestId('prepay-amount-input'), { target: { value: '500' } });
    fireEvent.change(screen.getByTestId('prepay-reference-input'), { target: { value: 'PREPAY-001' } });
    fireEvent.click(screen.getByTestId('prepay-save-btn'));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        contactId: 's1',
        amount: 500,
        reference: 'PREPAY-001',
      }),
    );
  });

  it('validates required fields', () => {
    const onSave = vi.fn();
    render(<SupplierPrepaymentForm suppliers={SUPPLIERS} onSave={onSave} />);
    fireEvent.click(screen.getByTestId('prepay-save-btn'));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('useSupplierPrepayments hook exports correctly', async () => {
    const mod = await import('../hooks/useSupplierPrepayments');
    expect(typeof mod.useSupplierPrepayments).toBe('function');
    expect(typeof mod.useCreateSupplierPrepayment).toBe('function');
  });
});
