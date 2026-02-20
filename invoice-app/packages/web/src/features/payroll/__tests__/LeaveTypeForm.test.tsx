// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeaveTypeForm } from '../components/LeaveTypeForm';
import type { LeaveType } from '../hooks/useLeaveTypes';

const EXISTING_LEAVE_TYPE: LeaveType = {
  id: 'lt-001',
  name: 'Annual Leave',
  paidLeave: true,
  showOnPayslip: true,
  defaultDaysPerYear: 20,
};

describe('LeaveTypeForm', () => {
  it('renders form with data-testid', () => {
    render(<LeaveTypeForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByTestId('leave-type-form')).toBeInTheDocument();
  });

  it('renders all fields', () => {
    render(<LeaveTypeForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText('Leave Type Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Default Days Per Year')).toBeInTheDocument();
    expect(screen.getByTestId('leave-type-paid')).toBeInTheDocument();
    expect(screen.getByTestId('leave-type-show-payslip')).toBeInTheDocument();
  });

  it('shows "Add Leave Type" button when creating', () => {
    render(<LeaveTypeForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByTestId('save-leave-type')).toHaveTextContent('Add Leave Type');
  });

  it('shows "Update" button when editing', () => {
    render(<LeaveTypeForm leaveType={EXISTING_LEAVE_TYPE} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByTestId('save-leave-type')).toHaveTextContent('Update');
  });

  it('pre-fills fields when editing', () => {
    render(<LeaveTypeForm leaveType={EXISTING_LEAVE_TYPE} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText('Leave Type Name')).toHaveValue('Annual Leave');
    expect(screen.getByLabelText('Default Days Per Year')).toHaveValue(20);
    expect(screen.getByTestId('leave-type-paid')).toBeChecked();
    expect(screen.getByTestId('leave-type-show-payslip')).toBeChecked();
  });

  it('disables submit when name is empty', () => {
    render(<LeaveTypeForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByTestId('save-leave-type')).toBeDisabled();
  });

  it('enables submit when name is provided', () => {
    render(<LeaveTypeForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Leave Type Name'), { target: { value: 'Bereavement' } });
    expect(screen.getByTestId('save-leave-type')).not.toBeDisabled();
  });

  it('calls onSubmit with form data', () => {
    const onSubmit = vi.fn();
    render(<LeaveTypeForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Leave Type Name'), { target: { value: 'Bereavement' } });
    fireEvent.change(screen.getByLabelText('Default Days Per Year'), { target: { value: '3' } });

    fireEvent.submit(screen.getByTestId('leave-type-form'));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Bereavement',
      paidLeave: true,
      showOnPayslip: true,
      defaultDaysPerYear: 3,
    });
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<LeaveTypeForm onSubmit={vi.fn()} onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('toggles paid leave checkbox', async () => {
    const user = userEvent.setup();
    render(<LeaveTypeForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

    const checkbox = screen.getByTestId('leave-type-paid');
    expect(checkbox).toBeChecked();

    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });
});
