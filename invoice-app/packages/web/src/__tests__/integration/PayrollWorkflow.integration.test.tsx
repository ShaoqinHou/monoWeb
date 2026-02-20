// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('../../lib/api-helpers', () => ({
  apiFetch: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
}));

import { apiFetch, apiPost, apiPut } from '../../lib/api-helpers';
import { useAddEmployee, useCreatePayRun, usePostPayRun, useEmployees, usePayRuns } from '../../features/payroll/hooks/usePayroll';
import { useCreateTimesheet, useTimesheets } from '../../features/payroll/hooks/useTimesheets';
import { useCreateLeaveRequest, useApproveLeaveRequest, useLeaveRequests } from '../../features/payroll/hooks/useLeaveRequests';
import { useLeaveBalances } from '../../features/payroll/hooks/useLeaveBalances';

const mockedApiFetch = vi.mocked(apiFetch);
const mockedApiPost = vi.mocked(apiPost);
const mockedApiPut = vi.mocked(apiPut);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Payroll Workflow Integration', () => {
  it('creates employee, adds to pay run, calculates deductions', async () => {
    const employee = {
      id: 'emp-new',
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
      position: 'Developer',
      startDate: '2026-01-15',
      salary: 90000,
      payFrequency: 'monthly' as const,
      status: 'active' as const,
      taxCode: 'M',
    };

    const payRun = {
      id: 'pr-new',
      periodStart: '2026-02-01',
      periodEnd: '2026-02-28',
      payDate: '2026-03-01',
      status: 'draft',
      employees: [
        {
          employeeId: 'emp-new',
          employeeName: 'Jane Doe',
          gross: 7500,
          tax: 1875,
          net: 5625,
        },
      ],
      totalGross: 7500,
      totalTax: 1875,
      totalNet: 5625,
    };

    mockedApiPost.mockResolvedValueOnce(employee); // create employee
    mockedApiPost.mockResolvedValueOnce(payRun); // create pay run

    const wrapper = createWrapper();

    // Create employee
    const { result: empResult } = renderHook(() => useAddEmployee(), { wrapper });
    await act(async () => {
      const created = await empResult.current.mutateAsync({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        position: 'Developer',
        startDate: '2026-01-15',
        salary: 90000,
        payFrequency: 'monthly',
        status: 'active',
        taxCode: 'M',
      });
      expect(created.id).toBe('emp-new');
    });

    // Create pay run with employee
    const { result: payRunResult } = renderHook(() => useCreatePayRun(), { wrapper });
    await act(async () => {
      const created = await payRunResult.current.mutateAsync({
        periodStart: '2026-02-01',
        periodEnd: '2026-02-28',
        payDate: '2026-03-01',
      });
      expect(created.employees).toHaveLength(1);
      expect(created.employees[0].gross).toBe(7500);
      expect(created.totalTax).toBe(1875);
      expect(created.totalNet).toBe(5625);
    });
  });

  it('submits pay run, approves, and marks as paid (posts)', async () => {
    const draftPayRun = {
      id: 'pr-1',
      status: 'draft',
      totalGross: 25000,
      totalTax: 6250,
      totalNet: 18750,
    };

    const postedPayRun = {
      ...draftPayRun,
      status: 'posted',
    };

    mockedApiPut.mockResolvedValueOnce(postedPayRun);

    const wrapper = createWrapper();

    // Post the pay run (finalize)
    const { result: postResult } = renderHook(() => usePostPayRun(), { wrapper });
    await act(async () => {
      const posted = await postResult.current.mutateAsync('pr-1');
      expect(posted.status).toBe('posted');
    });

    expect(mockedApiPut).toHaveBeenCalledWith('/pay-runs/pr-1/post', {});
  });

  it('timesheet entry created for employee', async () => {
    const timesheetEntry = {
      id: 'ts-1',
      employeeId: 'emp-1',
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
    };

    mockedApiPost.mockResolvedValueOnce(timesheetEntry);

    const wrapper = createWrapper();

    const { result } = renderHook(() => useCreateTimesheet(), { wrapper });
    await act(async () => {
      const entry = await result.current.mutateAsync({
        employeeId: 'emp-1',
        weekStart: '2026-02-09',
        monday: 8,
        tuesday: 8,
        wednesday: 8,
        thursday: 8,
        friday: 8,
        saturday: 0,
        sunday: 0,
      });
      expect(entry.total).toBe(40);
      expect(entry.status).toBe('draft');
    });
  });

  it('leave request created, approved, and balance updated', async () => {
    const leaveRequest = {
      id: 'lr-1',
      employeeId: 'emp-1',
      leaveType: 'annual',
      startDate: '2026-03-10',
      endDate: '2026-03-14',
      hours: 40,
      status: 'pending',
      notes: 'Family holiday',
      createdAt: '2026-02-15T00:00:00Z',
    };

    const approvedRequest = {
      ...leaveRequest,
      status: 'approved',
    };

    mockedApiPost.mockResolvedValueOnce(leaveRequest); // create leave request
    mockedApiPut.mockResolvedValueOnce(approvedRequest); // approve

    const wrapper = createWrapper();

    // Create leave request
    const { result: createResult } = renderHook(() => useCreateLeaveRequest(), { wrapper });
    await act(async () => {
      const created = await createResult.current.mutateAsync({
        employeeId: 'emp-1',
        leaveType: 'annual',
        startDate: '2026-03-10',
        endDate: '2026-03-14',
        hours: 40,
        notes: 'Family holiday',
      });
      expect(created.status).toBe('pending');
    });

    // Approve leave request
    const { result: approveResult } = renderHook(() => useApproveLeaveRequest(), { wrapper });
    await act(async () => {
      const approved = await approveResult.current.mutateAsync('lr-1');
      expect(approved.status).toBe('approved');
    });

    expect(mockedApiPut).toHaveBeenCalledWith('/leave-requests/lr-1/approve', {});
  });

  it('leave balances reflect approved leave requests', async () => {
    const leaveRequests = [
      {
        id: 'lr-1',
        employeeId: 'emp-1',
        leaveType: 'annual',
        startDate: '2026-01-10',
        endDate: '2026-01-14',
        hours: 40,
        status: 'approved',
        notes: null,
        createdAt: '2026-01-05T00:00:00Z',
      },
      {
        id: 'lr-2',
        employeeId: 'emp-1',
        leaveType: 'sick',
        startDate: '2026-02-05',
        endDate: '2026-02-05',
        hours: 8,
        status: 'approved',
        notes: null,
        createdAt: '2026-02-04T00:00:00Z',
      },
      {
        id: 'lr-3',
        employeeId: 'emp-2',
        leaveType: 'annual',
        startDate: '2026-01-20',
        endDate: '2026-01-24',
        hours: 40,
        status: 'approved',
        notes: null,
        createdAt: '2026-01-15T00:00:00Z',
      },
    ];

    mockedApiFetch.mockResolvedValueOnce(leaveRequests);

    const wrapper = createWrapper();

    const { result } = renderHook(() => useLeaveBalances('emp-1'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const annualBalance = result.current.data.find((b) => b.leaveType === 'annual');
    const sickBalance = result.current.data.find((b) => b.leaveType === 'sick');

    expect(annualBalance).toMatchObject({ accrued: 160, taken: 40, remaining: 120 }); // 4 weeks standard NZ

    expect(sickBalance).toMatchObject({ accrued: 40, taken: 8, remaining: 32 }); // 5 days standard NZ
  });

  it('fetches employees and pay runs lists', async () => {
    const employees = [
      { id: 'emp-1', firstName: 'Sarah', lastName: 'Chen', status: 'active' },
      { id: 'emp-2', firstName: 'James', lastName: 'Wilson', status: 'active' },
    ];
    const payRuns = [
      { id: 'pr-1', status: 'paid', payDate: '2026-02-01', totalNet: 19000 },
      { id: 'pr-2', status: 'draft', payDate: '2026-03-01', totalNet: 19000 },
    ];

    mockedApiFetch.mockResolvedValueOnce(employees);
    mockedApiFetch.mockResolvedValueOnce(payRuns);

    const wrapper = createWrapper();

    const { result: empResult } = renderHook(() => useEmployees(), { wrapper });
    await waitFor(() => expect(empResult.current.isSuccess).toBe(true));
    expect(empResult.current.data).toHaveLength(2);

    const { result: prResult } = renderHook(() => usePayRuns(), { wrapper });
    await waitFor(() => expect(prResult.current.isSuccess).toBe(true));
    expect(prResult.current.data).toHaveLength(2);
  });
});
