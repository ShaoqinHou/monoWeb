import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmployeeDetail } from '../components/EmployeeDetail';
import type { Employee } from '../types';

const SAMPLE_EMPLOYEE: Employee = {
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
  kiwiSaverRate: 3,
  bankAccount: '06-0123-4567890-00',
};

describe('EmployeeDetail', () => {
  it('renders employee name and position', () => {
    render(<EmployeeDetail employee={SAMPLE_EMPLOYEE} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
  });

  it('renders avatar initials', () => {
    render(<EmployeeDetail employee={SAMPLE_EMPLOYEE} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('SC')).toBeInTheDocument();
  });

  it('renders Active status badge', () => {
    render(<EmployeeDetail employee={SAMPLE_EMPLOYEE} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders personal information', () => {
    render(<EmployeeDetail employee={SAMPLE_EMPLOYEE} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('sarah.chen@example.com')).toBeInTheDocument();
    expect(screen.getByText('06-0123-4567890-00')).toBeInTheDocument();
  });

  it('renders salary and tax details', () => {
    render(<EmployeeDetail employee={SAMPLE_EMPLOYEE} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('$95,000.00')).toBeInTheDocument();
    expect(screen.getByText('monthly')).toBeInTheDocument();
    expect(screen.getByText('M')).toBeInTheDocument();
    expect(screen.getByText('3%')).toBeInTheDocument();
  });

  it('shows "Not enrolled" for undefined kiwiSaverRate', () => {
    const empNoKiwi = { ...SAMPLE_EMPLOYEE, kiwiSaverRate: undefined };
    render(<EmployeeDetail employee={empNoKiwi} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('Not enrolled')).toBeInTheDocument();
  });

  it('calls onEdit when Edit button clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<EmployeeDetail employee={SAMPLE_EMPLOYEE} onEdit={onEdit} onDelete={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when Delete button clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<EmployeeDetail employee={SAMPLE_EMPLOYEE} onEdit={vi.fn()} onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('renders data-testid="employee-detail"', () => {
    render(<EmployeeDetail employee={SAMPLE_EMPLOYEE} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByTestId('employee-detail')).toBeInTheDocument();
  });
});
