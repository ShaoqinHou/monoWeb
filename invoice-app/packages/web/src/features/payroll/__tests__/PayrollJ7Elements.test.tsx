// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ─── Mock hooks ─────────────────────────────────────────────────────────────

const mockUsePayrollSummary = vi.fn();
const mockUsePayRuns = vi.fn();
const mockUseEmployees = vi.fn();
const mockMutate = vi.fn();

vi.mock('../hooks/usePayroll', () => ({
  usePayrollSummary: (...args: unknown[]) => mockUsePayrollSummary(...args),
  usePayRuns: (...args: unknown[]) => mockUsePayRuns(...args),
  useEmployees: (...args: unknown[]) => mockUseEmployees(...args),
  useEmployee: vi.fn().mockReturnValue({ data: null, isLoading: false }),
  usePayRun: vi.fn().mockReturnValue({ data: null, isLoading: false }),
  useAddEmployee: () => ({ mutate: mockMutate, isPending: false }),
  useUpdateEmployee: () => ({ mutate: mockMutate, isPending: false }),
  useDeleteEmployee: () => ({ mutate: mockMutate, isPending: false }),
  useCreatePayRun: () => ({ mutate: mockMutate, isPending: false }),
  usePostPayRun: () => ({ mutate: mockMutate, isPending: false }),
}));

vi.mock('../hooks/useLeaveRequests', () => ({
  useLeaveRequests: vi.fn().mockReturnValue({
    data: [
      { id: 'lr-1', employeeId: 'e1', employeeName: 'Alice', leaveType: 'Annual', startDate: '2026-03-01', endDate: '2026-03-05', status: 'pending' },
      { id: 'lr-2', employeeId: 'e2', employeeName: 'Bob', leaveType: 'Sick', startDate: '2026-03-10', endDate: '2026-03-10', status: 'declined' },
    ],
    isLoading: false,
  }),
  useCreateLeaveRequest: () => ({ mutate: vi.fn(), isPending: false }),
  useApproveLeaveRequest: () => ({ mutate: vi.fn(), isPending: false }),
  useDeclineLeaveRequest: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('../hooks/useTimesheets', () => ({
  useTimesheets: vi.fn().mockReturnValue({
    data: [
      { id: 'ts-1', employeeId: 'e1', employeeName: 'Alice', weekStart: '2026-02-09', monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8, saturday: 0, sunday: 0, total: 40, status: 'draft' },
    ],
    isLoading: false,
  }),
  useUpdateTimesheet: () => ({ mutate: vi.fn(), isPending: false }),
  useCreateTimesheet: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('../../settings/hooks/useApiSettings', () => ({
  useApiSettings: vi.fn().mockReturnValue({ data: {}, isLoading: false }),
  useUpdateApiSetting: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('../hooks/usePayItems', () => ({
  usePayItems: vi.fn().mockReturnValue({ data: [], isLoading: false }),
  useCreatePayItem: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdatePayItem: () => ({ mutate: vi.fn(), isPending: false }),
  useDeletePayItem: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@shared/calc/currency', () => ({
  formatCurrency: (amount: number) =>
    `$${amount.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
}));

// ─── Imports (after mocks) ──────────────────────────────────────────────────

import { PayrollOverviewPage, EmployeesPage, PayRunsPage } from '../routes/PayrollPage';
import { LeaveRequestsPage } from '../routes/LeaveRequestsPage';
import { TimesheetsPage } from '../routes/TimesheetsPage';
import { TaxesFilingsPage } from '../routes/TaxesFilingsPage';
import { PayrollSettingsPage } from '../routes/PayrollSettingsPage';

// ─── Helpers ────────────────────────────────────────────────────────────────

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

const SAMPLE_SUMMARY = {
  nextPayRunDate: '2026-03-01',
  totalEmployees: 4,
  ytdPayrollCosts: 51538.48,
  totalCostLastMonth: 25769.24,
  totalTaxLastMonth: 6442.32,
  nextPaymentDate: '2026-03-15',
};

const SAMPLE_PAY_RUNS = [
  {
    id: 'pr-001',
    periodStart: '2026-01-01',
    periodEnd: '2026-01-31',
    payDate: '2026-02-01',
    status: 'paid',
    employees: [{ employeeId: 'e1', employeeName: 'Alice', gross: 5000, tax: 1000, net: 4000 }],
    totalGross: 5000,
    totalTax: 1000,
    totalNet: 4000,
  },
  {
    id: 'pr-002',
    periodStart: '2026-02-01',
    periodEnd: '2026-02-28',
    payDate: '2026-03-01',
    status: 'draft',
    employees: [{ employeeId: 'e1', employeeName: 'Alice', gross: 5000, tax: 1000, net: 4000 }],
    totalGross: 5000,
    totalTax: 1000,
    totalNet: 4000,
  },
];

const SAMPLE_EMPLOYEES = [
  { id: 'e1', firstName: 'Alice', lastName: 'Smith', email: 'alice@test.com', position: 'Dev', startDate: '2025-01-01', salary: 60000, payFrequency: 'monthly' as const, status: 'active' as const, taxCode: 'M', employmentType: 'employee' as const, nextPaymentDate: '2025-07-18' },
  { id: 'e2', firstName: 'Bob', lastName: 'Jones', email: 'bob@test.com', position: 'PM', startDate: '2025-02-01', salary: 70000, payFrequency: 'monthly' as const, status: 'inactive' as const, taxCode: 'M', employmentType: 'employee' as const, nextPaymentDate: '2025-07-18' },
];

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('PayrollOverviewPage - J7 enhancements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePayrollSummary.mockReturnValue({ data: SAMPLE_SUMMARY, isLoading: false });
    mockUsePayRuns.mockReturnValue({ data: SAMPLE_PAY_RUNS, isLoading: false });
  });

  it('renders the calendar widget with pay day marker', () => {
    renderWithProviders(<PayrollOverviewPage />);
    expect(screen.getByTestId('payroll-calendar')).toBeInTheDocument();
    expect(screen.getByTestId('pay-run-day-marker')).toBeInTheDocument();
  });

  it('renders Leave to Approve table', () => {
    renderWithProviders(<PayrollOverviewPage />);
    expect(screen.getByText('Leave to Approve')).toBeInTheDocument();
    expect(screen.getByTestId('leave-to-approve-table')).toBeInTheDocument();
    // Uses data from useLeaveRequests hook — 'Alice' is the pending leave (Bob is declined, filtered out)
    expect(screen.getByText('Alice')).toBeInTheDocument();
    const leaveTable = screen.getByTestId('leave-to-approve-table');
    expect(within(leaveTable).getAllByText('Annual').length).toBeGreaterThan(0);
  });

  it('renders New task button', () => {
    renderWithProviders(<PayrollOverviewPage />);
    expect(screen.getByTestId('new-task-btn')).toBeInTheDocument();
    expect(screen.getByText('New task')).toBeInTheDocument();
  });

  it('renders enhanced summary metrics', () => {
    renderWithProviders(<PayrollOverviewPage />);
    expect(screen.getByText('Total Cost Last Month')).toBeInTheDocument();
    expect(screen.getByText('Total Tax Last Month')).toBeInTheDocument();
    expect(screen.getByText('Next Payment Date')).toBeInTheDocument();
  });
});

describe('EmployeesPage - J7 enhancements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseEmployees.mockReturnValue({ data: SAMPLE_EMPLOYEES, isLoading: false });
  });

  it('renders End of year reports button', () => {
    renderWithProviders(<EmployeesPage />);
    expect(screen.getByTestId('end-of-year-reports-btn')).toBeInTheDocument();
    expect(screen.getByText('End of year reports')).toBeInTheDocument();
  });

  it('renders Add employee button and dropdown', async () => {
    const user = userEvent.setup();
    renderWithProviders(<EmployeesPage />);
    expect(screen.getByTestId('add-employee-btn')).toBeInTheDocument();
    expect(screen.getByText('Add employee')).toBeInTheDocument();

    const dropdownBtn = screen.getByTestId('add-employee-dropdown-btn');
    expect(dropdownBtn).toBeInTheDocument();

    await user.click(dropdownBtn);
    expect(screen.getByTestId('add-employee-dropdown')).toBeInTheDocument();
    expect(screen.getByText('Add manually')).toBeInTheDocument();
    expect(screen.getByTestId('import-csv-btn')).toBeInTheDocument();
  });
});

describe('LeaveRequestsPage - J7 enhancements', () => {
  it('renders Current and History tabs', () => {
    renderWithProviders(<LeaveRequestsPage />);
    expect(screen.getByTestId('leave-tab-current')).toBeInTheDocument();
    expect(screen.getByTestId('leave-tab-history')).toBeInTheDocument();
  });

  it('renders search box and status filter', () => {
    renderWithProviders(<LeaveRequestsPage />);
    expect(screen.getByTestId('leave-search')).toBeInTheDocument();
    expect(screen.getByTestId('leave-status-filter')).toBeInTheDocument();
  });

  it('renders calendar graphic and info panel', () => {
    renderWithProviders(<LeaveRequestsPage />);
    expect(screen.getByTestId('leave-calendar-graphic')).toBeInTheDocument();
    expect(screen.getByTestId('leave-info-panel')).toBeInTheDocument();
  });
});

describe('TimesheetsPage - J7 enhancements', () => {
  it('renders pay frequency and pay period selectors', () => {
    renderWithProviders(<TimesheetsPage />);
    expect(screen.getByTestId('pay-frequency-selector')).toBeInTheDocument();
    expect(screen.getByTestId('pay-period-selector')).toBeInTheDocument();
  });

  it('renders employee category cards with create timesheet buttons', () => {
    renderWithProviders(<TimesheetsPage />);
    expect(screen.getByTestId('employee-category-cards')).toBeInTheDocument();
    expect(screen.getByTestId('category-card-salaried')).toBeInTheDocument();
    expect(screen.getByTestId('category-card-hourly')).toBeInTheDocument();
    expect(screen.getByTestId('category-card-contractor')).toBeInTheDocument();
    expect(screen.getByTestId('create-timesheet-salaried')).toBeInTheDocument();
  });

  it('renders Unsubmitted section when drafts exist', () => {
    renderWithProviders(<TimesheetsPage />);
    expect(screen.getByTestId('unsubmitted-section')).toBeInTheDocument();
    expect(screen.getByText(/Unsubmitted/)).toBeInTheDocument();
  });
});

describe('PayRunsPage - J7 enhancements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePayRuns.mockReturnValue({ data: SAMPLE_PAY_RUNS, isLoading: false });
  });

  it('renders New Pay Run dropdown with frequency options', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PayRunsPage />);
    const btn = screen.getByTestId('new-pay-run-dropdown-btn');
    expect(btn).toBeInTheDocument();

    await user.click(btn);
    expect(screen.getByTestId('new-pay-run-dropdown')).toBeInTheDocument();
    expect(screen.getByText('Weekly')).toBeInTheDocument();
    expect(screen.getByText('Monthly')).toBeInTheDocument();
    expect(screen.getByText('Unscheduled')).toBeInTheDocument();
  });

  it('renders Process Pay Run button when draft exists', () => {
    renderWithProviders(<PayRunsPage />);
    expect(screen.getByTestId('process-pay-run-btn')).toBeInTheDocument();
  });

  it('renders myIR status banner', () => {
    renderWithProviders(<PayRunsPage />);
    expect(screen.getByTestId('myir-status-banner')).toBeInTheDocument();
    expect(screen.getByText(/Connected to myIR/)).toBeInTheDocument();
  });

  it('renders Not Filed badges on draft pay runs', () => {
    renderWithProviders(<PayRunsPage />);
    expect(screen.getByTestId('not-filed-badge-pr-002')).toBeInTheDocument();
  });
});

describe('TaxesFilingsPage - J7 enhancements', () => {
  it('renders Download File button', () => {
    renderWithProviders(<TaxesFilingsPage />);
    expect(screen.getByTestId('download-file-btn')).toBeInTheDocument();
  });

  it('renders search textbox', () => {
    renderWithProviders(<TaxesFilingsPage />);
    expect(screen.getByTestId('filings-search')).toBeInTheDocument();
  });

  it('renders select-all checkbox and per-row checkboxes', () => {
    renderWithProviders(<TaxesFilingsPage />);
    expect(screen.getByTestId('select-all-checkbox')).toBeInTheDocument();
    expect(screen.getByTestId('select-filing-tf-001')).toBeInTheDocument();
    expect(screen.getByTestId('select-filing-tf-002')).toBeInTheDocument();
  });

  it('renders sortable column headers', () => {
    renderWithProviders(<TaxesFilingsPage />);
    expect(screen.getByTestId('sort-period')).toBeInTheDocument();
    expect(screen.getByTestId('sort-dueDate')).toBeInTheDocument();
    expect(screen.getByTestId('sort-status')).toBeInTheDocument();
    expect(screen.getByTestId('sort-amount')).toBeInTheDocument();
    expect(screen.getByTestId('sort-irdStatus')).toBeInTheDocument();
  });
});

describe('PayrollSettingsPage - J7 enhancements', () => {
  it('renders expanded side navigation', () => {
    renderWithProviders(<PayrollSettingsPage />);
    const nav = screen.getByTestId('settings-side-nav');
    expect(within(nav).getByText('Organisation')).toBeInTheDocument();
    expect(within(nav).getByText('Pay Frequencies')).toBeInTheDocument();
    expect(within(nav).getByText('Holidays')).toBeInTheDocument();
    expect(within(nav).getByText('Pay Items')).toBeInTheDocument();
    expect(within(nav).getByText('Payroll Filing')).toBeInTheDocument();
    expect(within(nav).getByText('Payroll Tracking')).toBeInTheDocument();
  });

  it('renders Organisation section with logo upload by default', () => {
    renderWithProviders(<PayrollSettingsPage />);
    expect(screen.getByTestId('payroll-settings-organisation')).toBeInTheDocument();
    expect(screen.getByTestId('upload-logo-btn')).toBeInTheDocument();
  });

  it('navigates to Payroll Filing section', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PayrollSettingsPage />);
    await user.click(screen.getByTestId('settings-nav-filing'));
    expect(screen.getByTestId('payroll-settings-filing')).toBeInTheDocument();
    expect(screen.getByTestId('employer-ird-number')).toBeInTheDocument();
    expect(screen.getByTestId('employer-size')).toBeInTheDocument();
  });

  it('navigates to Payroll Tracking section', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PayrollSettingsPage />);
    await user.click(screen.getByTestId('settings-nav-tracking'));
    expect(screen.getByTestId('payroll-settings-tracking')).toBeInTheDocument();
    expect(screen.getByTestId('employee-groups-input')).toBeInTheDocument();
    expect(screen.getByTestId('timesheet-categories-input')).toBeInTheDocument();
  });
});
