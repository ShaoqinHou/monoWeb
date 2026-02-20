// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// ─── Mock api-helpers ────────────────────────────────────────────────────────

const mockApiFetch = vi.fn();
const mockApiPut = vi.fn();

vi.mock('../../../lib/api-helpers', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
  apiPost: vi.fn(),
  apiPut: (...args: unknown[]) => mockApiPut(...args),
  apiDelete: vi.fn(),
}));

// ─── Mock @shared/calc/currency ──────────────────────────────────────────────

vi.mock('@shared/calc/currency', () => ({
  formatCurrency: (amount: number) =>
    `$${amount.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
}));

// ─── Imports (after mocks) ──────────────────────────────────────────────────

import { YearEndSummaryPage } from '../routes/YearEndSummaryPage';
import { KiwiSaverSettings } from '../components/KiwiSaverSettings';
import { SplitPaymentForm } from '../components/SplitPaymentForm';
import { PayrollReportsPage } from '../routes/PayrollReportsPage';
import { PayrollReportViewer } from '../components/PayrollReportViewer';
import { useYearEndSummary } from '../hooks/useYearEndSummary';
import { useKiwiSaver, useUpdateKiwiSaver, getESCTRate, KIWISAVER_EMPLOYEE_RATES } from '../hooks/useKiwiSaver';
import { useSplitPayments } from '../hooks/useSplitPayments';
import { usePayrollReport, PAYROLL_REPORTS } from '../hooks/usePayrollReports';
import type { PayrollReportData } from '../hooks/usePayrollReports';

// ─── Test Helpers ───────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_YEAR_END = {
  taxYear: '2025',
  employees: [
    { employeeId: 'emp-001', employeeName: 'Sarah Chen', grossPay: 95000, paye: 22270, kiwiSaverEmployee: 2850, kiwiSaverEmployer: 2850, studentLoan: 0, netPay: 69880 },
    { employeeId: 'emp-002', employeeName: 'James Wilson', grossPay: 110000, paye: 28420, kiwiSaverEmployee: 4400, kiwiSaverEmployer: 3300, studentLoan: 1320, netPay: 75860 },
    { employeeId: 'emp-003', employeeName: 'Emily Taylor', grossPay: 85000, paye: 18670, kiwiSaverEmployee: 2550, kiwiSaverEmployer: 2550, studentLoan: 0, netPay: 63780 },
    { employeeId: 'emp-004', employeeName: 'Michael Brown', grossPay: 72000, paye: 14440, kiwiSaverEmployee: 2160, kiwiSaverEmployer: 2160, studentLoan: 864, netPay: 54536 },
    { employeeId: 'emp-005', employeeName: 'Lisa Martinez', grossPay: 65000, paye: 11830, kiwiSaverEmployee: 1950, kiwiSaverEmployer: 1950, studentLoan: 0, netPay: 51220 },
  ],
  totals: { grossPay: 427000, paye: 95630, kiwiSaverEmployee: 13910, kiwiSaverEmployer: 12810, studentLoan: 2184, netPay: 315276 },
};

const MOCK_KIWISAVER = {
  employeeId: 'emp-001',
  employeeName: 'Sarah Chen',
  employeeRate: 3,
  employerRate: 3,
  optedOut: false,
  esctRate: 33,
  annualSalary: 95000,
};

const MOCK_SPLIT_PAYMENTS = {
  employeeId: 'emp-001',
  accounts: [
    { bankAccount: '06-0123-0456789-00', type: 'fixed' as const, amount: 0, isPrimary: true },
    { bankAccount: '06-0123-0456789-01', type: 'fixed' as const, amount: 500, isPrimary: false },
  ],
};

const MOCK_SPLIT_PAYMENTS_SINGLE = {
  employeeId: 'emp-002',
  accounts: [
    { bankAccount: '02-0456-0789012-00', type: 'fixed' as const, amount: 0, isPrimary: true },
  ],
};

const MOCK_REPORT: PayrollReportData = {
  type: 'payroll-activity',
  title: 'Payroll Activity Summary',
  columns: ['Pay Date', 'Period', 'Gross Pay', 'PAYE', 'KiwiSaver', 'Net Pay'],
  rows: [
    ['01 Feb 2026', 'Jan 2026', '$25,769.24', '$6,442.32', '$1,288.46', '$18,038.46'],
    ['01 Jan 2026', 'Dec 2025', '$25,769.24', '$6,442.32', '$1,288.46', '$18,038.46'],
  ],
};

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Year-End Summary Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with employee data and all columns', async () => {
    mockApiFetch.mockResolvedValueOnce(MOCK_YEAR_END);
    const Wrapper = createWrapper();
    render(<Wrapper><YearEndSummaryPage /></Wrapper>);

    await waitFor(() => {
      expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
    });

    // All 7 column headers
    expect(screen.getByText('Employee Name')).toBeInTheDocument();
    expect(screen.getByText('Gross Pay')).toBeInTheDocument();
    expect(screen.getByText('PAYE')).toBeInTheDocument();
    expect(screen.getByText('KiwiSaver (Employee)')).toBeInTheDocument();
    expect(screen.getByText('KiwiSaver (Employer)')).toBeInTheDocument();
    expect(screen.getByText('Student Loan')).toBeInTheDocument();
    expect(screen.getByText('Net Pay')).toBeInTheDocument();

    // All 5 employees
    expect(screen.getByText('James Wilson')).toBeInTheDocument();
    expect(screen.getByText('Emily Taylor')).toBeInTheDocument();
    expect(screen.getByText('Michael Brown')).toBeInTheDocument();
    expect(screen.getByText('Lisa Martinez')).toBeInTheDocument();
  });

  it('calculates correct totals row', async () => {
    mockApiFetch.mockResolvedValueOnce(MOCK_YEAR_END);
    const Wrapper = createWrapper();
    render(<Wrapper><YearEndSummaryPage /></Wrapper>);

    await waitFor(() => {
      expect(screen.getByTestId('year-end-totals')).toBeInTheDocument();
    });

    const totalsRow = screen.getByTestId('year-end-totals');
    expect(within(totalsRow).getByText('Total')).toBeInTheDocument();
    // Gross total: 427000
    expect(within(totalsRow).getByText('$427,000.00')).toBeInTheDocument();
  });

  it('shows Export CSV button', async () => {
    mockApiFetch.mockResolvedValueOnce(MOCK_YEAR_END);
    const Wrapper = createWrapper();
    render(<Wrapper><YearEndSummaryPage /></Wrapper>);

    await waitFor(() => {
      expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
    });

    expect(screen.getByTestId('export-csv-btn')).toBeInTheDocument();
  });

  it('shows NZ tax year (April-March) selector', async () => {
    mockApiFetch.mockResolvedValueOnce(MOCK_YEAR_END);
    const Wrapper = createWrapper();
    render(<Wrapper><YearEndSummaryPage /></Wrapper>);

    expect(screen.getByLabelText('Select tax year')).toBeInTheDocument();
    expect(screen.getByText('Tax Year (April - March)')).toBeInTheDocument();
  });
});

describe('KiwiSaver Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows rate options for employee contribution', async () => {
    mockApiFetch.mockResolvedValueOnce(MOCK_KIWISAVER);
    const Wrapper = createWrapper();
    render(<Wrapper><KiwiSaverSettings employeeId="emp-001" /></Wrapper>);

    await waitFor(() => {
      expect(screen.getByTestId('kiwisaver-settings')).toBeInTheDocument();
    });

    expect(screen.getByText('KiwiSaver Settings')).toBeInTheDocument();
    const rateSelect = screen.getByLabelText('Employee contribution rate');
    expect(rateSelect).toBeInTheDocument();
    // Check rate options are present in the select
    const options = rateSelect.querySelectorAll('option');
    const rateValues = Array.from(options).map((o) => o.value);
    expect(rateValues).toEqual(['3', '4', '6', '8', '10']);
    // Employer rate info
    expect(screen.getByText(/Employer Contribution Rate/)).toBeInTheDocument();
  });

  it('shows ESCT rate based on salary', async () => {
    mockApiFetch.mockResolvedValueOnce(MOCK_KIWISAVER);
    const Wrapper = createWrapper();
    render(<Wrapper><KiwiSaverSettings employeeId="emp-001" /></Wrapper>);

    await waitFor(() => {
      expect(screen.getByTestId('esct-rate')).toBeInTheDocument();
    });

    // Sarah's salary is $95,000 → ESCT rate should be 33%
    expect(screen.getByTestId('esct-rate')).toHaveTextContent('33%');
  });

  it('shows opt-out confirmation dialog when clicking opt-out', async () => {
    const user = userEvent.setup();
    mockApiFetch.mockResolvedValueOnce(MOCK_KIWISAVER);
    const Wrapper = createWrapper();
    render(<Wrapper><KiwiSaverSettings employeeId="emp-001" /></Wrapper>);

    await waitFor(() => {
      expect(screen.getByTestId('kiwisaver-opt-out-btn')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('kiwisaver-opt-out-btn'));

    expect(screen.getByText('Confirm KiwiSaver Opt-Out')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-opt-out-btn')).toBeInTheDocument();
  });

  it('getESCTRate returns correct brackets', () => {
    expect(getESCTRate(15000)).toBe(10.5);
    expect(getESCTRate(50000)).toBe(17.5);
    expect(getESCTRate(80000)).toBe(30);
    expect(getESCTRate(100000)).toBe(33);
    expect(getESCTRate(200000)).toBe(39);
  });
});

describe('Split Payment Form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with primary account', async () => {
    mockApiFetch.mockResolvedValueOnce(MOCK_SPLIT_PAYMENTS);
    const Wrapper = createWrapper();
    render(<Wrapper><SplitPaymentForm employeeId="emp-001" netPay={5000} /></Wrapper>);

    await waitFor(() => {
      expect(screen.getByTestId('split-payment-form')).toBeInTheDocument();
    });

    // Should show primary account
    expect(screen.getByText(/Primary Account/)).toBeInTheDocument();
  });

  it('validates total does not exceed net pay', async () => {
    mockApiFetch.mockResolvedValueOnce(MOCK_SPLIT_PAYMENTS_SINGLE);
    const Wrapper = createWrapper();
    render(<Wrapper><SplitPaymentForm employeeId="emp-002" netPay={1000} /></Wrapper>);

    await waitFor(() => {
      expect(screen.getByTestId('split-payment-form')).toBeInTheDocument();
    });

    // Add a secondary account
    const addBtn = screen.getByTestId('add-account-btn');
    await userEvent.setup().click(addBtn);

    // Set amount > net pay via fireEvent
    const amountInputs = screen.getAllByLabelText(/amount/i);
    const lastAmount = amountInputs[amountInputs.length - 1];
    fireEvent.change(lastAmount, { target: { value: '2000' } });

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByTestId('split-validation-error')).toBeInTheDocument();
    });
    expect(screen.getByTestId('split-validation-error')).toHaveTextContent(/exceed net pay/);
  });

  it('supports up to 3 accounts', async () => {
    const user = userEvent.setup();
    mockApiFetch.mockResolvedValueOnce(MOCK_SPLIT_PAYMENTS_SINGLE);
    const Wrapper = createWrapper();
    render(<Wrapper><SplitPaymentForm employeeId="emp-002" netPay={5000} /></Wrapper>);

    await waitFor(() => {
      expect(screen.getByTestId('split-payment-form')).toBeInTheDocument();
    });

    // Start with 1 account (primary), add 2 more
    const addBtn = screen.getByTestId('add-account-btn');
    await user.click(addBtn);
    await user.click(addBtn);

    // Now should have 3 accounts total and add button should be gone
    expect(screen.getByTestId('split-account-0')).toBeInTheDocument();
    expect(screen.getByTestId('split-account-1')).toBeInTheDocument();
    expect(screen.getByTestId('split-account-2')).toBeInTheDocument();
    expect(screen.queryByTestId('add-account-btn')).not.toBeInTheDocument();
  });
});

describe('Payroll Reports Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists all report types', async () => {
    const Wrapper = createWrapper();
    render(<Wrapper><PayrollReportsPage /></Wrapper>);

    expect(screen.getByTestId('payroll-reports-page')).toBeInTheDocument();

    for (const report of PAYROLL_REPORTS) {
      expect(screen.getByText(report.name)).toBeInTheDocument();
      expect(screen.getByText(report.description)).toBeInTheDocument();
    }

    // 5 "Run Report" buttons
    const runButtons = screen.getAllByText('Run Report');
    expect(runButtons).toHaveLength(5);
  });

  it('runs a report and shows results', async () => {
    const user = userEvent.setup();
    mockApiFetch.mockResolvedValueOnce(MOCK_REPORT);
    const Wrapper = createWrapper();
    render(<Wrapper><PayrollReportsPage /></Wrapper>);

    // Click "Run Report" for first report
    const runBtn = screen.getByTestId('run-report-payroll-activity');
    await user.click(runBtn);

    await waitFor(() => {
      expect(screen.getByTestId('payroll-report-viewer')).toBeInTheDocument();
    });

    // Should show the report viewer with column headers from the report
    expect(screen.getByText('Pay Date')).toBeInTheDocument();
  });
});

describe('Payroll Report Viewer', () => {
  it('renders table with report data', () => {
    render(<PayrollReportViewer report={MOCK_REPORT} />);

    expect(screen.getByTestId('payroll-report-viewer')).toBeInTheDocument();
    expect(screen.getByText('Payroll Activity Summary')).toBeInTheDocument();

    // Column headers
    for (const col of MOCK_REPORT.columns) {
      expect(screen.getByText(col)).toBeInTheDocument();
    }

    // Data rows
    expect(screen.getByText('01 Feb 2026')).toBeInTheDocument();
    expect(screen.getByText('01 Jan 2026')).toBeInTheDocument();
  });

  it('shows Export CSV and Print buttons', () => {
    render(<PayrollReportViewer report={MOCK_REPORT} />);

    expect(screen.getByTestId('export-csv-btn')).toBeInTheDocument();
    expect(screen.getByTestId('print-btn')).toBeInTheDocument();
  });

  it('renders different report types correctly', () => {
    const kiwiReport: PayrollReportData = {
      type: 'kiwisaver',
      title: 'KiwiSaver Report',
      columns: ['Employee', 'Employee Rate', 'Employee Contribution', 'Employer Contribution', 'ESCT', 'Total'],
      rows: [['Sarah Chen', '3%', '$2,850.00', '$2,850.00', '$940.50', '$5,700.00']],
    };
    render(<PayrollReportViewer report={kiwiReport} />);

    expect(screen.getByText('KiwiSaver Report')).toBeInTheDocument();
    expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
    // $2,850.00 appears twice (Employee + Employer Contribution). Use getAllByText.
    expect(screen.getAllByText('$2,850.00')).toHaveLength(2);
    expect(screen.getByText('$940.50')).toBeInTheDocument();
  });
});

describe('useYearEndSummary hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns year-end data with totals', async () => {
    mockApiFetch.mockResolvedValueOnce(MOCK_YEAR_END);
    const { result } = renderHook(() => useYearEndSummary('2025'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
    expect(result.current.data!.employees).toHaveLength(5);
    expect(result.current.data!.totals.grossPay).toBe(427000);
  });
});

describe('useKiwiSaver hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns KiwiSaver settings for employee', async () => {
    mockApiFetch.mockResolvedValueOnce(MOCK_KIWISAVER);
    const { result } = renderHook(() => useKiwiSaver('emp-001'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
    expect(result.current.data!.employeeId).toBe('emp-001');
    expect(result.current.data!.employeeRate).toBe(3);
    expect(result.current.data!.esctRate).toBe(33);
  });
});
