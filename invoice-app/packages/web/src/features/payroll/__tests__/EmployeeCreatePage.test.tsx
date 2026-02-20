import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockNavigate = vi.fn();
const mockMutate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...rest }: any) => <a href={to} {...rest}>{children}</a>,
  useParams: () => ({}),
  useNavigate: () => mockNavigate,
}));

vi.mock('../hooks/usePayroll', () => ({
  useAddEmployee: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

import { EmployeeCreatePage } from '../routes/EmployeeCreatePage';

/** Helper: find input by label text (traverses the parent container to find the sibling input) */
function getInputByLabel(labelText: string): HTMLInputElement {
  const label = screen.getByText(labelText);
  // Label and input wrapper are siblings inside the same container div
  const container = label.parentElement;
  const input = container?.querySelector('input');
  if (!input) throw new Error(`No input found for label "${labelText}"`);
  return input;
}

describe('EmployeeCreatePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page with correct title and breadcrumbs', () => {
    render(<EmployeeCreatePage />);

    // "New Employee" appears in both breadcrumb and page title
    const newEmployeeElements = screen.getAllByText('New Employee');
    expect(newEmployeeElements.length).toBeGreaterThan(0);
    expect(screen.getByText('Payroll')).toBeInTheDocument();
    expect(screen.getByText('Employees')).toBeInTheDocument();
  });

  it('renders the employee form', () => {
    render(<EmployeeCreatePage />);

    expect(screen.getByTestId('employee-form')).toBeInTheDocument();
    expect(screen.getByText('Employee Details')).toBeInTheDocument();
  });

  it('renders form fields for employee input', () => {
    render(<EmployeeCreatePage />);

    expect(screen.getByText('First Name')).toBeInTheDocument();
    expect(screen.getByText('Last Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Position')).toBeInTheDocument();
    expect(screen.getByText('Start Date')).toBeInTheDocument();
    expect(screen.getByText('Annual Salary')).toBeInTheDocument();
    expect(screen.getByText('Tax Code')).toBeInTheDocument();
  });

  it('calls add employee mutation on form submit', async () => {
    mockMutate.mockImplementation((_data: unknown, opts: { onSuccess?: () => void }) => {
      opts.onSuccess?.();
    });

    render(<EmployeeCreatePage />);

    // Fill in required fields using helper
    fireEvent.change(getInputByLabel('First Name'), { target: { value: 'Jane' } });
    fireEvent.change(getInputByLabel('Last Name'), { target: { value: 'Doe' } });
    fireEvent.change(getInputByLabel('Email'), { target: { value: 'jane@example.com' } });
    fireEvent.change(getInputByLabel('Position'), { target: { value: 'Developer' } });
    fireEvent.change(getInputByLabel('Start Date'), { target: { value: '2026-03-01' } });
    fireEvent.change(getInputByLabel('Annual Salary'), { target: { value: '85000' } });

    const submitButton = screen.getByRole('button', { name: /add employee/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          position: 'Developer',
          startDate: '2026-03-01',
          salary: 85000,
        }),
        expect.objectContaining({
          onSuccess: expect.any(Function),
        }),
      );
    });
  });

  it('navigates to employees list on successful creation', async () => {
    mockMutate.mockImplementation((_data: unknown, opts: { onSuccess?: () => void }) => {
      opts.onSuccess?.();
    });

    render(<EmployeeCreatePage />);

    // Fill required fields
    fireEvent.change(getInputByLabel('First Name'), { target: { value: 'Jane' } });
    fireEvent.change(getInputByLabel('Last Name'), { target: { value: 'Doe' } });
    fireEvent.change(getInputByLabel('Email'), { target: { value: 'jane@example.com' } });
    fireEvent.change(getInputByLabel('Position'), { target: { value: 'Developer' } });
    fireEvent.change(getInputByLabel('Start Date'), { target: { value: '2026-03-01' } });
    fireEvent.change(getInputByLabel('Annual Salary'), { target: { value: '85000' } });

    fireEvent.click(screen.getByRole('button', { name: /add employee/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/payroll/employees' });
    });
  });

  it('navigates back when cancel is clicked', () => {
    render(<EmployeeCreatePage />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/payroll/employees' });
  });

  it('has submit button disabled when form is empty', () => {
    render(<EmployeeCreatePage />);

    const submitButton = screen.getByRole('button', { name: /add employee/i });
    expect(submitButton).toBeDisabled();
  });
});
