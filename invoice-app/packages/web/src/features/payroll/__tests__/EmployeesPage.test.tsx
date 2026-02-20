import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ─── Mock the hooks ──────────────────────────────────────────────────────────

const mockUseEmployees = vi.fn();
const mockUseAddEmployee = vi.fn();

vi.mock('../hooks/usePayroll', () => ({
  useEmployees: (...args: unknown[]) => mockUseEmployees(...args),
  useAddEmployee: (...args: unknown[]) => mockUseAddEmployee(...args),
  useEmployee: vi.fn().mockReturnValue({ data: null, isLoading: false }),
  usePayRuns: vi.fn().mockReturnValue({ data: [], isLoading: false }),
  usePayRun: vi.fn().mockReturnValue({ data: null, isLoading: false }),
  usePayrollSummary: vi.fn().mockReturnValue({ data: null, isLoading: false }),
  useUpdateEmployee: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteEmployee: () => ({ mutate: vi.fn(), isPending: false }),
  useCreatePayRun: () => ({ mutate: vi.fn(), isPending: false }),
  usePostPayRun: () => ({ mutate: vi.fn(), isPending: false }),
  MOCK_EMPLOYEES: [],
  MOCK_PAY_RUNS: [],
  MOCK_SUMMARY: { nextPayRunDate: '', totalEmployees: 0, ytdPayrollCosts: 0 },
  _resetMockData: vi.fn(),
}));

import { EmployeesPage } from '../routes/PayrollPage';

const SAMPLE_EMPLOYEES = [
  { id: 'emp-001', firstName: 'Sarah', lastName: 'Chen', email: 'sarah.chen@example.com', position: 'Software Engineer', startDate: '2023-03-15', salary: 95000, payFrequency: 'monthly', status: 'active', taxCode: 'M', employmentType: 'employee', nextPaymentDate: '2023-07-18' },
  { id: 'emp-002', firstName: 'James', lastName: 'Wilson', email: 'james.wilson@example.com', position: 'Product Manager', startDate: '2022-08-01', salary: 110000, payFrequency: 'monthly', status: 'active', taxCode: 'M', employmentType: 'employee', nextPaymentDate: '2023-07-18' },
  { id: 'emp-003', firstName: 'Emily', lastName: 'Taylor', email: 'emily.taylor@example.com', position: 'UX Designer', startDate: '2024-01-10', salary: 85000, payFrequency: 'fortnightly', status: 'active', taxCode: 'ME', employmentType: 'employee', nextPaymentDate: '2023-07-25' },
  { id: 'emp-004', firstName: 'Michael', lastName: 'Brown', email: 'michael.brown@example.com', position: 'Sales Representative', startDate: '2021-06-20', salary: 72000, payFrequency: 'monthly', status: 'inactive', taxCode: 'M', employmentType: 'contractor', nextPaymentDate: '2023-07-18' },
  { id: 'emp-005', firstName: 'Lisa', lastName: 'Martinez', email: 'lisa.martinez@example.com', position: 'Office Manager', startDate: '2023-11-05', salary: 65000, payFrequency: 'monthly', status: 'active', taxCode: 'S', employmentType: 'employee', nextPaymentDate: '2023-07-18' },
];

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe('EmployeesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAddEmployee.mockReturnValue({ mutate: vi.fn(), isPending: false });
  });

  it('renders loading state initially', () => {
    mockUseEmployees.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(<EmployeesPage />);
    expect(screen.getByTestId('employees-loading')).toBeInTheDocument();
  });

  it('renders page title "Employees"', () => {
    mockUseEmployees.mockReturnValue({ data: SAMPLE_EMPLOYEES, isLoading: false });
    renderWithProviders(<EmployeesPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Employees' })).toBeInTheDocument();
  });

  it('renders active employees in Current tab by default', () => {
    mockUseEmployees.mockReturnValue({ data: SAMPLE_EMPLOYEES, isLoading: false });
    renderWithProviders(<EmployeesPage />);

    // Current tab shows only active employees (4 of 5) — first names in separate cells
    expect(screen.getByText('Sarah')).toBeInTheDocument();
    expect(screen.getByText('James')).toBeInTheDocument();
    expect(screen.getByText('Emily')).toBeInTheDocument();
    expect(screen.getByText('Lisa')).toBeInTheDocument();
    // Michael Brown is inactive, not shown in Current tab
    expect(screen.queryByText('Michael')).not.toBeInTheDocument();
  });

  it('renders employee emails', () => {
    mockUseEmployees.mockReturnValue({ data: SAMPLE_EMPLOYEES, isLoading: false });
    renderWithProviders(<EmployeesPage />);
    expect(screen.getByText('sarah.chen@example.com')).toBeInTheDocument();
    expect(screen.getByText('james.wilson@example.com')).toBeInTheDocument();
  });

  it('renders employment type column', () => {
    mockUseEmployees.mockReturnValue({ data: SAMPLE_EMPLOYEES, isLoading: false });
    renderWithProviders(<EmployeesPage />);
    // All 4 active employees are type "Employee"
    const employeeLabels = screen.getAllByText('Employee');
    expect(employeeLabels.length).toBe(4);
  });

  it('renders pay frequency column', () => {
    mockUseEmployees.mockReturnValue({ data: SAMPLE_EMPLOYEES, isLoading: false });
    renderWithProviders(<EmployeesPage />);
    expect(screen.getAllByText('Monthly').length).toBe(3);
    expect(screen.getByText('Fortnightly')).toBeInTheDocument();
  });

  it('renders "Add employee" primary button and dropdown', () => {
    mockUseEmployees.mockReturnValue({ data: SAMPLE_EMPLOYEES, isLoading: false });
    renderWithProviders(<EmployeesPage />);
    expect(screen.getByTestId('add-employee-btn')).toBeInTheDocument();
    expect(screen.getByText('Add employee')).toBeInTheDocument();
    expect(screen.getByTestId('add-employee-dropdown-btn')).toBeInTheDocument();
  });

  it('renders Xero-matching table headers (sortable buttons)', () => {
    mockUseEmployees.mockReturnValue({ data: SAMPLE_EMPLOYEES, isLoading: false });
    renderWithProviders(<EmployeesPage />);
    expect(screen.getByRole('button', { name: 'Sort by First name' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sort by Last name' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sort by Email' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sort by Employment type' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sort by Pay frequency' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sort by Next payment date' })).toBeInTheDocument();
  });

  it('renders breadcrumbs', () => {
    mockUseEmployees.mockReturnValue({ data: SAMPLE_EMPLOYEES, isLoading: false });
    renderWithProviders(<EmployeesPage />);
    expect(screen.getByText('Payroll')).toBeInTheDocument();
  });

  it('filters employees by search query', async () => {
    mockUseEmployees.mockReturnValue({ data: SAMPLE_EMPLOYEES, isLoading: false });
    const user = userEvent.setup();
    renderWithProviders(<EmployeesPage />);

    const searchInput = screen.getByPlaceholderText('Search');
    await user.type(searchInput, 'sarah');

    expect(screen.getByText('Sarah')).toBeInTheDocument();
    expect(screen.queryByText('James')).not.toBeInTheDocument();
  });

  it('filters employees by email search', async () => {
    mockUseEmployees.mockReturnValue({ data: SAMPLE_EMPLOYEES, isLoading: false });
    const user = userEvent.setup();
    renderWithProviders(<EmployeesPage />);

    const searchInput = screen.getByPlaceholderText('Search');
    await user.type(searchInput, 'james.wilson');

    expect(screen.queryByText('Sarah')).not.toBeInTheDocument();
    expect(screen.getByText('James')).toBeInTheDocument();
  });

  it('shows "No employees found" when search has no results', async () => {
    mockUseEmployees.mockReturnValue({ data: SAMPLE_EMPLOYEES, isLoading: false });
    const user = userEvent.setup();
    renderWithProviders(<EmployeesPage />);

    const searchInput = screen.getByPlaceholderText('Search');
    await user.type(searchInput, 'nonexistent');

    expect(screen.getByText('No employees yet')).toBeInTheDocument();
  });

  it('renders footer with employee count', () => {
    mockUseEmployees.mockReturnValue({ data: SAMPLE_EMPLOYEES, isLoading: false });
    renderWithProviders(<EmployeesPage />);
    // 4 active employees shown in Current tab
    expect(screen.getByTestId('employee-list-footer')).toHaveTextContent('Showing 4 employees');
  });
});
