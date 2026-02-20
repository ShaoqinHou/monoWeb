// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BillList } from '../components/BillList';
import { BillDetail } from '../components/BillDetail';
import { BillForm } from '../components/BillForm';
import { RecordPaymentForm } from '../components/RecordPaymentForm';
import { PaymentHistory } from '../components/PaymentHistory';
import { ApprovalProgress } from '../components/ApprovalProgress';
import { computeNextRecurrence } from '../types';
import type { Bill, BillPayment, RecordPaymentData } from '../types';

// --- Test data helpers ---

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

function makePayment(overrides: Partial<BillPayment> = {}): BillPayment {
  return {
    id: 'p001',
    billId: 'b001',
    amount: 50,
    date: '2024-06-15',
    reference: 'CHQ-001',
    bankAccount: 'Business Cheque',
    createdAt: '2024-06-15T00:00:00.000Z',
    ...overrides,
  };
}

const SUPPLIERS = [
  { id: 's1', name: 'Supplier A' },
  { id: 's2', name: 'Supplier B' },
];

// --- 1. Recurring bills tests ---

describe('Recurring Bills', () => {
  it('computeNextRecurrence returns null for "none"', () => {
    expect(computeNextRecurrence('2024-06-01', 'none')).toBeNull();
  });

  it('computeNextRecurrence computes weekly', () => {
    expect(computeNextRecurrence('2024-06-01', 'weekly')).toBe('2024-06-08');
  });

  it('computeNextRecurrence computes monthly', () => {
    expect(computeNextRecurrence('2024-06-01', 'monthly')).toBe('2024-07-01');
  });

  it('computeNextRecurrence computes quarterly', () => {
    expect(computeNextRecurrence('2024-06-01', 'quarterly')).toBe('2024-09-01');
  });

  it('computeNextRecurrence computes annually', () => {
    expect(computeNextRecurrence('2024-06-01', 'annually')).toBe('2025-06-01');
  });

  it('BillForm renders the Repeat select field', () => {
    render(<BillForm suppliers={SUPPLIERS} onSave={vi.fn()} />);
    expect(screen.getByTestId('bill-recurrence-select')).toBeInTheDocument();
  });

  it('BillForm shows next recurrence date when frequency is selected', () => {
    render(
      <BillForm
        suppliers={SUPPLIERS}
        onSave={vi.fn()}
        initialData={{ date: '2024-06-01', recurrence: 'monthly' }}
      />,
    );
    expect(screen.getByTestId('next-recurrence-date')).toHaveTextContent('Next recurrence: 2024-07-01');
  });

  it('BillForm does not show next recurrence when set to None', () => {
    render(
      <BillForm
        suppliers={SUPPLIERS}
        onSave={vi.fn()}
        initialData={{ date: '2024-06-01', recurrence: 'none' }}
      />,
    );
    expect(screen.queryByTestId('next-recurrence-date')).not.toBeInTheDocument();
  });

  it('BillForm includes recurrence in onSave data', () => {
    const onSave = vi.fn();
    render(
      <BillForm
        suppliers={SUPPLIERS}
        onSave={onSave}
        initialData={{ recurrence: 'weekly' }}
      />,
    );

    // Fill required fields — supplier via Combobox click/select
    const supplierInput = screen.getByTestId('bill-supplier-select');
    fireEvent.click(supplierInput);
    fireEvent.click(screen.getByRole('option', { name: 'Supplier A' }));

    fireEvent.change(screen.getByTestId('line-description-0'), { target: { value: 'Test item' } });
    fireEvent.change(screen.getByTestId('line-unit-price-0'), { target: { value: '100' } });

    fireEvent.click(screen.getByTestId('save-draft-btn'));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0].recurrence).toBe('weekly');
  });

  it('BillRow shows recurring icon when recurrence is set', () => {
    const bill = makeBill({ id: 'b-rec' });
    render(
      <BillList
        bills={[bill]}
        recurrenceMap={new Map([['b-rec', 'monthly']])}
      />,
    );
    // The recurring icon should be rendered inside the BillList
    expect(screen.getByTestId('recurring-icon-b-rec')).toBeInTheDocument();
  });
});

// --- 2. Payment tracking tests ---

describe('Payment Tracking', () => {
  it('PaymentHistory renders "No payments" when empty', () => {
    render(
      <PaymentHistory
        payments={[]}
        currency="NZD"
        amountDue={115}
        total={115}
        canRecordPayment={true}
      />,
    );
    expect(screen.getByTestId('no-payments')).toHaveTextContent('No payments recorded yet.');
  });

  it('PaymentHistory renders payment rows', () => {
    const payments = [
      makePayment({ id: 'p1', amount: 50, date: '2024-06-15', reference: 'CHQ-001' }),
      makePayment({ id: 'p2', amount: 30, date: '2024-06-20', reference: 'CHQ-002' }),
    ];
    render(
      <PaymentHistory
        payments={payments}
        currency="NZD"
        amountDue={35}
        total={115}
        canRecordPayment={true}
      />,
    );
    expect(screen.getByTestId('payment-row-p1')).toBeInTheDocument();
    expect(screen.getByTestId('payment-row-p2')).toBeInTheDocument();
  });

  it('PaymentHistory shows total paid and remaining due', () => {
    const payments = [makePayment({ id: 'p1', amount: 50 })];
    render(
      <PaymentHistory
        payments={payments}
        currency="NZD"
        amountDue={65}
        total={115}
        canRecordPayment={true}
      />,
    );
    expect(screen.getByTestId('total-paid')).toHaveTextContent('$50.00');
    expect(screen.getByTestId('remaining-due')).toHaveTextContent('$65.00');
  });

  it('PaymentHistory shows Record Payment button when canRecordPayment is true', () => {
    render(
      <PaymentHistory
        payments={[]}
        currency="NZD"
        amountDue={115}
        total={115}
        canRecordPayment={true}
        onRecordPayment={vi.fn()}
      />,
    );
    expect(screen.getByTestId('record-payment-btn')).toBeInTheDocument();
  });

  it('PaymentHistory hides Record Payment when amountDue is 0', () => {
    render(
      <PaymentHistory
        payments={[makePayment({ amount: 115 })]}
        currency="NZD"
        amountDue={0}
        total={115}
        canRecordPayment={true}
        onRecordPayment={vi.fn()}
      />,
    );
    expect(screen.queryByTestId('record-payment-btn')).not.toBeInTheDocument();
  });

  it('RecordPaymentForm renders all fields', () => {
    render(
      <RecordPaymentForm
        billId="b001"
        amountDue={115}
        currency="NZD"
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByTestId('record-payment-form')).toBeInTheDocument();
    expect(screen.getByTestId('payment-amount-input')).toBeInTheDocument();
    expect(screen.getByTestId('payment-date-input')).toBeInTheDocument();
    expect(screen.getByTestId('payment-reference-input')).toBeInTheDocument();
    expect(screen.getByTestId('payment-bank-input')).toBeInTheDocument();
  });

  it('RecordPaymentForm shows amount due', () => {
    render(
      <RecordPaymentForm
        billId="b001"
        amountDue={115}
        currency="NZD"
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByTestId('payment-amount-due')).toHaveTextContent('$115.00');
  });

  it('RecordPaymentForm calls onSubmit with payment data', () => {
    const onSubmit = vi.fn();
    render(
      <RecordPaymentForm
        billId="b001"
        amountDue={115}
        currency="NZD"
        open={true}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByTestId('payment-reference-input'), {
      target: { value: 'CHQ-100' },
    });

    fireEvent.click(screen.getByTestId('payment-submit-btn'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        billId: 'b001',
        amount: 115,
        reference: 'CHQ-100',
      }),
    );
  });

  it('RecordPaymentForm validates amount > amountDue', () => {
    const onSubmit = vi.fn();
    render(
      <RecordPaymentForm
        billId="b001"
        amountDue={50}
        currency="NZD"
        open={true}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByTestId('payment-amount-input'), {
      target: { value: '100' },
    });

    fireEvent.click(screen.getByTestId('payment-submit-btn'));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/Amount cannot exceed/)).toBeInTheDocument();
  });
});

// --- 3. Approval workflow tests ---

describe('Approval Workflow', () => {
  it('ApprovalProgress shows Draft as current for draft bills', () => {
    render(<ApprovalProgress status="draft" />);
    const progress = screen.getByTestId('approval-progress');
    expect(progress).toBeInTheDocument();
    const draftStep = screen.getByTestId('step-draft');
    // Draft is current step (has border-2 border-teal-500)
    expect(draftStep.className).toContain('border-teal-500');
  });

  it('ApprovalProgress shows Awaiting Approval as current for submitted bills', () => {
    render(<ApprovalProgress status="submitted" />);
    const submittedStep = screen.getByTestId('step-submitted');
    expect(submittedStep.className).toContain('border-teal-500');
    // Draft should be completed (has bg-teal-500)
    const draftStep = screen.getByTestId('step-draft');
    expect(draftStep.className).toContain('bg-teal-500');
  });

  it('ApprovalProgress shows Approved as current for approved bills', () => {
    render(<ApprovalProgress status="approved" />);
    const approvedStep = screen.getByTestId('step-approved');
    expect(approvedStep.className).toContain('border-teal-500');
  });

  it('ApprovalProgress shows all steps completed for paid bills', () => {
    render(<ApprovalProgress status="paid" />);
    // Draft, submitted, approved should all be completed
    expect(screen.getByTestId('step-draft').className).toContain('bg-teal-500');
    expect(screen.getByTestId('step-submitted').className).toContain('bg-teal-500');
    expect(screen.getByTestId('step-approved').className).toContain('bg-teal-500');
    // Paid is current
    expect(screen.getByTestId('step-paid').className).toContain('border-teal-500');
  });

  it('ApprovalProgress shows voided message for voided bills', () => {
    render(<ApprovalProgress status="voided" />);
    expect(screen.getByText('This bill has been voided')).toBeInTheDocument();
  });

  it('BillDetail renders approval progress section', () => {
    const bill = makeBill({ status: 'submitted' });
    render(
      <BillDetail bill={bill} onStatusChange={vi.fn()} />,
    );
    expect(screen.getByTestId('approval-progress')).toBeInTheDocument();
  });

  it('Submit for Approval button is shown on draft bills', () => {
    const bill = makeBill({ status: 'draft' });
    render(
      <BillDetail bill={bill} onStatusChange={vi.fn()} />,
    );
    expect(screen.getByTestId('bill-action-submitted')).toHaveTextContent('Submit');
  });

  it('Approve button is shown on submitted bills', () => {
    const bill = makeBill({ status: 'submitted' });
    render(
      <BillDetail bill={bill} onStatusChange={vi.fn()} />,
    );
    expect(screen.getByTestId('bill-action-approved')).toHaveTextContent('Approve');
  });
});

// --- 4. Bulk actions tests ---

describe('Bulk Actions', () => {
  const bills: Bill[] = [
    makeBill({ id: 'b1', billNumber: 'BILL-001', status: 'submitted', contactName: 'A' }),
    makeBill({ id: 'b2', billNumber: 'BILL-002', status: 'submitted', contactName: 'B' }),
    makeBill({ id: 'b3', billNumber: 'BILL-003', status: 'draft', contactName: 'C' }),
  ];

  it('renders checkboxes when bulk actions are available', () => {
    render(
      <BillList
        bills={bills}
        onBulkApprove={vi.fn()}
        onBulkDelete={vi.fn()}
      />,
    );
    expect(screen.getByTestId('select-all-checkbox')).toBeInTheDocument();
    expect(screen.getByTestId('bill-checkbox-b1')).toBeInTheDocument();
  });

  it('shows selected count when bills are selected', () => {
    render(
      <BillList
        bills={bills}
        onBulkApprove={vi.fn()}
        onBulkDelete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId('bill-checkbox-b1'));
    expect(screen.getByTestId('selected-count')).toHaveTextContent('1 selected');
  });

  it('shows bulk action buttons when items are selected', () => {
    render(
      <BillList
        bills={bills}
        onBulkApprove={vi.fn()}
        onBulkDelete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId('bill-checkbox-b1'));
    expect(screen.getByTestId('bulk-approve-btn')).toBeInTheDocument();
    expect(screen.getByTestId('bulk-delete-btn')).toBeInTheDocument();
  });

  it('select all selects all visible bills', () => {
    render(
      <BillList
        bills={bills}
        onBulkApprove={vi.fn()}
        onBulkDelete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId('select-all-checkbox'));
    expect(screen.getByTestId('selected-count')).toHaveTextContent('3 selected');
  });

  it('calls onBulkApprove with selected IDs', () => {
    const onBulkApprove = vi.fn();
    render(
      <BillList
        bills={bills}
        onBulkApprove={onBulkApprove}
        onBulkDelete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId('bill-checkbox-b1'));
    fireEvent.click(screen.getByTestId('bill-checkbox-b2'));
    fireEvent.click(screen.getByTestId('bulk-approve-btn'));
    expect(onBulkApprove).toHaveBeenCalledWith(expect.arrayContaining(['b1', 'b2']));
  });

  it('calls onBulkDelete with selected IDs', () => {
    const onBulkDelete = vi.fn();
    render(
      <BillList
        bills={bills}
        onBulkApprove={vi.fn()}
        onBulkDelete={onBulkDelete}
      />,
    );
    fireEvent.click(screen.getByTestId('bill-checkbox-b3'));
    fireEvent.click(screen.getByTestId('bulk-delete-btn'));
    expect(onBulkDelete).toHaveBeenCalledWith(['b3']);
  });

  it('clears selection after bulk action', () => {
    render(
      <BillList
        bills={bills}
        onBulkApprove={vi.fn()}
        onBulkDelete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId('bill-checkbox-b1'));
    expect(screen.getByTestId('selected-count')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('bulk-approve-btn'));
    expect(screen.queryByTestId('selected-count')).not.toBeInTheDocument();
  });

  it('does not render checkboxes when no bulk action handlers', () => {
    render(<BillList bills={bills} />);
    expect(screen.queryByTestId('select-all-checkbox')).not.toBeInTheDocument();
  });
});
