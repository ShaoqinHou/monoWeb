import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost, apiPut, apiDelete } from '../../../lib/api-helpers';
import { showToast } from '../../dashboard/components/ToastContainer';
import { leaveTypeKeys } from './leaveTypeKeys';

export interface LeaveType {
  id: string;
  name: string;
  paidLeave: boolean;
  showOnPayslip: boolean;
  defaultDaysPerYear: number;
}

export function useLeaveTypes() {
  return useQuery({
    queryKey: leaveTypeKeys.list(),
    queryFn: () => apiFetch<LeaveType[]>('/leave-types'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateLeaveType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<LeaveType, 'id'>) =>
      apiPost<LeaveType>('/leave-types', data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: leaveTypeKeys.list() });
      showToast('success', 'Leave type added');
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to add leave type'),
  });
}

export function useUpdateLeaveType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<LeaveType, 'id'>> }) =>
      apiPut<LeaveType>(`/leave-types/${id}`, updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: leaveTypeKeys.list() });
      showToast('success', 'Leave type updated');
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to update leave type'),
  });
}

export function useDeleteLeaveType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiDelete<void>(`/leave-types/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: leaveTypeKeys.list() });
      showToast('success', 'Leave type deleted');
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to delete leave type'),
  });
}
