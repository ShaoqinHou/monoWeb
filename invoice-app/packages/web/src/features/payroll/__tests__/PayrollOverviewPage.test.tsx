import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ─── Mock the hooks ──────────────────────────────────────────────────────────

const mockUsePayrollSummary = vi.fn();
const mockUsePayRuns = vi.fn();
const mockUseLeaveRequests = vi.fn();

vi.mock('../hooks/usePayroll', () => ({
  usePayrollSummary: (...args: unknown[]) => mockUsePayrollSummary(...args),
  usePayRuns: (...args: unknown[]) => mockUsePayRuns(...args),
  useEmployees: vi.fn().mockReturnValue({ data: [], isLoading: false }),
  useEmployee: vi.fn().mockReturnValue({ data: null, isLoading: false }),
  usePayRun: vi.fn().mockReturnValue({ data: null, isLoading: false }),
  useAddEmployee: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateEmployee: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteEmployee: () => ({ mutate: vi.fn(), isPending: false }),
  useCreatePayRun: () => ({ mutate: vi.fn(), isPending: false }),
  usePostPayRun: () => ({ mutate: vi.fn(), isPending: false }),
  MOCK_EMPLOYEES: [],
  MOCK_PAY_RUNS: [],
  MOCK_SUMMARY: { nextPayRunDate: '', totalEmployees: 0, ytdPayrollCosts: 0 },
  _resetMockData: vi.fn(),
}));

vi.mock('../hooks/useLeaveRequests', () => ({
  useLeaveRequests: (...args: unknown[]) => mockUseLeaveRequests(...args),
}));

import { PayrollOverviewPage } from '../routes/PayrollPage';

const SAMPLE_PAY_RUNS = [
  {
    id: 'pr-001',
    periodStart: '2026-01-01',
    periodEnd: '2026-01-31',
    payDate: '2026-02-01',
    status: 'paid',
    employees: [
      { employeeId: 'emp-001', employeeName: 'Sarah Chen', gross: 7916.67, tax: 1979.17, net: 5937.50 },
      { employeeId: 'emp-002', employeeName: 'James Wilson', gross: 9166.67, tax: 2291.67, net: 6875.00 },
      { employeeId: 'emp-003', employeeName: 'Emily Taylor', gross: 3269.23, tax: 817.31, net: 2451.92 },
      { employeeId: 'emp-005', employeeName: 'Lisa Martinez', gross: 5416.67, tax: 1354.17, net: 4062.50 },
    ],
    totalGross: 25769.24,
    totalTax: 6442.32,
    totalNet: 19326.92,
  },
  {
    id: 'pr-002',
    periodStart: '2025-12-01',
    periodEnd: '2025-12-31',
    payDate: '2026-01-01',
    status: 'paid',
    employees: [
      { employeeId: 'emp-001', employeeName: 'Sarah Chen', gross: 7916.67, tax: 1979.17, net: 5937.50 },
      { employeeId: 'emp-002', employeeName: 'James Wilson', gross: 9166.67, tax: 2291.67, net: 6875.00 },
      { employeeId: 'emp-003', employeeName: 'Emily Taylor', gross: 3269.23, tax: 817.31, net: 2451.92 },
      { employeeId: 'emp-005', employeeName: 'Lisa Martinez', gross: 5416.67, tax: 1354.17, net: 4062.50 },
    ],
    totalGross: 25769.24,
    totalTax: 6442.32,
    totalNet: 19326.92,
  },
  {
    id: 'pr-003',
    periodStart: '2026-02-01',
    periodEnd: '2026-02-28',
    payDate: '2026-03-01',
    status: 'draft',
    employees: [
      { employeeId: 'emp-001', employeeName: 'Sarah Chen', gross: 7916.67, tax: 1979.17, net: 5937.50 },
      { employeeId: 'emp-002', employeeName: 'James Wilson', gross: 9166.67, tax: 2291.67, net: 6875.00 },
      { employeeId: 'emp-003', employeeName: 'Emily Taylor', gross: 3269.23, tax: 817.31, net: 2451.92 },
      { employeeId: 'emp-005', employeeName: 'Lisa Martinez', gross: 5416.67, tax: 1354.17, net: 4062.50 },
    ],
    totalGross: 25769.24,
    totalTax: 6442.32,
    totalNet: 19326.92,
  },
];

const SAMPLE_SUMMARY = {
  nextPayRunDate: '2026-03-01',
  totalEmployees: 4,
  ytdPayrollCosts: 51538.48,
};

const SAMPLE_LEAVE_REQUESTS = [
  {
    id: 'lr-001',
    employeeId: 'emp-001',
    employeeName: 'Sarah Chen',
    leaveType: 'annual',
    startDate: '2026-03-03',
    endDate: '2026-03-07',
    hours: 40,
    status: 'pending',
    notes: null,
    createdAt: '2026-02-15T00:00:00Z',
  },
  {
    id: 'lr-002',
    employeeId: 'emp-002',
    employeeName: 'James Wilson',
    leaveType: 'sick',
    startDate: '2026-03-10',
    endDate: '2026-03-10',
    hours: 8,
    status: 'pending',
    notes: null,
    createdAt: '2026-02-16T00:00:00Z',
  },
  {
    id: 'lr-003',
    employeeId: 'emp-003',
    employeeName: 'Emily Taylor',
    leaveType: 'annual',
    startDate: '2026-03-17',
    endDate: '2026-03-21',
    hours: 40,
    status: 'approved',
    notes: null,
    createdAt: '2026-02-10T00:00:00Z',
  },
  {
    id: 'lr-004',
    employeeId: 'emp-004',
    employeeName: 'Bob Smith',
    leaveType: 'sick',
    startDate: '2026-02-01',
    endDate: '2026-02-02',
    hours: 16,
    status: 'declined',
    notes: 'Insufficient leave balance',
    createdAt: '2026-01-28T00:00:00Z',
  },
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

describe('PayrollOverviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLeaveRequests.mockReturnValue({ data: SAMPLE_LEAVE_REQUESTS, isLoading: false });
  });

  it('renders loading state initially', () => {
    mockUsePayrollSummary.mockReturnValue({ data: undefined, isLoading: true });
    mockUsePayRuns.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(<PayrollOverviewPage />);
    expect(screen.getByTestId('payroll-loading')).toBeInTheDocument();
  });

  it('renders the page title "Payroll"', () => {
    mockUsePayrollSummary.mockReturnValue({ data: SAMPLE_SUMMARY, isLoading: false });
    mockUsePayRuns.mockReturnValue({ data: SAMPLE_PAY_RUNS, isLoading: false });
    renderWithProviders(<PayrollOverviewPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Payroll' })).toBeInTheDocument();
  });

  it('renders summary cards after loading', () => {
    mockUsePayrollSummary.mockReturnValue({ data: SAMPLE_SUMMARY, isLoading: false });
    mockUsePayRuns.mockReturnValue({ data: SAMPLE_PAY_RUNS, isLoading: false });
    renderWithProviders(<PayrollOverviewPage />);

    expect(screen.getByTestId('payroll-summary')).toBeInTheDocument();
    expect(screen.getByText('Next Pay Run')).toBeInTheDocument();
    expect(screen.getByText('Total Employees')).toBeInTheDocument();

    const totalEmpLabel = screen.getByText('Total Employees');
    const parentDiv = totalEmpLabel.closest('div');
    expect(parentDiv).not.toBeNull();
    expect(parentDiv!.textContent).toContain('4');

    expect(screen.getByText('YTD Payroll Costs')).toBeInTheDocument();
  });

  it('renders recent pay runs section', () => {
    mockUsePayrollSummary.mockReturnValue({ data: SAMPLE_SUMMARY, isLoading: false });
    mockUsePayRuns.mockReturnValue({ data: SAMPLE_PAY_RUNS, isLoading: false });
    renderWithProviders(<PayrollOverviewPage />);

    expect(screen.getByText('Recent Pay Runs')).toBeInTheDocument();
    expect(screen.getByTestId('pay-run-card-pr-001')).toBeInTheDocument();
    expect(screen.getByTestId('pay-run-card-pr-002')).toBeInTheDocument();
    expect(screen.getByTestId('pay-run-card-pr-003')).toBeInTheDocument();
  });

  it('renders quick action buttons', () => {
    mockUsePayrollSummary.mockReturnValue({ data: SAMPLE_SUMMARY, isLoading: false });
    mockUsePayRuns.mockReturnValue({ data: SAMPLE_PAY_RUNS, isLoading: false });
    renderWithProviders(<PayrollOverviewPage />);
    expect(screen.getByText('New Pay Run')).toBeInTheDocument();
    expect(screen.getByText('Add Employee')).toBeInTheDocument();
  });

  it('shows pay run status badges with correct text', () => {
    mockUsePayrollSummary.mockReturnValue({ data: SAMPLE_SUMMARY, isLoading: false });
    mockUsePayRuns.mockReturnValue({ data: SAMPLE_PAY_RUNS, isLoading: false });
    renderWithProviders(<PayrollOverviewPage />);

    const paidBadges = screen.getAllByText('Paid');
    expect(paidBadges.length).toBe(2);

    const draftBadges = screen.getAllByText('Draft');
    expect(draftBadges.length).toBe(1);
  });

  it('renders leave to approve section with data from useLeaveRequests', () => {
    mockUsePayrollSummary.mockReturnValue({ data: SAMPLE_SUMMARY, isLoading: false });
    mockUsePayRuns.mockReturnValue({ data: SAMPLE_PAY_RUNS, isLoading: false });
    mockUseLeaveRequests.mockReturnValue({ data: SAMPLE_LEAVE_REQUESTS, isLoading: false });
    renderWithProviders(<PayrollOverviewPage />);

    expect(screen.getByText('Leave to Approve')).toBeInTheDocument();
    expect(screen.getByTestId('leave-to-approve-table')).toBeInTheDocument();

    // Should show pending and approved leave requests (Sarah, James, Emily) but NOT declined (Bob)
    expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
    expect(screen.getByText('James Wilson')).toBeInTheDocument();
    expect(screen.getByText('Emily Taylor')).toBeInTheDocument();
    expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument();
  });

  it('renders leave type labels correctly mapped from API values', () => {
    mockUsePayrollSummary.mockReturnValue({ data: SAMPLE_SUMMARY, isLoading: false });
    mockUsePayRuns.mockReturnValue({ data: SAMPLE_PAY_RUNS, isLoading: false });
    mockUseLeaveRequests.mockReturnValue({ data: SAMPLE_LEAVE_REQUESTS, isLoading: false });
    renderWithProviders(<PayrollOverviewPage />);

    expect(screen.getAllByText('Annual Leave').length).toBe(2);
    expect(screen.getByText('Sick Leave')).toBeInTheDocument();
  });

  it('shows loading state for leave requests', () => {
    mockUsePayrollSummary.mockReturnValue({ data: SAMPLE_SUMMARY, isLoading: false });
    mockUsePayRuns.mockReturnValue({ data: SAMPLE_PAY_RUNS, isLoading: false });
    mockUseLeaveRequests.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(<PayrollOverviewPage />);

    expect(screen.getByTestId('leave-loading')).toBeInTheDocument();
    expect(screen.getByText('Loading leave requests...')).toBeInTheDocument();
  });

  it('shows empty state when no leave requests exist', () => {
    mockUsePayrollSummary.mockReturnValue({ data: SAMPLE_SUMMARY, isLoading: false });
    mockUsePayRuns.mockReturnValue({ data: SAMPLE_PAY_RUNS, isLoading: false });
    mockUseLeaveRequests.mockReturnValue({ data: [], isLoading: false });
    renderWithProviders(<PayrollOverviewPage />);

    expect(screen.getByText('No leave requests to approve.')).toBeInTheDocument();
  });

  it('shows empty state when all leave requests are declined', () => {
    mockUsePayrollSummary.mockReturnValue({ data: SAMPLE_SUMMARY, isLoading: false });
    mockUsePayRuns.mockReturnValue({ data: SAMPLE_PAY_RUNS, isLoading: false });
    mockUseLeaveRequests.mockReturnValue({
      data: [SAMPLE_LEAVE_REQUESTS[3]], // Only the declined one
      isLoading: false,
    });
    renderWithProviders(<PayrollOverviewPage />);

    expect(screen.getByText('No leave requests to approve.')).toBeInTheDocument();
  });
});
