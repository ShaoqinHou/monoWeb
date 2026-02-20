import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ─── Mock the hooks ──────────────────────────────────────────────────────────

const mockUsePayRuns = vi.fn();
const mockUseCreatePayRun = vi.fn();

vi.mock('../hooks/usePayroll', () => ({
  usePayRuns: (...args: unknown[]) => mockUsePayRuns(...args),
  useCreatePayRun: (...args: unknown[]) => mockUseCreatePayRun(...args),
  useEmployees: vi.fn().mockReturnValue({ data: [], isLoading: false }),
  useEmployee: vi.fn().mockReturnValue({ data: null, isLoading: false }),
  usePayRun: vi.fn().mockReturnValue({ data: null, isLoading: false }),
  usePayrollSummary: vi.fn().mockReturnValue({ data: null, isLoading: false }),
  useAddEmployee: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateEmployee: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteEmployee: () => ({ mutate: vi.fn(), isPending: false }),
  usePostPayRun: () => ({ mutate: vi.fn(), isPending: false }),
  MOCK_EMPLOYEES: [],
  MOCK_PAY_RUNS: [],
  MOCK_SUMMARY: { nextPayRunDate: '', totalEmployees: 0, ytdPayrollCosts: 0 },
  _resetMockData: vi.fn(),
}));

import { PayRunsPage } from '../routes/PayrollPage';

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

describe('PayRunsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCreatePayRun.mockReturnValue({ mutate: vi.fn(), isPending: false });
  });

  it('renders loading state initially', () => {
    mockUsePayRuns.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(<PayRunsPage />);
    expect(screen.getByTestId('payruns-loading')).toBeInTheDocument();
  });

  it('renders page title "Pay Employees"', () => {
    mockUsePayRuns.mockReturnValue({ data: SAMPLE_PAY_RUNS, isLoading: false });
    renderWithProviders(<PayRunsPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Pay Employees' })).toBeInTheDocument();
  });

  it('renders pay run table after loading', () => {
    mockUsePayRuns.mockReturnValue({ data: SAMPLE_PAY_RUNS, isLoading: false });
    renderWithProviders(<PayRunsPage />);
    expect(screen.getByTestId('pay-run-list')).toBeInTheDocument();
  });

  it('renders all 3 pay runs', () => {
    mockUsePayRuns.mockReturnValue({ data: SAMPLE_PAY_RUNS, isLoading: false });
    renderWithProviders(<PayRunsPage />);

    expect(screen.getByTestId('pay-run-row-pr-001')).toBeInTheDocument();
    expect(screen.getByTestId('pay-run-row-pr-002')).toBeInTheDocument();
    expect(screen.getByTestId('pay-run-row-pr-003')).toBeInTheDocument();
  });

  it('renders table headers', () => {
    mockUsePayRuns.mockReturnValue({ data: SAMPLE_PAY_RUNS, isLoading: false });
    renderWithProviders(<PayRunsPage />);

    expect(screen.getByText('Period')).toBeInTheDocument();
    expect(screen.getByText('Pay Date')).toBeInTheDocument();
    expect(screen.getByText('Employees')).toBeInTheDocument();
    expect(screen.getByText('Total Gross')).toBeInTheDocument();
    expect(screen.getByText('Total Net')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders pay run status badges', () => {
    mockUsePayRuns.mockReturnValue({ data: SAMPLE_PAY_RUNS, isLoading: false });
    renderWithProviders(<PayRunsPage />);

    const paidBadges = screen.getAllByText('Paid');
    expect(paidBadges.length).toBe(2);

    const draftBadges = screen.getAllByText('Draft');
    expect(draftBadges.length).toBe(1);
  });

  it('renders "New Pay Run" dropdown button', () => {
    mockUsePayRuns.mockReturnValue({ data: SAMPLE_PAY_RUNS, isLoading: false });
    renderWithProviders(<PayRunsPage />);
    expect(screen.getByTestId('new-pay-run-dropdown-btn')).toBeInTheDocument();
  });

  it('renders breadcrumbs', () => {
    mockUsePayRuns.mockReturnValue({ data: SAMPLE_PAY_RUNS, isLoading: false });
    renderWithProviders(<PayRunsPage />);
    expect(screen.getByText('Payroll')).toBeInTheDocument();
  });

  it('renders employee count for each pay run', () => {
    mockUsePayRuns.mockReturnValue({ data: SAMPLE_PAY_RUNS, isLoading: false });
    renderWithProviders(<PayRunsPage />);

    const fours = screen.getAllByText('4');
    expect(fours.length).toBeGreaterThanOrEqual(3);
  });
});
