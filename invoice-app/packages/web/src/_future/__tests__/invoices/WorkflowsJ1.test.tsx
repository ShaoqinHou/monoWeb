// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// --- RecurringScheduleInfo tests ---

import { RecurringScheduleInfo } from '../components/RecurringScheduleInfo';
import type { RecurringScheduleInfo as ScheduleInfoType } from '../hooks/useRecurringGeneration';

const MOCK_SCHEDULE: ScheduleInfoType = {
  recurringId: 'rec-001',
  nextDate: '2024-03-15',
  frequency: 'monthly',
  lastGeneratedDate: '2024-02-15',
  timesGenerated: 5,
  status: 'active',
};

describe('RecurringScheduleInfo', () => {
  it('renders next date, frequency and last generated date', () => {
    const onGenerate = vi.fn();
    render(<RecurringScheduleInfo schedule={MOCK_SCHEDULE} onGenerateNow={onGenerate} />);

    expect(screen.getByTestId('schedule-next-date')).toBeTruthy();
    expect(screen.getByTestId('schedule-frequency').textContent).toBe('monthly');
    expect(screen.getByTestId('schedule-last-generated')).toBeTruthy();
  });

  it('shows "Never" when lastGeneratedDate is null', () => {
    const schedule = { ...MOCK_SCHEDULE, lastGeneratedDate: null, timesGenerated: 0 };
    render(<RecurringScheduleInfo schedule={schedule} onGenerateNow={vi.fn()} />);

    expect(screen.getByTestId('schedule-last-generated').textContent).toBe('Never');
  });

  it('shows Active status badge', () => {
    render(<RecurringScheduleInfo schedule={MOCK_SCHEDULE} onGenerateNow={vi.fn()} />);
    expect(screen.getByTestId('schedule-status-badge').textContent).toBe('Active');
  });

  it('shows Generate Now button when active and calls handler on click', () => {
    const onGenerate = vi.fn();
    render(<RecurringScheduleInfo schedule={MOCK_SCHEDULE} onGenerateNow={onGenerate} />);

    const btn = screen.getByTestId('generate-now-button');
    expect(btn).toBeTruthy();
    fireEvent.click(btn);
    expect(onGenerate).toHaveBeenCalledTimes(1);
  });

  it('hides Generate Now button when paused', () => {
    const schedule = { ...MOCK_SCHEDULE, status: 'paused' as const };
    render(<RecurringScheduleInfo schedule={schedule} onGenerateNow={vi.fn()} />);
    expect(screen.queryByTestId('generate-now-button')).toBeNull();
  });

  it('displays generation count', () => {
    render(<RecurringScheduleInfo schedule={MOCK_SCHEDULE} onGenerateNow={vi.fn()} />);
    expect(screen.getByTestId('schedule-generation-count').textContent).toContain('5 times');
  });
});

// --- ApprovalWorkflow tests ---

import { ApprovalWorkflow } from '../components/ApprovalWorkflow';
import type { ApprovalHistoryEntry } from '../hooks/useInvoiceApproval';

const MOCK_HISTORY: ApprovalHistoryEntry[] = [
  {
    id: 'ah-1',
    invoiceId: 'inv-001',
    action: 'submitted',
    userId: 'u-1',
    userName: 'Jane Smith',
    notes: null,
    timestamp: '2024-02-10T09:00:00Z',
  },
  {
    id: 'ah-2',
    invoiceId: 'inv-001',
    action: 'approved',
    userId: 'u-2',
    userName: 'John Doe',
    notes: 'Looks good',
    timestamp: '2024-02-10T10:00:00Z',
  },
];

describe('ApprovalWorkflow', () => {
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
    render(<ApprovalWorkflow {...defaultProps} />);

    expect(screen.getByTestId('approval-status-badge').textContent).toBe('Draft');
    expect(screen.getByTestId('submit-for-approval-button')).toBeTruthy();
  });

  it('calls onSubmitForApproval when submit button clicked', () => {
    const onSubmit = vi.fn();
    render(<ApprovalWorkflow {...defaultProps} onSubmitForApproval={onSubmit} />);

    fireEvent.click(screen.getByTestId('submit-for-approval-button'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('shows Approve and Reject buttons for submitted status when isApprover', () => {
    render(
      <ApprovalWorkflow {...defaultProps} status="submitted" isApprover={true} />,
    );

    expect(screen.getByTestId('approval-status-badge').textContent).toBe('Submitted for Approval');
    expect(screen.getByTestId('approve-button')).toBeTruthy();
    expect(screen.getByTestId('reject-toggle-button')).toBeTruthy();
  });

  it('does not show Approve/Reject when not an approver', () => {
    render(<ApprovalWorkflow {...defaultProps} status="submitted" isApprover={false} />);

    expect(screen.queryByTestId('approve-button')).toBeNull();
    expect(screen.queryByTestId('reject-toggle-button')).toBeNull();
  });

  it('rejection requires a reason', () => {
    const onReject = vi.fn();
    render(
      <ApprovalWorkflow {...defaultProps} status="submitted" isApprover={true} onReject={onReject} />,
    );

    fireEvent.click(screen.getByTestId('reject-toggle-button'));
    expect(screen.getByTestId('reject-reason-input')).toBeTruthy();

    // Confirm button should be disabled when reason is empty
    const confirmBtn = screen.getByTestId('confirm-reject-button');
    expect(confirmBtn).toHaveProperty('disabled', true);

    // Type a reason
    fireEvent.change(screen.getByTestId('reject-reason-input'), {
      target: { value: 'Missing details' },
    });

    fireEvent.click(confirmBtn);
    expect(onReject).toHaveBeenCalledWith('Missing details');
  });

  it('renders approval history entries', () => {
    render(
      <ApprovalWorkflow {...defaultProps} status="approved" history={MOCK_HISTORY} />,
    );

    const entries = screen.getAllByTestId('history-entry');
    expect(entries).toHaveLength(2);
    expect(entries[0].textContent).toContain('Jane Smith');
    expect(entries[1].textContent).toContain('John Doe');
    expect(entries[1].textContent).toContain('Looks good');
  });
});

// --- QuoteWorkflow tests ---

import { QuoteWorkflow } from '../components/QuoteWorkflow';

describe('QuoteWorkflow', () => {
  const defaultProps = {
    status: 'sent' as const,
    onAccept: vi.fn(),
    onDecline: vi.fn(),
    onConvertToInvoice: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows sent status with Accept and Decline buttons', () => {
    render(<QuoteWorkflow {...defaultProps} />);

    expect(screen.getByTestId('quote-status-badge').textContent).toBe('Sent');
    expect(screen.getByTestId('accept-quote-button')).toBeTruthy();
    expect(screen.getByTestId('decline-toggle-button')).toBeTruthy();
  });

  it('calls onAccept when Accept button clicked', () => {
    const onAccept = vi.fn();
    render(<QuoteWorkflow {...defaultProps} onAccept={onAccept} />);

    fireEvent.click(screen.getByTestId('accept-quote-button'));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it('shows Convert to Invoice button when accepted', () => {
    render(<QuoteWorkflow {...defaultProps} status="accepted" />);

    expect(screen.getByTestId('quote-status-badge').textContent).toBe('Accepted');
    expect(screen.getByTestId('convert-to-invoice-button')).toBeTruthy();
    expect(screen.queryByTestId('accept-quote-button')).toBeNull();
  });

  it('decline requires a reason', () => {
    const onDecline = vi.fn();
    render(<QuoteWorkflow {...defaultProps} onDecline={onDecline} />);

    fireEvent.click(screen.getByTestId('decline-toggle-button'));
    expect(screen.getByTestId('decline-reason-input')).toBeTruthy();

    const confirmBtn = screen.getByTestId('confirm-decline-button');
    expect(confirmBtn).toHaveProperty('disabled', true);

    fireEvent.change(screen.getByTestId('decline-reason-input'), {
      target: { value: 'Too expensive' },
    });

    fireEvent.click(confirmBtn);
    expect(onDecline).toHaveBeenCalledWith('Too expensive');
  });

  it('shows lifecycle progression for quote', () => {
    render(<QuoteWorkflow {...defaultProps} status="invoiced" />);
    expect(screen.getByTestId('quote-lifecycle')).toBeTruthy();
    expect(screen.getByTestId('quote-status-badge').textContent).toBe('Invoiced');
  });
});
