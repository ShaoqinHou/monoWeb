import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fixedAssetKeys } from './fixedAssetKeys';
import { apiFetch, apiPost, apiPut, apiDelete } from '../../../lib/api-helpers';
import { showToast } from '../../dashboard/components/ToastContainer';

export type DepreciationMethod = 'straight_line' | 'diminishing_value';
export type AssetStatus = 'draft' | 'registered' | 'disposed' | 'sold';

export interface FixedAsset {
  id: string;
  name: string;
  assetNumber: string;
  purchaseDate: string;
  purchasePrice: number;
  depreciationMethod: DepreciationMethod;
  depreciationRate: number;
  currentValue: number;
  accumulatedDepreciation: number;
  assetAccountCode: string;
  depreciationAccountCode: string;
  status: AssetStatus;
  disposalDate: string | null;
  disposalPrice: number | null;
  createdAt: string;
}

export interface CreateFixedAsset {
  name: string;
  purchaseDate: string;
  purchasePrice: number;
  depreciationMethod?: DepreciationMethod;
  depreciationRate?: number;
  currentValue?: number;
  assetAccountCode: string;
  depreciationAccountCode: string;
}

export interface UpdateFixedAsset {
  name?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  depreciationMethod?: DepreciationMethod;
  depreciationRate?: number;
  currentValue?: number;
  assetAccountCode?: string;
  depreciationAccountCode?: string;
}

export function useFixedAssets() {
  return useQuery({
    queryKey: fixedAssetKeys.lists(),
    queryFn: () => apiFetch<FixedAsset[]>('/fixed-assets'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useFixedAsset(id: string) {
  return useQuery({
    queryKey: fixedAssetKeys.detail(id),
    queryFn: () => apiFetch<FixedAsset>(`/fixed-assets/${id}`),
    staleTime: 60 * 1000,
    enabled: !!id,
  });
}

export function useCreateFixedAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFixedAsset) =>
      apiPost<FixedAsset>('/fixed-assets', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fixedAssetKeys.lists() });
      showToast('success', 'Asset created');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to create asset');
    },
  });
}

export function useUpdateFixedAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFixedAsset }) =>
      apiPut<FixedAsset>(`/fixed-assets/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: fixedAssetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: fixedAssetKeys.detail(variables.id) });
      showToast('success', 'Asset updated');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to update asset');
    },
  });
}

export function useDeleteFixedAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiDelete<{ id: string }>(`/fixed-assets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fixedAssetKeys.lists() });
      showToast('success', 'Asset deleted');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to delete asset');
    },
  });
}

export function useDepreciateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiPost<FixedAsset>(`/fixed-assets/${id}/depreciate`, {}),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: fixedAssetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: fixedAssetKeys.detail(id) });
      showToast('success', 'Depreciation recorded');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to record depreciation');
    },
  });
}

export function useDisposeAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, type, price }: { id: string; type: 'disposed' | 'sold'; price?: number }) =>
      apiPost<FixedAsset>(`/fixed-assets/${id}/dispose`, { type, price }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: fixedAssetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: fixedAssetKeys.detail(variables.id) });
      showToast('success', variables.type === 'sold' ? 'Asset sold' : 'Asset disposed');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to dispose asset');
    },
  });
}
