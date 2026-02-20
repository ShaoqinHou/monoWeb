import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPut } from '../../../lib/api-helpers';
import { settingKeys } from './settingKeys';
import { showToast } from '../../dashboard/components/ToastContainer';

export interface SettingEntry {
  key: string;
  value: string;
  updatedAt: string;
}

/** Fetch all settings as key-value object */
export function useApiSettings() {
  return useQuery({
    queryKey: settingKeys.list(),
    queryFn: () => apiFetch<Record<string, string>>('/settings'),
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch a single setting by key */
export function useApiSetting(key: string) {
  return useQuery({
    queryKey: settingKeys.detail(key),
    queryFn: () => apiFetch<SettingEntry>(`/settings/${encodeURIComponent(key)}`),
    staleTime: 60 * 1000,
    enabled: !!key,
  });
}

/** Create or update a setting */
export function useUpdateApiSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      apiPut<SettingEntry>(`/settings/${encodeURIComponent(key)}`, { value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingKeys.all });
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to save setting');
    },
  });
}
