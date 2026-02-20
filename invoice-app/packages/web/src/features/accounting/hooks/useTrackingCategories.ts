import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost, apiPut, apiDelete } from '../../../lib/api-helpers';
import { accountingKeys } from './keys';

export interface TrackingOption {
  id: string;
  name: string;
}

export interface TrackingCategory {
  id: string;
  name: string;
  options: TrackingOption[];
  createdAt: string;
}

export interface CreateTrackingCategory {
  name: string;
  options: string[];
}

export interface UpdateTrackingCategory {
  name?: string;
  options?: string[];
}

const trackingKeys = {
  all: () => [...accountingKeys.all, 'tracking-categories'] as const,
  lists: () => [...trackingKeys.all(), 'list'] as const,
  detail: (id: string) => [...trackingKeys.all(), id] as const,
};

export { trackingKeys };

export function useTrackingCategories() {
  return useQuery({
    queryKey: trackingKeys.lists(),
    queryFn: () => apiFetch<TrackingCategory[]>('/tracking-categories'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTrackingCategory(id: string) {
  return useQuery({
    queryKey: trackingKeys.detail(id),
    queryFn: () => apiFetch<TrackingCategory>(`/tracking-categories/${id}`),
    staleTime: 60 * 1000,
    enabled: !!id,
  });
}

export function useCreateTrackingCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTrackingCategory) =>
      apiPost<TrackingCategory>('/tracking-categories', {
        name: data.name,
        options: data.options.map((name) => ({ id: '', name, isActive: true })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trackingKeys.lists() });
    },
  });
}

export function useUpdateTrackingCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTrackingCategory }) =>
      apiPut<TrackingCategory>(`/tracking-categories/${id}`, {
        name: data.name,
        options: data.options?.map((name) => ({ id: '', name, isActive: true })),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: trackingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: trackingKeys.detail(variables.id) });
    },
  });
}

export function useDeleteTrackingCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiDelete<{ id: string }>(`/tracking-categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trackingKeys.lists() });
    },
  });
}
