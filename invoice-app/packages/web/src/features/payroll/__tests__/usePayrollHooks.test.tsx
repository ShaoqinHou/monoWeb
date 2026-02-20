// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ─── Mock api-helpers ────────────────────────────────────────────────────────

const mockApiFetch = vi.fn();
const mockApiPost = vi.fn();
const mockApiPut = vi.fn();
const mockApiDelete = vi.fn();

vi.mock('../../../lib/api-helpers', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
  apiPost: (...args: unknown[]) => mockApiPost(...args),
  apiPut: (...args: unknown[]) => mockApiPut(...args),
  apiDelete: (...args: unknown[]) => mockApiDelete(...args),
}));

import {
  useEmployees,
  useEmployee,
  usePayRuns,
  usePayRun,
  usePayrollSummary,
  useAddEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
  useCreatePayRun,
  usePostPayRun,
} from '../hooks/usePayroll';

const SAMPLE_EMPLOYEES = [
  { id: 'e1', firstName: 'Sarah', lastName: 'Chen', email: 'sarah@test.com', position: 'Dev', startDate: '2023-01-01', salary: 90000, payFrequency: 'monthly', status: 'active', taxCode: 'M' },
  { id: 'e2', firstName: 'James', lastName: 'Wilson', email: 'james@test.com', position: 'PM', startDate: '2022-01-01', salary: 110000, payFrequency: 'monthly', status: 'active', taxCode: 'M' },
];

const SAMPLE_PAY_RUNS = [
  { id: 'pr1', periodStart: '2026-01-01', periodEnd: '2026-01-31', payDate: '2026-02-01', status: 'paid', employees: [], totalGross: 20000, totalTax: 5000, totalNet: 15000 },
  { id: 'pr2', periodStart: '2026-02-01', periodEnd: '2026-02-28', payDate: '2026-03-01', status: 'draft', employees: [], totalGross: 20000, totalTax: 5000, totalNet: 15000 },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('Payroll query hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('useEmployees calls apiFetch("/employees")', async () => {
    mockApiFetch.mockResolvedValueOnce(SAMPLE_EMPLOYEES);
    const { result } = renderHook(() => useEmployees(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiFetch).toHaveBeenCalledWith('/employees');
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data![0].firstName).toBe('Sarah');
  });

  it('useEmployee calls apiFetch("/employees/:id")', async () => {
    mockApiFetch.mockResolvedValueOnce(SAMPLE_EMPLOYEES[0]);
    const { result } = renderHook(() => useEmployee('e1'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiFetch).toHaveBeenCalledWith('/employees/e1');
    expect(result.current.data?.firstName).toBe('Sarah');
  });

  it('usePayRuns calls apiFetch("/pay-runs")', async () => {
    mockApiFetch.mockResolvedValueOnce(SAMPLE_PAY_RUNS);
    const { result } = renderHook(() => usePayRuns(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiFetch).toHaveBeenCalledWith('/pay-runs');
    expect(result.current.data).toHaveLength(2);
  });

  it('usePayRun calls apiFetch("/pay-runs/:id")', async () => {
    const payRunWithPayslips = {
      ...SAMPLE_PAY_RUNS[1],
      payslips: [
        { id: 'ps1', employeeId: 'e1', employeeName: 'Sarah Chen', gross: 7500, paye: 1800, kiwiSaverEmployee: 225, kiwiSaverEmployer: 225, studentLoan: 0, totalDeductions: 2025, net: 5475 },
      ],
    };
    mockApiFetch.mockResolvedValueOnce(payRunWithPayslips);
    const { result } = renderHook(() => usePayRun('pr2'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiFetch).toHaveBeenCalledWith('/pay-runs/pr2');
    expect(result.current.data?.payslips).toHaveLength(1);
    expect(result.current.data?.payslips![0].paye).toBe(1800);
  });

  it('usePayrollSummary calls apiFetch("/employees/summary")', async () => {
    const summary = { nextPayRunDate: '2026-03-01', totalEmployees: 4, ytdPayrollCosts: 50000 };
    mockApiFetch.mockResolvedValueOnce(summary);
    const { result } = renderHook(() => usePayrollSummary(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiFetch).toHaveBeenCalledWith('/employees/summary');
    expect(result.current.data?.totalEmployees).toBe(4);
  });
});

describe('Payroll mutation hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('useAddEmployee calls apiPost("/employees", data)', async () => {
    const newEmp = { ...SAMPLE_EMPLOYEES[0], id: 'e-new' };
    mockApiPost.mockResolvedValueOnce(newEmp);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useAddEmployee(), { wrapper });

    await act(async () => {
      result.current.mutate({
        firstName: 'Sarah',
        lastName: 'Chen',
        email: 'sarah@test.com',
        position: 'Dev',
        startDate: '2023-01-01',
        salary: 90000,
        payFrequency: 'monthly',
        status: 'active',
        taxCode: 'M',
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiPost).toHaveBeenCalledWith('/employees', expect.objectContaining({ firstName: 'Sarah' }));
  });

  it('useUpdateEmployee calls apiPut("/employees/:id", updates)', async () => {
    const updated = { ...SAMPLE_EMPLOYEES[0], salary: 120000 };
    mockApiPut.mockResolvedValueOnce(updated);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useUpdateEmployee(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: 'e1', updates: { salary: 120000 } });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiPut).toHaveBeenCalledWith('/employees/e1', { salary: 120000 });
  });

  it('useDeleteEmployee calls apiDelete("/employees/:id")', async () => {
    mockApiDelete.mockResolvedValueOnce(undefined);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useDeleteEmployee(), { wrapper });

    await act(async () => {
      result.current.mutate('e1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiDelete).toHaveBeenCalledWith('/employees/e1');
  });

  it('useCreatePayRun calls apiPost("/pay-runs", data)', async () => {
    const newPayRun = { ...SAMPLE_PAY_RUNS[1], id: 'pr-new' };
    mockApiPost.mockResolvedValueOnce(newPayRun);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCreatePayRun(), { wrapper });

    await act(async () => {
      result.current.mutate({ periodStart: '2026-03-01', periodEnd: '2026-03-31', payDate: '2026-04-01' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiPost).toHaveBeenCalledWith('/pay-runs', {
      periodStart: '2026-03-01',
      periodEnd: '2026-03-31',
      payDate: '2026-04-01',
    });
  });

  it('usePostPayRun calls apiPut("/pay-runs/:id/post", {})', async () => {
    const postedPayRun = { ...SAMPLE_PAY_RUNS[1], status: 'posted' };
    mockApiPut.mockResolvedValueOnce(postedPayRun);

    const wrapper = createWrapper();
    const { result } = renderHook(() => usePostPayRun(), { wrapper });

    await act(async () => {
      result.current.mutate('pr2');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiPut).toHaveBeenCalledWith('/pay-runs/pr2/post', {});
  });
});
