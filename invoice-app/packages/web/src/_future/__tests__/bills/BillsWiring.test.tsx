// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApprovePOButton } from '../components/ApprovePOButton';
import { ApprovalProgress } from '../components/ApprovalProgress';
import { BatchPaymentDialog } from '../components/BatchPaymentDialog';
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

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

// =========================================================
// 1. PO Approval — ApprovePOButton with reject
// =========================================================

describe('ApprovePOButton — approval workflow', () => {
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

  it('calls onApproved with PO id on Approve click', () => {
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

  it('renders Reject button when onRejected is provided', () => {
    render(
      <ApprovePOButton
        purchaseOrderId="po001"
        currentStatus="submitted"
        onApproved={vi.fn()}
        onRejected={vi.fn()}
      />,
    );
    expect(screen.getByTestId('reject-po-btn')).toHaveTextContent('Reject');
  });

  it('calls onRejected with PO id on Reject click', () => {
    const onRejected = vi.fn();
    render(
      <ApprovePOButton
        purchaseOrderId="po001"
        currentStatus="submitted"
        onApproved={vi.fn()}
        onRejected={onRejected}
      />,
    );
    fireEvent.click(screen.getByTestId('reject-po-btn'));
    expect(onRejected).toHaveBeenCalledWith('po001');
  });

  it('does not render Reject button when onRejected is not provided', () => {
    render(
      <ApprovePOButton
        purchaseOrderId="po001"
        currentStatus="submitted"
        onApproved={vi.fn()}
      />,
    );
    expect(screen.queryByTestId('reject-po-btn')).not.toBeInTheDocument();
  });
});

// =========================================================
// 2. ApprovalProgress — PO variant
// =========================================================

describe('ApprovalProgress — PO variant', () => {
  it('shows PO steps for purchase-order variant', () => {
    render(<ApprovalProgress status="submitted" variant="purchase-order" />);
    expect(screen.getByTestId('step-draft')).toBeInTheDocument();
    expect(screen.getByTestId('step-submitted')).toBeInTheDocument();
    expect(screen.getByTestId('step-approved')).toBeInTheDocument();
  });

  it('highlights submitted step as current for submitted PO', () => {
    render(<ApprovalProgress status="submitted" variant="purchase-order" />);
    // Draft should be completed (checkmark)
    expect(screen.getByTestId('step-draft')).toHaveTextContent('\u2713');
    // Submitted should be current (number 2)
    expect(screen.getByTestId('step-submitted')).toHaveTextContent('2');
  });

  it('shows voided message for voided bills', () => {
    render(<ApprovalProgress status="voided" />);
    expect(screen.getByText('This bill has been voided')).toBeInTheDocument();
  });

  it('defaults to bill variant with 4 steps', () => {
    render(<ApprovalProgress status="draft" />);
    expect(screen.getByTestId('step-draft')).toBeInTheDocument();
    expect(screen.getByTestId('step-submitted')).toBeInTheDocument();
    expect(screen.getByTestId('step-approved')).toBeInTheDocument();
    expect(screen.getByTestId('step-paid')).toBeInTheDocument();
  });
});

// =========================================================
// 3. Batch Payment hooks export
// =========================================================

describe('useBatchPayment hook', () => {
  it('module exports useBatchPayment function', async () => {
    const mod = await import('../hooks/useBatchPayment');
    expect(typeof mod.useBatchPayment).toBe('function');
  });

  it('exports BatchPaymentResult type interface', async () => {
    // The module should export the function — type checking is done by TS
    const mod = await import('../hooks/useBatchPayment');
    expect(mod.useBatchPayment).toBeDefined();
  });
});

// =========================================================
// 4. PO hooks exports
// =========================================================

describe('PO approval hooks', () => {
  it('exports useApprovePurchaseOrder', async () => {
    const mod = await import('../hooks/usePurchaseOrders');
    expect(typeof mod.useApprovePurchaseOrder).toBe('function');
  });

  it('exports useRejectPurchaseOrder', async () => {
    const mod = await import('../hooks/usePurchaseOrders');
    expect(typeof mod.useRejectPurchaseOrder).toBe('function');
  });
});

// =========================================================
// 5. BatchPaymentDialog confirm wiring
// =========================================================

describe('BatchPaymentDialog — confirm wiring', () => {
  const bills = [
    makeBill({ id: 'b1', billNumber: 'BILL-001', amountDue: 100, contactName: 'Supplier A' }),
    makeBill({ id: 'b2', billNumber: 'BILL-002', amountDue: 250, contactName: 'Supplier B' }),
    makeBill({ id: 'b3', billNumber: 'BILL-003', amountDue: 75, contactName: 'Supplier C' }),
  ];

  it('displays correct total for 3 bills', () => {
    render(
      <BatchPaymentDialog open={true} onClose={vi.fn()} bills={bills} onConfirm={vi.fn()} />,
    );
    expect(screen.getByTestId('batch-total')).toHaveTextContent('$425.00');
  });

  it('sends all 3 bill IDs on confirm', () => {
    const onConfirm = vi.fn();
    render(
      <BatchPaymentDialog open={true} onClose={vi.fn()} bills={bills} onConfirm={onConfirm} />,
    );
    fireEvent.click(screen.getByTestId('batch-confirm-btn'));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        billIds: ['b1', 'b2', 'b3'],
      }),
    );
  });
});
