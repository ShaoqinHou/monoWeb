import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost, apiPut, apiDelete } from '../../../lib/api-helpers';
import { showToast } from '../../dashboard/components/ToastContainer';
import type {
  Employee,
  PayRun,
  PayrollSummary,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  CreatePayRunInput,
} from '../types';
import { payrollKeys } from './keys';

// ─── Query Hooks ─────────────────────────────────────────────────────────────

/** Fetch all employees */
export function useEmployees() {
  return useQuery({
    queryKey: payrollKeys.employees(),
    queryFn: () => apiFetch<Employee[]>('/employees'),
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch a single employee by ID */
export function useEmployee(id: string) {
  return useQuery({
    queryKey: payrollKeys.employee(id),
    queryFn: () => apiFetch<Employee>(`/employees/${id}`),
    staleTime: 60 * 1000,
    enabled: !!id,
  });
}

/** Fetch all pay runs */
export function usePayRuns() {
  return useQuery({
    queryKey: payrollKeys.payRuns(),
    queryFn: () => apiFetch<PayRun[]>('/pay-runs'),
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch a single pay run by ID (includes payslips) */
export function usePayRun(id: string) {
  return useQuery({
    queryKey: payrollKeys.payRun(id),
    queryFn: () => apiFetch<PayRun>(`/pay-runs/${id}`),
    staleTime: 60 * 1000,
    enabled: !!id,
  });
}

/** Fetch payroll summary */
export function usePayrollSummary() {
  return useQuery({
    queryKey: payrollKeys.summary(),
    queryFn: () => apiFetch<PayrollSummary>('/employees/summary'),
    staleTime: 60 * 1000,
  });
}

// ─── Mutation Hooks ──────────────────────────────────────────────────────────

/** Create a new employee */
export function useAddEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEmployeeInput) =>
      apiPost<Employee>('/employees', data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: payrollKeys.employees() });
      void queryClient.invalidateQueries({ queryKey: payrollKeys.summary() });
      showToast('success', 'Employee created');
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to create employee'),
  });
}

/** Update an existing employee */
export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateEmployeeInput }) =>
      apiPut<Employee>(`/employees/${id}`, updates),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: payrollKeys.employee(variables.id) });
      void queryClient.invalidateQueries({ queryKey: payrollKeys.employees() });
      void queryClient.invalidateQueries({ queryKey: payrollKeys.summary() });
      showToast('success', 'Employee updated');
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to update employee'),
  });
}

/** Delete an employee */
export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<void>(`/employees/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: payrollKeys.employees() });
      void queryClient.invalidateQueries({ queryKey: payrollKeys.summary() });
      showToast('success', 'Employee deleted');
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to delete employee'),
  });
}

/** Create a new pay run (auto-generates payslips with NZ PAYE/KiwiSaver) */
export function useCreatePayRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePayRunInput) =>
      apiPost<PayRun>('/pay-runs', data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: payrollKeys.payRuns() });
      void queryClient.invalidateQueries({ queryKey: payrollKeys.summary() });
      showToast('success', 'Pay run created');
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to create pay run'),
  });
}

/** Post (finalize) a draft pay run */
export function usePostPayRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiPut<PayRun>(`/pay-runs/${id}/post`, {}),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: payrollKeys.payRun(id) });
      void queryClient.invalidateQueries({ queryKey: payrollKeys.payRuns() });
      void queryClient.invalidateQueries({ queryKey: payrollKeys.summary() });
      showToast('success', 'Pay run posted');
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to post pay run'),
  });
}

// ─── Legacy mock data exports (for backward-compatible tests) ───────────────

const MOCK_EMPLOYEES: Employee[] = [
  {
    id: 'emp-001',
    firstName: 'Sarah',
    lastName: 'Chen',
    email: 'sarah.chen@example.com',
    position: 'Software Engineer',
    startDate: '2023-03-15',
    salary: 95000,
    payFrequency: 'monthly',
    status: 'active',
    taxCode: 'M',
    employmentType: 'employee',
    nextPaymentDate: '2023-07-18',
  },
  {
    id: 'emp-002',
    firstName: 'James',
    lastName: 'Wilson',
    email: 'james.wilson@example.com',
    position: 'Product Manager',
    startDate: '2022-08-01',
    salary: 110000,
    payFrequency: 'monthly',
    status: 'active',
    taxCode: 'M',
    employmentType: 'employee',
    nextPaymentDate: '2023-07-18',
  },
  {
    id: 'emp-003',
    firstName: 'Emily',
    lastName: 'Taylor',
    email: 'emily.taylor@example.com',
    position: 'UX Designer',
    startDate: '2024-01-10',
    salary: 85000,
    payFrequency: 'fortnightly',
    status: 'active',
    taxCode: 'ME',
    employmentType: 'employee',
    nextPaymentDate: '2023-07-25',
  },
  {
    id: 'emp-004',
    firstName: 'Michael',
    lastName: 'Brown',
    email: 'michael.brown@example.com',
    position: 'Sales Representative',
    startDate: '2021-06-20',
    salary: 72000,
    payFrequency: 'monthly',
    status: 'inactive',
    taxCode: 'M',
    employmentType: 'contractor',
    nextPaymentDate: '2023-07-18',
  },
  {
    id: 'emp-005',
    firstName: 'Lisa',
    lastName: 'Martinez',
    email: 'lisa.martinez@example.com',
    position: 'Office Manager',
    startDate: '2023-11-05',
    salary: 65000,
    payFrequency: 'monthly',
    status: 'active',
    taxCode: 'S',
    employmentType: 'employee',
    nextPaymentDate: '2023-07-18',
  },
];

const MOCK_PAY_RUNS: PayRun[] = [
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

const MOCK_SUMMARY: PayrollSummary = {
  nextPayRunDate: '2026-03-01',
  totalEmployees: 4,
  ytdPayrollCosts: 51538.48,
};

function _resetMockData() {
  // No-op — kept for backward compatibility with tests that import it.
  // Tests should now use vi.mock to mock fetch/api-helpers.
}

export { MOCK_EMPLOYEES, MOCK_PAY_RUNS, MOCK_SUMMARY, _resetMockData };
