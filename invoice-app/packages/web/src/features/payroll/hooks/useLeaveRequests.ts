import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost, apiPut, apiDelete } from '../../../lib/api-helpers';
import { showToast } from '../../dashboard/components/ToastContainer';
import { leaveRequestKeys } from './leaveRequestKeys';

// ── Types ────────────────────────────────────────────────────────────────────

export type LeaveType = 'annual' | 'sick' | 'bereavement' | 'parental' | 'unpaid';
export type LeaveStatus = 'pending' | 'approved' | 'declined';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  hours: number;
  status: LeaveStatus;
  notes: string | null;
  createdAt: string;
}

export interface CreateLeaveRequestInput {
  employeeId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  hours: number;
  notes?: string;
}

// ── Query Hooks ──────────────────────────────────────────────────────────────

/** Fetch all leave requests */
export function useLeaveRequests() {
  return useQuery({
    queryKey: leaveRequestKeys.lists(),
    queryFn: () => apiFetch<LeaveRequest[]>('/leave-requests'),
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch a single leave request by ID */
export function useLeaveRequest(id: string) {
  return useQuery({
    queryKey: leaveRequestKeys.detail(id),
    queryFn: () => apiFetch<LeaveRequest>(`/leave-requests/${id}`),
    staleTime: 60 * 1000,
    enabled: !!id,
  });
}

// ── Mutation Hooks ──────────────────────────────────────────────────────────

/** Create a leave request */
export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLeaveRequestInput) =>
      apiPost<LeaveRequest>('/leave-requests', data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: leaveRequestKeys.lists() });
      showToast('success', 'Leave request created');
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to create leave request'),
  });
}

/** Approve a leave request */
export function useApproveLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiPut<LeaveRequest>(`/leave-requests/${id}/approve`, {}),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: leaveRequestKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: leaveRequestKeys.lists() });
      showToast('success', 'Leave request approved');
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to approve leave request'),
  });
}

/** Decline a leave request */
export function useDeclineLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiPut<LeaveRequest>(`/leave-requests/${id}/decline`, {}),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: leaveRequestKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: leaveRequestKeys.lists() });
      showToast('success', 'Leave request declined');
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to decline leave request'),
  });
}

/** Delete a leave request */
export function useDeleteLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<void>(`/leave-requests/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: leaveRequestKeys.lists() });
      showToast('success', 'Leave request deleted');
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to delete leave request'),
  });
}
