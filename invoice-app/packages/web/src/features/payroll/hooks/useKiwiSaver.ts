import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPut } from '../../../lib/api-helpers';
import { showToast } from '../../dashboard/components/ToastContainer';

export const KIWISAVER_EMPLOYEE_RATES = [3, 4, 6, 8, 10] as const;
export const KIWISAVER_EMPLOYER_RATE = 3; // Fixed 3%

export type KiwiSaverEmployeeRate = (typeof KIWISAVER_EMPLOYEE_RATES)[number];

/** ESCT rate brackets based on annual salary (NZ 2025/2026) */
export function getESCTRate(annualSalary: number): number {
  if (annualSalary <= 16800) return 10.5;
  if (annualSalary <= 57600) return 17.5;
  if (annualSalary <= 84000) return 30;
  if (annualSalary <= 180000) return 33;
  return 39;
}

export interface KiwiSaverSettings {
  employeeId: string;
  employeeName: string;
  employeeRate: KiwiSaverEmployeeRate;
  employerRate: number;
  optedOut: boolean;
  esctRate: number;
  annualSalary: number;
}

export interface UpdateKiwiSaverInput {
  employeeId: string;
  employeeRate?: KiwiSaverEmployeeRate;
  optedOut?: boolean;
}

export function useKiwiSaver(employeeId: string) {
  return useQuery({
    queryKey: ['payroll', 'kiwisaver', employeeId],
    queryFn: () => apiFetch<KiwiSaverSettings>(`/payroll-settings/kiwisaver/${employeeId}`),
    staleTime: 60 * 1000,
    enabled: !!employeeId,
  });
}

export function useUpdateKiwiSaver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateKiwiSaverInput) =>
      apiPut<KiwiSaverSettings>(`/payroll-settings/kiwisaver/${input.employeeId}`, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['payroll', 'kiwisaver', variables.employeeId] });
      showToast('success', 'KiwiSaver settings saved');
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to save KiwiSaver settings'),
  });
}
