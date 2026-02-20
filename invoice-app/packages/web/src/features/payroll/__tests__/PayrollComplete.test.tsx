import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// ─── Mock api-helpers ────────────────────────────────────────────────────────

const mockApiFetch = vi.fn();
const mockApiPost = vi.fn();
const mockApiPut = vi.fn();

vi.mock('../../../lib/api-helpers', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
  apiPost: (...args: unknown[]) => mockApiPost(...args),
  apiPut: (...args: unknown[]) => mockApiPut(...args),
  apiDelete: (...args: unknown[]) => mockApiFetch(...args),
}));

// ─── Mock @shared/calc/currency ──────────────────────────────────────────────

vi.mock('@shared/calc/currency', () => ({
  formatCurrency: (amount: number) => `$${amount.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
}));

// ─── Imports (after mocks) ──────────────────────────────────────────────────

import { TimesheetGrid } from '../components/TimesheetGrid';
import { LeaveBalanceCard } from '../components/LeaveBalanceCard';
import { TaxFilingRow } from '../components/TaxFilingRow';
import type { TaxFiling } from '../components/TaxFilingRow';
import { useTimesheets, useCreateTimesheet, useUpdateTimesheet } from '../hooks/useTimesheets';
import type { TimesheetEntry } from '../hooks/useTimesheets';
import { useLeaveBalances } from '../hooks/useLeaveBalances';

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

// ─── Sample Data ────────────────────────────────────────────────────────────

const SAMPLE_TIMESHEET_ENTRIES: TimesheetEntry[] = [
  {
    id: 'ts-001',
    employeeId: 'emp-001',
    employeeName: 'Sarah Chen',
    weekStart: '2026-02-09',
    monday: 8,
    tuesday: 8,
    wednesday: 8,
    thursday: 8,
    friday: 8,
    saturday: 0,
    sunday: 0,
    total: 40,
    status: 'draft',
  },
  {
    id: 'ts-002',
    employeeId: 'emp-002',
    employeeName: 'James Wilson',
    weekStart: '2026-02-09',
    monday: 7.5,
    tuesday: 8,
    wednesday: 7.5,
    thursday: 8,
    friday: 7,
    saturday: 0,
    sunday: 0,
    total: 38,
    status: 'submitted',
  },
  {
    id: 'ts-003',
    employeeId: 'emp-003',
    employeeName: 'Emily Taylor',
    weekStart: '2026-02-09',
    monday: 8,
    tuesday: 8,
    wednesday: 8,
    thursday: 8,
    friday: 8,
    saturday: 0,
    sunday: 0,
    total: 40,
    status: 'approved',
  },
];

const SAMPLE_FILING: TaxFiling = {
  id: 'tf-002',
  period: 'Feb 2026',
  dueDate: '2026-03-20',
  status: 'draft',
  amount: 6442.32,
  irdStatus: 'pending',
};

const SAMPLE_LEAVE_REQUESTS = [
  { id: 'lr-1', employeeId: 'emp-001', leaveType: 'annual', startDate: '2026-01-10', endDate: '2026-01-14', hours: 40, status: 'approved', notes: null, createdAt: '2025-12-15' },
  { id: 'lr-2', employeeId: 'emp-001', leaveType: 'sick', startDate: '2026-02-03', endDate: '2026-02-03', hours: 8, status: 'approved', notes: null, createdAt: '2026-02-03' },
  { id: 'lr-3', employeeId: 'emp-001', leaveType: 'annual', startDate: '2026-03-01', endDate: '2026-03-02', hours: 16, status: 'pending', notes: null, createdAt: '2026-02-10' },
  { id: 'lr-4', employeeId: 'emp-002', leaveType: 'annual', startDate: '2026-01-20', endDate: '2026-01-24', hours: 40, status: 'approved', notes: null, createdAt: '2025-12-20' },
];

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('TimesheetGrid', () => {
  it('renders employee rows with day columns', () => {
    const onChange = vi.fn();
    render(<TimesheetGrid entries={SAMPLE_TIMESHEET_ENTRIES} weekStart="2026-02-09" onChange={onChange} />);

    expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
    expect(screen.getByText('James Wilson')).toBeInTheDocument();
    expect(screen.getByText('Emily Taylor')).toBeInTheDocument();
  });

  it('renders table headers for Mon-Sun', () => {
    const onChange = vi.fn();
    render(<TimesheetGrid entries={SAMPLE_TIMESHEET_ENTRIES} weekStart="2026-02-09" onChange={onChange} />);

    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Tue')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
    expect(screen.getByText('Thu')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();
    expect(screen.getByText('Sun')).toBeInTheDocument();
  });

  it('shows total hours per row', () => {
    const onChange = vi.fn();
    render(<TimesheetGrid entries={SAMPLE_TIMESHEET_ENTRIES} weekStart="2026-02-09" onChange={onChange} />);

    // Two entries have 40.0 (Sarah and Emily), one has 38.0
    const totals40 = screen.getAllByText('40.0');
    expect(totals40.length).toBe(2);
    expect(screen.getByText('38.0')).toBeInTheDocument();
  });

  it('shows status badges', () => {
    const onChange = vi.fn();
    render(<TimesheetGrid entries={SAMPLE_TIMESHEET_ENTRIES} weekStart="2026-02-09" onChange={onChange} />);

    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Submitted')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('calls onChange when an hour input changes', async () => {
    const onChange = vi.fn();
    render(<TimesheetGrid entries={SAMPLE_TIMESHEET_ENTRIES} weekStart="2026-02-09" onChange={onChange} />);

    const mondayInput = screen.getByLabelText('Sarah Chen monday hours');
    // Use fireEvent for controlled number inputs to avoid clear+type issues
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.change(mondayInput, { target: { value: '9' } });

    expect(onChange).toHaveBeenCalledWith('ts-001', { monday: 9 });
  });

  it('disables inputs for approved entries', () => {
    const onChange = vi.fn();
    render(<TimesheetGrid entries={SAMPLE_TIMESHEET_ENTRIES} weekStart="2026-02-09" onChange={onChange} />);

    const approvedInput = screen.getByLabelText('Emily Taylor monday hours');
    expect(approvedInput).toBeDisabled();
  });

  it('shows empty state when no entries', () => {
    const onChange = vi.fn();
    render(<TimesheetGrid entries={[]} weekStart="2026-02-09" onChange={onChange} />);

    expect(screen.getByText('No timesheet entries for this week')).toBeInTheDocument();
  });
});

describe('TaxFilingRow', () => {
  it('renders filing data', () => {
    const onFile = vi.fn();
    const { container } = render(
      <table>
        <tbody>
          <TaxFilingRow filing={SAMPLE_FILING} onFile={onFile} />
        </tbody>
      </table>,
    );

    expect(screen.getByText('Feb 2026')).toBeInTheDocument();
    expect(screen.getByText('2026-03-20')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('$6,442.32')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('shows File button for non-filed filings', () => {
    const onFile = vi.fn();
    render(
      <table>
        <tbody>
          <TaxFilingRow filing={SAMPLE_FILING} onFile={onFile} />
        </tbody>
      </table>,
    );

    expect(screen.getByTestId('file-btn-tf-002')).toBeInTheDocument();
  });

  it('calls onFile when File button is clicked', async () => {
    const user = userEvent.setup();
    const onFile = vi.fn();
    render(
      <table>
        <tbody>
          <TaxFilingRow filing={SAMPLE_FILING} onFile={onFile} />
        </tbody>
      </table>,
    );

    await user.click(screen.getByTestId('file-btn-tf-002'));
    expect(onFile).toHaveBeenCalledWith('tf-002');
  });

  it('hides File button for already-filed filings', () => {
    const onFile = vi.fn();
    const filedFiling: TaxFiling = { ...SAMPLE_FILING, status: 'filed', irdStatus: 'accepted' };
    render(
      <table>
        <tbody>
          <TaxFilingRow filing={filedFiling} onFile={onFile} />
        </tbody>
      </table>,
    );

    expect(screen.queryByTestId('file-btn-tf-002')).not.toBeInTheDocument();
  });
});

describe('useTimesheets hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches timesheets for a given week', async () => {
    // Hook now fetches all timesheets and filters/aggregates client-side
    const rawTimesheets = [
      { id: 'r1', employeeId: 'emp-001', date: '2026-02-09', hours: 8, description: 'Work' },
      { id: 'r2', employeeId: 'emp-001', date: '2026-02-10', hours: 8, description: 'Work' },
      { id: 'r3', employeeId: 'emp-002', date: '2026-02-09', hours: 7.5, description: 'Work' },
      { id: 'r4', employeeId: 'emp-003', date: '2026-02-11', hours: 8, description: 'Work' },
      // Outside the week — should be filtered out
      { id: 'r5', employeeId: 'emp-004', date: '2026-02-20', hours: 8, description: 'Other week' },
    ];
    mockApiFetch.mockResolvedValueOnce(rawTimesheets);
    const { result } = renderHook(() => useTimesheets('2026-02-09'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiFetch).toHaveBeenCalledWith('/timesheets');
    // 3 employees within the week (emp-001, emp-002, emp-003); emp-004 is outside
    expect(result.current.data).toHaveLength(3);
    const emp1 = result.current.data!.find((e) => e.employeeId === 'emp-001');
    expect(emp1!.monday).toBe(8);
    expect(emp1!.tuesday).toBe(8);
    expect(emp1!.total).toBe(16);
  });

  it('useCreateTimesheet posts to /timesheets', async () => {
    const newEntry = { ...SAMPLE_TIMESHEET_ENTRIES[0], id: 'ts-new' };
    mockApiPost.mockResolvedValueOnce(newEntry);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCreateTimesheet(), { wrapper });

    await act(async () => {
      result.current.mutate({
        employeeId: 'emp-001',
        weekStart: '2026-02-09',
        monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8, saturday: 0, sunday: 0,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiPost).toHaveBeenCalledWith('/timesheets', expect.objectContaining({ employeeId: 'emp-001' }));
  });

  it('useUpdateTimesheet puts to /timesheets/:id', async () => {
    mockApiPut.mockResolvedValueOnce({ ...SAMPLE_TIMESHEET_ENTRIES[0], monday: 9 });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useUpdateTimesheet(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: 'ts-001', updates: { monday: 9 } });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiPut).toHaveBeenCalledWith('/timesheets/ts-001', { monday: 9 });
  });
});

describe('useLeaveBalances hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calculates balances from approved leave requests', async () => {
    mockApiFetch.mockResolvedValueOnce(SAMPLE_LEAVE_REQUESTS);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useLeaveBalances('emp-001'), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const balances = result.current.data;
    expect(balances).toHaveLength(5);

    const annual = balances.find((b) => b.leaveType === 'annual');
    expect(annual).toMatchObject({ accrued: 160, taken: 40, remaining: 120 }); // only approved: lr-1 (40h), lr-3 is pending

    const sick = balances.find((b) => b.leaveType === 'sick');
    expect(sick).toMatchObject({ taken: 8, remaining: 32 });
  });

  it('returns zero taken for employees with no leave requests', async () => {
    mockApiFetch.mockResolvedValueOnce(SAMPLE_LEAVE_REQUESTS);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useLeaveBalances('emp-999'), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const balances = result.current.data;
    for (const balance of balances) {
      expect(balance.taken).toBe(0);
    }
  });
});

describe('LeaveBalanceCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockApiFetch.mockReturnValue(new Promise(() => {})); // never resolves
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <LeaveBalanceCard employeeId="emp-001" />
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('leave-balance-loading')).toBeInTheDocument();
  });

  it('renders leave balances after loading', async () => {
    mockApiFetch.mockResolvedValueOnce(SAMPLE_LEAVE_REQUESTS);

    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}>
        <LeaveBalanceCard employeeId="emp-001" />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Annual Leave')).toBeInTheDocument();
    });

    expect(screen.getByText('Sick Leave')).toBeInTheDocument();
    expect(screen.getByText('Bereavement')).toBeInTheDocument();

    // Check balances rendered
    const annualRow = screen.getByTestId('leave-balance-annual');
    expect(within(annualRow).getByText('160h')).toBeInTheDocument(); // accrued
    expect(within(annualRow).getByText('40h')).toBeInTheDocument();  // taken
    expect(within(annualRow).getByText('120h')).toBeInTheDocument(); // remaining
  });
});
