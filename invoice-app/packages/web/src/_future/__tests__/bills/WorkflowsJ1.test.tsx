// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// --- RecurringBillScheduleInfo tests ---

import { RecurringBillScheduleInfo } from '../components/RecurringBillScheduleInfo';
import type { RecurringBillScheduleInfo as BillScheduleInfoType } from '../hooks/useRecurringBillGeneration';

const MOCK_BILL_SCHEDULE: BillScheduleInfoType = {
  recurringBillId: 'rb-001',
  nextDate: '2024-04-01',
  frequency: 'quarterly',
  supplierName: 'Office Supplies Co',
  lastGeneratedDate: '2024-01-01',
  timesGenerated: 3,
  status: 'active',
};

describe('RecurringBillScheduleInfo', () => {
  it('renders next date, frequency and supplier name', () => {
    render(
      <RecurringBillScheduleInfo schedule={MOCK_BILL_SCHEDULE} onGenerateNow={vi.fn()} />,
    );

    expect(screen.getByTestId('bill-schedule-next-date')).toBeTruthy();
    expect(screen.getByTestId('bill-schedule-frequency').textContent).toBe('quarterly');
    expect(screen.getByTestId('bill-schedule-supplier').textContent).toBe('Office Supplies Co');
  });

  it('shows Generate Now button when active', () => {
    const onGenerate = vi.fn();
    render(
      <RecurringBillScheduleInfo schedule={MOCK_BILL_SCHEDULE} onGenerateNow={onGenerate} />,
    );

    const btn = screen.getByTestId('generate-bill-now-button');
    fireEvent.click(btn);
    expect(onGenerate).toHaveBeenCalledTimes(1);
  });

  it('hides Generate Now when completed', () => {
    const schedule = { ...MOCK_BILL_SCHEDULE, status: 'completed' as const };
    render(
      <RecurringBillScheduleInfo schedule={schedule} onGenerateNow={vi.fn()} />,
    );
    expect(screen.queryByTestId('generate-bill-now-button')).toBeNull();
  });
});

// --- BillApprovalWorkflow tests ---

import { BillApprovalWorkflow } from '../components/BillApprovalWorkflow';
import type { BillApprovalHistoryEntry } from '../hooks/useBillApproval';

const MOCK_BILL_HISTORY: BillApprovalHistoryEntry[] = [
  {
    id: 'bah-1',
    billId: 'bill-001',
    action: 'submitted',
    userId: 'u-1',
    userName: 'Alice',
    notes: null,
    timestamp: '2024-03-01T09:00:00Z',
  },
];

describe('BillApprovalWorkflow', () => {
  const defaultProps = {
    status: 'draft' as const,
    history: [],
    onSubmitForApproval: vi.fn(),
    onApprove: vi.fn(),
    onReject: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows draft status and Submit for Approval button', () => {
    render(<BillApprovalWorkflow {...defaultProps} />);

    expect(screen.getByTestId('bill-approval-status-badge').textContent).toBe('Draft');
    expect(screen.getByTestId('submit-bill-for-approval-button')).toBeTruthy();
  });

  it('shows Approve/Reject for submitted bill when approver', () => {
    render(
      <BillApprovalWorkflow {...defaultProps} status="submitted" isApprover={true} />,
    );

    expect(screen.getByTestId('approve-bill-button')).toBeTruthy();
    expect(screen.getByTestId('reject-bill-toggle-button')).toBeTruthy();
  });

  it('bill rejection requires a reason', () => {
    const onReject = vi.fn();
    render(
      <BillApprovalWorkflow
        {...defaultProps}
        status="submitted"
        isApprover={true}
        onReject={onReject}
      />,
    );

    fireEvent.click(screen.getByTestId('reject-bill-toggle-button'));

    const confirmBtn = screen.getByTestId('confirm-bill-reject-button');
    expect(confirmBtn).toHaveProperty('disabled', true);

    fireEvent.change(screen.getByTestId('bill-reject-reason-input'), {
      target: { value: 'Duplicate bill' },
    });

    fireEvent.click(confirmBtn);
    expect(onReject).toHaveBeenCalledWith('Duplicate bill');
  });

  it('renders bill approval history entries', () => {
    render(
      <BillApprovalWorkflow
        {...defaultProps}
        status="submitted"
        history={MOCK_BILL_HISTORY}
      />,
    );

    const entries = screen.getAllByTestId('bill-history-entry');
    expect(entries).toHaveLength(1);
    expect(entries[0].textContent).toContain('Alice');
  });
});
