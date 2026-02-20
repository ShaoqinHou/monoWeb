// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmployeeForm } from '../components/EmployeeForm';
import type { Employee } from '../types';

const EXISTING_EMPLOYEE: Employee = {
  id: 'emp-001',
  firstName: 'Sarah',
  lastName: 'Chen',
  email: 'sarah.chen@example.com',
  position: 'Software Engineer',
  startDate: '2023-03-15',
  salary: 95000,
  payFrequency: 'monthly',
  status: 'active',
  taxCode: 'M',
  irdNumber: '12-345-678',
  kiwiSaverRate: 4,
  bankAccount: '01-0102-0123456-00',
};

/** Helper: find the input within a label's parent container */
function getInputByLabel(labelText: string): HTMLInputElement | HTMLSelectElement {
  const label = screen.getByText(labelText);
  const container = label.closest('.flex.flex-col')!;
  const input = container.querySelector('input, select') as HTMLInputElement | HTMLSelectElement;
  return input;
}

describe('EmployeeForm', () => {
  it('renders form with data-testid', () => {
    render(<EmployeeForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByTestId('employee-form')).toBeInTheDocument();
  });

  it('renders all label texts', () => {
    render(<EmployeeForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByText('First Name')).toBeInTheDocument();
    expect(screen.getByText('Last Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Position')).toBeInTheDocument();
    expect(screen.getByText('Start Date')).toBeInTheDocument();
    expect(screen.getByText('Annual Salary')).toBeInTheDocument();
    expect(screen.getByText('Pay Frequency')).toBeInTheDocument();
    expect(screen.getByText('Tax Code')).toBeInTheDocument();
    expect(screen.getByText('KiwiSaver Rate')).toBeInTheDocument();
    expect(screen.getByText('Bank Account')).toBeInTheDocument();
    expect(screen.getByText('IRD Number')).toBeInTheDocument();
  });

  it('shows "Add Employee" button when creating new', () => {
    render(<EmployeeForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Add Employee' })).toBeInTheDocument();
  });

  it('shows "Save Changes" button when editing existing', () => {
    render(<EmployeeForm employee={EXISTING_EMPLOYEE} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
  });

  it('pre-fills fields when editing an existing employee', () => {
    render(<EmployeeForm employee={EXISTING_EMPLOYEE} onSubmit={vi.fn()} onCancel={vi.fn()} />);

    expect(getInputByLabel('First Name')).toHaveValue('Sarah');
    expect(getInputByLabel('Last Name')).toHaveValue('Chen');
    expect(getInputByLabel('Email')).toHaveValue('sarah.chen@example.com');
    expect(getInputByLabel('Position')).toHaveValue('Software Engineer');
    expect(getInputByLabel('Start Date')).toHaveValue('2023-03-15');
    expect(getInputByLabel('Annual Salary')).toHaveValue(95000);
  });

  it('disables submit when required fields are empty', () => {
    render(<EmployeeForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const submitBtn = screen.getByRole('button', { name: 'Add Employee' });
    expect(submitBtn).toBeDisabled();
  });

  it('enables submit when all required fields are filled', () => {
    render(<EmployeeForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.change(getInputByLabel('First Name'), { target: { value: 'John' } });
    fireEvent.change(getInputByLabel('Last Name'), { target: { value: 'Doe' } });
    fireEvent.change(getInputByLabel('Email'), { target: { value: 'john@test.com' } });
    fireEvent.change(getInputByLabel('Position'), { target: { value: 'Tester' } });
    fireEvent.change(getInputByLabel('Start Date'), { target: { value: '2026-01-01' } });
    fireEvent.change(getInputByLabel('Annual Salary'), { target: { value: '80000' } });

    const submitBtn = screen.getByRole('button', { name: 'Add Employee' });
    expect(submitBtn).not.toBeDisabled();
  });

  it('calls onSubmit with form data on submit', () => {
    const onSubmit = vi.fn();
    render(<EmployeeForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    fireEvent.change(getInputByLabel('First Name'), { target: { value: 'John' } });
    fireEvent.change(getInputByLabel('Last Name'), { target: { value: 'Doe' } });
    fireEvent.change(getInputByLabel('Email'), { target: { value: 'john@test.com' } });
    fireEvent.change(getInputByLabel('Position'), { target: { value: 'Tester' } });
    fireEvent.change(getInputByLabel('Start Date'), { target: { value: '2026-01-01' } });
    fireEvent.change(getInputByLabel('Annual Salary'), { target: { value: '80000' } });

    fireEvent.submit(screen.getByTestId('employee-form'));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        position: 'Tester',
        startDate: '2026-01-01',
        salary: 80000,
        payFrequency: 'monthly',
        taxCode: 'M',
        kiwiSaverRate: 3,
      }),
    );
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<EmployeeForm onSubmit={vi.fn()} onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('disables buttons when loading', () => {
    render(<EmployeeForm onSubmit={vi.fn()} onCancel={vi.fn()} loading />);
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  it('renders IRD Number field with placeholder', () => {
    render(<EmployeeForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByPlaceholderText('XX-XXX-XXX')).toBeInTheDocument();
  });

  it('renders tax code select with default M', () => {
    render(<EmployeeForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const taxCodeSelect = getInputByLabel('Tax Code');
    expect(taxCodeSelect).toHaveValue('M');
  });

  it('renders KiwiSaver rate select with default 3', () => {
    render(<EmployeeForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const ksSelect = getInputByLabel('KiwiSaver Rate');
    expect(ksSelect).toHaveValue('3');
  });
});
