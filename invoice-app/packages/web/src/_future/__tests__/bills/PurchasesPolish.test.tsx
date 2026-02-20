// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BatchPaymentDialog } from '../components/BatchPaymentDialog';
import { EmailPODialog } from '../components/EmailPODialog';
import { ApprovePOButton } from '../components/ApprovePOButton';
import { BillFromPOSelector } from '../components/BillFromPOSelector';
import type { Bill } from '../types';
import type { PurchaseOrder } from '../hooks/usePurchaseOrders';

// --- Mock api-helpers ---
vi.mock('../../../lib/api-helpers', () => ({
  apiFetch: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
}));

// --- Test data factories ---

function makeBill(overrides: Partial<Bill> = {}): Bill {
  return {
    id: 'b001',
    billNumber: 'BILL-0001',
    reference: 'PO-001',
    contactId: 'c001',
    contactName: 'Test Supplier',
    status: 'approved',
    amountType: 'exclusive',
    currency: 'NZD',
    date: '2024-06-01',
    dueDate: '2024-07-01',
    lineItems: [],
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

function makePO(overrides: Partial<PurchaseOrder> = {}): PurchaseOrder {
  return {
    id: 'po001',
    poNumber: 'PO-0001',
    reference: null,
    contactId: 'c001',
    contactName: 'Supplier Co',
    status: 'approved',
    deliveryDate: null,
    deliveryAddress: null,
    currency: 'NZD',
    date: '2024-06-01',
    subTotal: 200,
    totalTax: 30,
    total: 230,
    convertedBillId: null,
    createdAt: '2024-06-01T00:00:00.000Z',
    updatedAt: '2024-06-01T00:00:00.000Z',
    lineItems: [
      {
        id: 'li1',
        description: 'Widget A',
        quantity: 10,
        unitPrice: 20,
        taxRate: 15,
        taxAmount: 30,
        lineAmount: 200,
        discount: 0,
      },
    ],
    ...overrides,
  };
}

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

// =========================================================
// 1. BatchPaymentDialog
// =========================================================

describe('BatchPaymentDialog', () => {
  const bills = [
    makeBill({ id: 'b1', billNumber: 'BILL-001', amountDue: 100, contactName: 'Supplier A' }),
    makeBill({ id: 'b2', billNumber: 'BILL-002', amountDue: 250, contactName: 'Supplier B' }),
  ];

  it('renders bill list with amounts', () => {
    render(
      <BatchPaymentDialog open={true} onClose={vi.fn()} bills={bills} onConfirm={vi.fn()} />,
    );
    expect(screen.getByTestId('batch-payment-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('batch-bill-b1')).toBeInTheDocument();
    expect(screen.getByTestId('batch-bill-b2')).toBeInTheDocument();
  });

  it('displays correct total', () => {
    render(
      <BatchPaymentDialog open={true} onClose={vi.fn()} bills={bills} onConfirm={vi.fn()} />,
    );
    expect(screen.getByTestId('batch-total')).toHaveTextContent('$350.00');
  });

  it('calls onConfirm with bill IDs, date, and account', () => {
    const onConfirm = vi.fn();
    render(
      <BatchPaymentDialog open={true} onClose={vi.fn()} bills={bills} onConfirm={onConfirm} />,
    );
    fireEvent.click(screen.getByTestId('batch-confirm-btn'));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        billIds: ['b1', 'b2'],
        accountCode: 'business-cheque',
      }),
    );
    expect(onConfirm.mock.calls[0][0].paymentDate).toBeTruthy();
  });

  it('does not render when open is false', () => {
    render(
      <BatchPaymentDialog open={false} onClose={vi.fn()} bills={bills} onConfirm={vi.fn()} />,
    );
    expect(screen.queryByTestId('batch-payment-dialog')).not.toBeInTheDocument();
  });
});

// =========================================================
// 2. useBatchPayment hook
// =========================================================

describe('useBatchPayment hook', () => {
  it('module exports useBatchPayment function', async () => {
    const mod = await import('../hooks/useBatchPayment');
    expect(typeof mod.useBatchPayment).toBe('function');
  });
});

// =========================================================
// 3. useCopyBill hook
// =========================================================

describe('useCopyBill hook', () => {
  it('module exports useCopyBill function', async () => {
    const mod = await import('../hooks/useCopyBill');
    expect(typeof mod.useCopyBill).toBe('function');
  });
});

// =========================================================
// 4. EmailPODialog
// =========================================================

describe('EmailPODialog', () => {
  it('renders all email fields', () => {
    render(
      <EmailPODialog
        open={true}
        onClose={vi.fn()}
        purchaseOrderId="po001"
        onSend={vi.fn()}
      />,
    );
    expect(screen.getByTestId('email-po-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('email-to-input')).toBeInTheDocument();
    expect(screen.getByTestId('email-subject-input')).toBeInTheDocument();
    expect(screen.getByTestId('email-body-input')).toBeInTheDocument();
    expect(screen.getByTestId('email-pdf-preview')).toBeInTheDocument();
  });

  it('pre-fills subject with PO number', () => {
    render(
      <EmailPODialog
        open={true}
        onClose={vi.fn()}
        purchaseOrderId="po001"
        poNumber="PO-0001"
        onSend={vi.fn()}
      />,
    );
    const subject = screen.getByTestId('email-subject-input') as HTMLInputElement;
    expect(subject.value).toContain('PO-0001');
  });

  it('calls onSend with to/subject/body', () => {
    const onSend = vi.fn();
    render(
      <EmailPODialog
        open={true}
        onClose={vi.fn()}
        purchaseOrderId="po001"
        supplierEmail="test@supplier.com"
        onSend={onSend}
      />,
    );
    fireEvent.click(screen.getByTestId('email-send-btn'));
    expect(onSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@supplier.com',
      }),
    );
  });

  it('shows error when to field is empty', () => {
    const onSend = vi.fn();
    render(
      <EmailPODialog
        open={true}
        onClose={vi.fn()}
        purchaseOrderId="po001"
        onSend={onSend}
      />,
    );
    fireEvent.click(screen.getByTestId('email-send-btn'));
    expect(onSend).not.toHaveBeenCalled();
    expect(screen.getByText('Recipient email is required')).toBeInTheDocument();
  });
});

// =========================================================
// 5. ApprovePOButton
// =========================================================

describe('ApprovePOButton', () => {
  it('renders Approve button for submitted POs', () => {
    render(
      <ApprovePOButton
        purchaseOrderId="po001"
        currentStatus="submitted"
        onApproved={vi.fn()}
      />,
    );
    expect(screen.getByTestId('approve-po-btn')).toHaveTextContent('Approve');
  });

  it('does not render for draft POs', () => {
    render(
      <ApprovePOButton
        purchaseOrderId="po001"
        currentStatus="draft"
        onApproved={vi.fn()}
      />,
    );
    expect(screen.queryByTestId('approve-po-btn')).not.toBeInTheDocument();
  });

  it('calls onApproved with PO id on click', () => {
    const onApproved = vi.fn();
    render(
      <ApprovePOButton
        purchaseOrderId="po001"
        currentStatus="submitted"
        onApproved={onApproved}
      />,
    );
    fireEvent.click(screen.getByTestId('approve-po-btn'));
    expect(onApproved).toHaveBeenCalledWith('po001');
  });
});

// =========================================================
// 6. BillFromPOSelector
// =========================================================

describe('BillFromPOSelector', () => {
  const purchaseOrders = [
    makePO({ id: 'po1', poNumber: 'PO-001', status: 'approved', total: 230 }),
    makePO({ id: 'po2', poNumber: 'PO-002', status: 'draft', total: 100 }),
    makePO({ id: 'po3', poNumber: 'PO-003', status: 'approved', total: 500 }),
  ];

  it('only shows approved POs', () => {
    render(
      <BillFromPOSelector purchaseOrders={purchaseOrders} onSelect={vi.fn()} />,
    );
    expect(screen.getByTestId('po-option-po1')).toBeInTheDocument();
    expect(screen.queryByTestId('po-option-po2')).not.toBeInTheDocument();
    expect(screen.getByTestId('po-option-po3')).toBeInTheDocument();
  });

  it('shows empty state when no approved POs', () => {
    render(
      <BillFromPOSelector
        purchaseOrders={[makePO({ id: 'po2', status: 'draft' })]}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByTestId('no-approved-pos')).toBeInTheDocument();
  });

  it('calls onSelect with the selected PO data', () => {
    const onSelect = vi.fn();
    render(
      <BillFromPOSelector purchaseOrders={purchaseOrders} onSelect={onSelect} />,
    );
    fireEvent.click(screen.getByTestId('po-option-po1'));
    fireEvent.click(screen.getByTestId('po-select-btn'));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'po1', poNumber: 'PO-001' }),
    );
  });

  it('disables select button when nothing selected', () => {
    render(
      <BillFromPOSelector purchaseOrders={purchaseOrders} onSelect={vi.fn()} />,
    );
    expect(screen.getByTestId('po-select-btn')).toBeDisabled();
  });
});
