export const payrollKeys = {
  all: ['payroll'] as const,
  employees: () => [...payrollKeys.all, 'employees'] as const,
  employee: (id: string) => [...payrollKeys.employees(), id] as const,
  payRuns: () => [...payrollKeys.all, 'pay-runs'] as const,
  payRun: (id: string) => [...payrollKeys.payRuns(), id] as const,
  summary: () => [...payrollKeys.all, 'summary'] as const,
};
