// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeaveRequestList } from '../components/LeaveRequestList';
import type { LeaveRequest } from '../hooks/useLeaveRequests';

const SAMPLE_REQUESTS: LeaveRequest[] = [
  {
    id: 'lr-001',
    employeeId: 'emp-001',
    employeeName: 'Alice Smith',
    leaveType: 'annual',
    startDate: '2026-03-01',
    endDate: '2026-03-05',
    hours: 40,
    status: 'pending',
    notes: 'Family holiday',
    createdAt: '2026-02-15T00:00:00Z',
  },
  {
    id: 'lr-002',
    employeeId: 'emp-002',
    employeeName: 'Bob Jones',
    leaveType: 'sick',
    startDate: '2026-02-20',
    endDate: '2026-02-21',
    hours: 16,
    status: 'approved',
    notes: null,
    createdAt: '2026-02-18T00:00:00Z',
  },
  {
    id: 'lr-003',
    employeeId: 'emp-003',
    employeeName: 'Carol White',
    leaveType: 'bereavement',
    startDate: '2026-04-01',
    endDate: '2026-04-03',
    hours: 24,
    status: 'declined',
    notes: null,
    createdAt: '2026-03-20T00:00:00Z',
  },
  {
    id: 'lr-004',
    employeeId: 'emp-001',
    employeeName: 'Alice Smith',
    leaveType: 'parental',
    startDate: '2026-06-01',
    endDate: '2026-08-31',
    hours: 520,
    status: 'pending',
    notes: 'New baby',
    createdAt: '2026-04-01T00:00:00Z',
  },
];

describe('LeaveRequestList', () => {
  it('renders table headers', () => {
    render(<LeaveRequestList requests={SAMPLE_REQUESTS} />);

    expect(screen.getByText('Employee')).toBeInTheDocument();
    expect(screen.getByText('Leave Type')).toBeInTheDocument();
    expect(screen.getByText('Start Date')).toBeInTheDocument();
    expect(screen.getByText('End Date')).toBeInTheDocument();
    expect(screen.getByText('Hours')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('renders all leave requests', () => {
    render(<LeaveRequestList requests={SAMPLE_REQUESTS} />);

    expect(screen.getByText('Annual Leave')).toBeInTheDocument();
    expect(screen.getByText('Sick Leave')).toBeInTheDocument();
    expect(screen.getByText('Bereavement')).toBeInTheDocument();
    expect(screen.getByText('Parental Leave')).toBeInTheDocument();
  });

  it('renders leave dates', () => {
    render(<LeaveRequestList requests={SAMPLE_REQUESTS} />);

    expect(screen.getByText('2026-03-01')).toBeInTheDocument();
    expect(screen.getByText('2026-03-05')).toBeInTheDocument();
  });

  it('renders hours', () => {
    render(<LeaveRequestList requests={SAMPLE_REQUESTS} />);

    expect(screen.getByText('40')).toBeInTheDocument();
    expect(screen.getByText('16')).toBeInTheDocument();
    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.getByText('520')).toBeInTheDocument();
  });

  it('renders status badges', () => {
    render(<LeaveRequestList requests={SAMPLE_REQUESTS} />);

    // Status badges are spans with rounded-full class, filter out select options
    const pendingBadges = screen.getAllByText('Pending').filter(
      (el) => el.tagName === 'SPAN' && el.classList.contains('rounded-full'),
    );
    expect(pendingBadges.length).toBe(2);

    const approvedBadges = screen.getAllByText('Approved').filter(
      (el) => el.tagName === 'SPAN' && el.classList.contains('rounded-full'),
    );
    expect(approvedBadges.length).toBe(1);

    const declinedBadges = screen.getAllByText('Declined').filter(
      (el) => el.tagName === 'SPAN' && el.classList.contains('rounded-full'),
    );
    expect(declinedBadges.length).toBe(1);
  });

  it('renders status filter select', () => {
    render(<LeaveRequestList requests={SAMPLE_REQUESTS} />);
    expect(screen.getByLabelText('Filter by status')).toBeInTheDocument();
  });

  it('filters by status: pending', async () => {
    const user = userEvent.setup();
    render(<LeaveRequestList requests={SAMPLE_REQUESTS} />);

    const statusSelect = screen.getByLabelText('Filter by status');
    await user.selectOptions(statusSelect, 'pending');

    expect(screen.getByText('Annual Leave')).toBeInTheDocument();
    expect(screen.getByText('Parental Leave')).toBeInTheDocument();
    expect(screen.queryByText('Sick Leave')).not.toBeInTheDocument();
    expect(screen.queryByText('Bereavement')).not.toBeInTheDocument();
  });

  it('filters by status: approved', async () => {
    const user = userEvent.setup();
    render(<LeaveRequestList requests={SAMPLE_REQUESTS} />);

    const statusSelect = screen.getByLabelText('Filter by status');
    await user.selectOptions(statusSelect, 'approved');

    expect(screen.getByText('Sick Leave')).toBeInTheDocument();
    expect(screen.queryByText('Annual Leave')).not.toBeInTheDocument();
  });

  it('filters by status: declined', async () => {
    const user = userEvent.setup();
    render(<LeaveRequestList requests={SAMPLE_REQUESTS} />);

    const statusSelect = screen.getByLabelText('Filter by status');
    await user.selectOptions(statusSelect, 'declined');

    expect(screen.getByText('Bereavement')).toBeInTheDocument();
    expect(screen.queryByText('Annual Leave')).not.toBeInTheDocument();
  });

  it('shows "No leave requests found" when empty', () => {
    render(<LeaveRequestList requests={[]} />);
    expect(screen.getByText('No leave requests found')).toBeInTheDocument();
  });

  it('shows "No leave requests found" when all filtered out', async () => {
    const user = userEvent.setup();
    const requests: LeaveRequest[] = [
      {
        id: 'lr-only',
        employeeId: 'emp-001',
        employeeName: 'Alice Smith',
        leaveType: 'annual',
        startDate: '2026-03-01',
        endDate: '2026-03-05',
        hours: 40,
        status: 'pending',
        notes: null,
        createdAt: '2026-02-15T00:00:00Z',
      },
    ];
    render(<LeaveRequestList requests={requests} />);

    const statusSelect = screen.getByLabelText('Filter by status');
    await user.selectOptions(statusSelect, 'approved');

    expect(screen.getByText('No leave requests found')).toBeInTheDocument();
  });

  it('shows approve/decline buttons only for pending requests', () => {
    const onApprove = vi.fn();
    const onDecline = vi.fn();
    render(
      <LeaveRequestList
        requests={SAMPLE_REQUESTS}
        onApprove={onApprove}
        onDecline={onDecline}
      />,
    );

    // Pending requests should have approve and decline buttons
    const approveButtons = screen.getAllByLabelText(/Approve leave request/);
    const declineButtons = screen.getAllByLabelText(/Decline leave request/);

    // 2 pending requests
    expect(approveButtons).toHaveLength(2);
    expect(declineButtons).toHaveLength(2);
  });

  it('calls onApprove when approve button is clicked', async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn();
    render(
      <LeaveRequestList requests={SAMPLE_REQUESTS} onApprove={onApprove} />,
    );

    const approveButton = screen.getByLabelText('Approve leave request lr-001');
    await user.click(approveButton);

    expect(onApprove).toHaveBeenCalledWith('lr-001');
  });

  it('calls onDecline when decline button is clicked', async () => {
    const user = userEvent.setup();
    const onDecline = vi.fn();
    render(
      <LeaveRequestList requests={SAMPLE_REQUESTS} onDecline={onDecline} />,
    );

    const declineButton = screen.getByLabelText('Decline leave request lr-001');
    await user.click(declineButton);

    expect(onDecline).toHaveBeenCalledWith('lr-001');
  });

  it('renders data-testid for the container', () => {
    render(<LeaveRequestList requests={[]} />);
    expect(screen.getByTestId('leave-request-list')).toBeInTheDocument();
  });
});
