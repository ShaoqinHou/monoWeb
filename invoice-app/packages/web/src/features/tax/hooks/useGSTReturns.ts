import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost, apiPut, apiDelete } from '../../../lib/api-helpers';
import { gstReturnKeys } from './gstReturnKeys';
import { showToast } from '../../dashboard/components/ToastContainer';

export interface GSTReturnApi {
  id: string;
  period: string;
  startDate: string;
  endDate: string;
  dueDate: string;
  status: 'draft' | 'filed' | 'overdue';
  gstCollected: number;
  gstPaid: number;
  netGst: number;
  filedAt: string | null;
  createdAt: string;
}

export interface CreateGSTReturn {
  period: string;
  startDate: string;
  endDate: string;
  dueDate: string;
}

/** Fetch all GST returns from API */
export function useGSTReturnsApi() {
  return useQuery({
    queryKey: gstReturnKeys.lists(),
    queryFn: () => apiFetch<GSTReturnApi[]>('/gst-returns'),
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch a single GST return from API */
export function useGSTReturnApi(id: string) {
  return useQuery({
    queryKey: gstReturnKeys.detail(id),
    queryFn: () => apiFetch<GSTReturnApi>(`/gst-returns/${id}`),
    staleTime: 60 * 1000,
    enabled: !!id,
  });
}

/** Create a new GST return (auto-calculates GST from invoices/bills) */
export function useCreateGSTReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGSTReturn) =>
      apiPost<GSTReturnApi>('/gst-returns', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gstReturnKeys.all });
      showToast('success', 'GST return created');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to create GST return');
    },
  });
}

/** File a GST return (changes status to filed) */
export function useFileGSTReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiPut<GSTReturnApi>(`/gst-returns/${id}/file`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gstReturnKeys.all });
      showToast('success', 'GST return filed');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to file GST return');
    },
  });
}

/** Delete a draft GST return */
export function useDeleteGSTReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiDelete<{ id: string }>(`/gst-returns/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gstReturnKeys.all });
      showToast('success', 'GST return deleted');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to delete GST return');
    },
  });
}
