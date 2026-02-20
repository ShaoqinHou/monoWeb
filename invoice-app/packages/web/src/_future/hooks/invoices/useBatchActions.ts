import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost, apiDelete } from '../../../lib/api-helpers';

export type EntityType = 'invoices' | 'bills' | 'contacts' | 'quotes';

export interface BatchDeleteResult {
  deleted: string[];
  failed: Array<{ id: string; error: string }>;
}

export interface BatchArchiveResult {
  archived: string[];
  failed: Array<{ id: string; error: string }>;
}

export interface BatchStatusChangeResult {
  updated: string[];
  failed: Array<{ id: string; error: string }>;
}

/** Batch delete entities by IDs */
export function useBatchDelete(entityType: EntityType) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) =>
      apiPost<BatchDeleteResult>(`/${entityType}/batch-delete`, { ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [entityType] });
    },
  });
}

/** Batch archive entities by IDs */
export function useBatchArchive(entityType: EntityType) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) =>
      apiPost<BatchArchiveResult>(`/${entityType}/batch-archive`, { ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [entityType] });
    },
  });
}

/** Batch change status of entities */
export function useBatchStatusChange(entityType: EntityType, newStatus: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) =>
      apiPost<BatchStatusChangeResult>(`/${entityType}/batch-status`, { ids, status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [entityType] });
    },
  });
}
