// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeaveTypeList } from '../components/LeaveTypeList';
import type { LeaveType } from '../hooks/useLeaveTypes';

const SAMPLE_LEAVE_TYPES: LeaveType[] = [
  { id: 'lt-001', name: 'Annual Leave', paidLeave: true, showOnPayslip: true, defaultDaysPerYear: 20 },
  { id: 'lt-002', name: 'Sick Leave', paidLeave: true, showOnPayslip: true, defaultDaysPerYear: 5 },
  { id: 'lt-003', name: 'Parental Leave', paidLeave: false, showOnPayslip: false, defaultDaysPerYear: 0 },
];

describe('LeaveTypeList', () => {
  it('renders all leave types', () => {
    render(<LeaveTypeList leaveTypes={SAMPLE_LEAVE_TYPES} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText('Annual Leave')).toBeInTheDocument();
    expect(screen.getByText('Sick Leave')).toBeInTheDocument();
    expect(screen.getByText('Parental Leave')).toBeInTheDocument();
  });

  it('renders data-testid for list', () => {
    render(<LeaveTypeList leaveTypes={SAMPLE_LEAVE_TYPES} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByTestId('leave-type-list')).toBeInTheDocument();
  });

  it('renders data-testid for each item', () => {
    render(<LeaveTypeList leaveTypes={SAMPLE_LEAVE_TYPES} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByTestId('leave-type-lt-001')).toBeInTheDocument();
    expect(screen.getByTestId('leave-type-lt-002')).toBeInTheDocument();
    expect(screen.getByTestId('leave-type-lt-003')).toBeInTheDocument();
  });

  it('shows Paid badge for paid leave', () => {
    render(<LeaveTypeList leaveTypes={SAMPLE_LEAVE_TYPES} onEdit={vi.fn()} onDelete={vi.fn()} />);
    const paidBadges = screen.getAllByText('Paid');
    expect(paidBadges.length).toBe(2);
  });

  it('shows Unpaid badge for unpaid leave', () => {
    render(<LeaveTypeList leaveTypes={SAMPLE_LEAVE_TYPES} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Unpaid')).toBeInTheDocument();
  });

  it('shows days per year for types with > 0', () => {
    render(<LeaveTypeList leaveTypes={SAMPLE_LEAVE_TYPES} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('20 days/year')).toBeInTheDocument();
    expect(screen.getByText('5 days/year')).toBeInTheDocument();
  });

  it('renders Edit button for each type', () => {
    render(<LeaveTypeList leaveTypes={SAMPLE_LEAVE_TYPES} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByTestId('edit-leave-type-lt-001')).toBeInTheDocument();
    expect(screen.getByTestId('edit-leave-type-lt-002')).toBeInTheDocument();
  });

  it('renders Delete button for each type', () => {
    render(<LeaveTypeList leaveTypes={SAMPLE_LEAVE_TYPES} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByTestId('delete-leave-type-lt-001')).toBeInTheDocument();
  });

  it('calls onEdit when Edit is clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<LeaveTypeList leaveTypes={SAMPLE_LEAVE_TYPES} onEdit={onEdit} onDelete={vi.fn()} />);

    await user.click(screen.getByTestId('edit-leave-type-lt-001'));
    expect(onEdit).toHaveBeenCalledWith(SAMPLE_LEAVE_TYPES[0]);
  });

  it('calls onDelete when Delete is clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<LeaveTypeList leaveTypes={SAMPLE_LEAVE_TYPES} onEdit={vi.fn()} onDelete={onDelete} />);

    await user.click(screen.getByTestId('delete-leave-type-lt-001'));
    expect(onDelete).toHaveBeenCalledWith('lt-001');
  });

  it('shows empty state when no leave types', () => {
    render(<LeaveTypeList leaveTypes={[]} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByTestId('leave-types-empty')).toBeInTheDocument();
    expect(screen.getByText('No leave types configured.')).toBeInTheDocument();
  });
});
