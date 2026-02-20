import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmployeeList } from '../components/EmployeeList';
import type { Employee } from '../types';

const SAMPLE_EMPLOYEES: Employee[] = [
  { id: 'emp-001', firstName: 'Sarah', lastName: 'Chen', email: 'sarah.chen@example.com', position: 'Software Engineer', startDate: '2023-03-15', salary: 95000, payFrequency: 'monthly', status: 'active', taxCode: 'M', employmentType: 'employee', nextPaymentDate: '2023-07-18' },
  { id: 'emp-002', firstName: 'James', lastName: 'Wilson', email: 'james.wilson@example.com', position: 'Product Manager', startDate: '2022-08-01', salary: 110000, payFrequency: 'monthly', status: 'active', taxCode: 'M', employmentType: 'employee', nextPaymentDate: '2023-07-18' },
  { id: 'emp-003', firstName: 'Emily', lastName: 'Taylor', email: 'emily.taylor@example.com', position: 'UX Designer', startDate: '2024-01-10', salary: 85000, payFrequency: 'fortnightly', status: 'active', taxCode: 'ME', employmentType: 'employee', nextPaymentDate: '2023-07-25' },
  { id: 'emp-004', firstName: 'Michael', lastName: 'Brown', email: 'michael.brown@example.com', position: 'Sales Representative', startDate: '2021-06-20', salary: 72000, payFrequency: 'monthly', status: 'inactive', taxCode: 'M', employmentType: 'contractor', nextPaymentDate: '2023-07-18' },
  { id: 'emp-005', firstName: 'Lisa', lastName: 'Martinez', email: 'lisa.martinez@example.com', position: 'Office Manager', startDate: '2023-11-05', salary: 65000, payFrequency: 'monthly', status: 'active', taxCode: 'S', employmentType: 'employee', nextPaymentDate: '2023-07-18' },
];

describe('EmployeeList', () => {
  it('renders all employees passed as props', () => {
    render(<EmployeeList employees={SAMPLE_EMPLOYEES} />);

    expect(screen.getByText('Sarah')).toBeInTheDocument();
    expect(screen.getByText('Chen')).toBeInTheDocument();
    expect(screen.getByText('James')).toBeInTheDocument();
    expect(screen.getByText('Wilson')).toBeInTheDocument();
    expect(screen.getByText('Emily')).toBeInTheDocument();
    expect(screen.getByText('Michael')).toBeInTheDocument();
    expect(screen.getByText('Lisa')).toBeInTheDocument();
  });

  it('renders Xero-matching table headers', () => {
    render(<EmployeeList employees={SAMPLE_EMPLOYEES} />);

    expect(screen.getByRole('button', { name: 'Sort by First name' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sort by Last name' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sort by Email' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sort by Employment type' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sort by Pay frequency' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sort by Next payment date' })).toBeInTheDocument();
  });

  it('renders search input with placeholder "Search"', () => {
    render(<EmployeeList employees={SAMPLE_EMPLOYEES} />);
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
  });

  it('renders "Invite to Xero Me" button', () => {
    render(<EmployeeList employees={SAMPLE_EMPLOYEES} />);
    expect(screen.getByTestId('invite-xero-me-btn')).toBeInTheDocument();
    expect(screen.getByText('Invite to Xero Me')).toBeInTheDocument();
  });

  it('renders select-all checkbox', () => {
    render(<EmployeeList employees={SAMPLE_EMPLOYEES} />);
    expect(screen.getByTestId('select-all-employees')).toBeInTheDocument();
  });

  it('renders per-row checkboxes', () => {
    render(<EmployeeList employees={SAMPLE_EMPLOYEES} />);
    expect(screen.getByTestId('select-employee-emp-001')).toBeInTheDocument();
    expect(screen.getByTestId('select-employee-emp-002')).toBeInTheDocument();
  });

  it('renders employment type column values', () => {
    render(<EmployeeList employees={SAMPLE_EMPLOYEES} />);
    // 4 employees + 1 contractor
    const employeeLabels = screen.getAllByText('Employee');
    expect(employeeLabels.length).toBe(4);
    expect(screen.getByText('Contractor')).toBeInTheDocument();
  });

  it('renders pay frequency column values', () => {
    render(<EmployeeList employees={SAMPLE_EMPLOYEES} />);
    const monthlyLabels = screen.getAllByText('Monthly');
    expect(monthlyLabels.length).toBe(4);
    expect(screen.getByText('Fortnightly')).toBeInTheDocument();
  });

  it('filters by name search', async () => {
    const user = userEvent.setup();
    render(<EmployeeList employees={SAMPLE_EMPLOYEES} />);

    const searchInput = screen.getByPlaceholderText('Search');
    await user.type(searchInput, 'Emily');

    expect(screen.getByText('Emily')).toBeInTheDocument();
    expect(screen.queryByText('Sarah')).not.toBeInTheDocument();
    expect(screen.queryByText('James')).not.toBeInTheDocument();
  });

  it('filters by email search', async () => {
    const user = userEvent.setup();
    render(<EmployeeList employees={SAMPLE_EMPLOYEES} />);

    const searchInput = screen.getByPlaceholderText('Search');
    await user.type(searchInput, 'lisa.martinez');

    expect(screen.getByText('Lisa')).toBeInTheDocument();
    expect(screen.queryByText('Sarah')).not.toBeInTheDocument();
  });

  it('shows "No employees found" when no results', async () => {
    const user = userEvent.setup();
    render(<EmployeeList employees={SAMPLE_EMPLOYEES} />);

    const searchInput = screen.getByPlaceholderText('Search');
    await user.type(searchInput, 'zzz_nonexistent_zzz');

    expect(screen.getByText('No employees yet')).toBeInTheDocument();
  });

  it('renders empty state when no employees', () => {
    render(<EmployeeList employees={[]} />);
    expect(screen.getByText('No employees yet')).toBeInTheDocument();
  });

  it('renders footer with employee count', () => {
    render(<EmployeeList employees={SAMPLE_EMPLOYEES} />);
    expect(screen.getByTestId('employee-list-footer')).toHaveTextContent('Showing 5 employees');
  });

  it('renders footer with singular "employee" for 1 employee', () => {
    render(<EmployeeList employees={[SAMPLE_EMPLOYEES[0]]} />);
    expect(screen.getByTestId('employee-list-footer')).toHaveTextContent('Showing 1 employee');
  });

  it('updates footer count when filtering', async () => {
    const user = userEvent.setup();
    render(<EmployeeList employees={SAMPLE_EMPLOYEES} />);

    const searchInput = screen.getByPlaceholderText('Search');
    await user.type(searchInput, 'sarah');

    expect(screen.getByTestId('employee-list-footer')).toHaveTextContent('Showing 1 employee');
  });
});
