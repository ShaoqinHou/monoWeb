import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPut } from '../../../lib/api-helpers';

export interface ReminderSettingsValue {
  daysBeforeDue: number[];
  daysAfterDue: number[];
  templateText: string;
}

const REMINDER_SETTINGS_KEY = ['settings', 'invoice.reminders'] as const;

/** Fetch invoice reminder settings */
export function useReminderSettings() {
  return useQuery({
    queryKey: REMINDER_SETTINGS_KEY,
    queryFn: async () => {
      try {
        const result = await apiFetch<{ key: string; value: string }>('/settings/invoice.reminders');
        return JSON.parse(result.value) as ReminderSettingsValue;
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Save invoice reminder settings */
export function useSaveReminderSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: ReminderSettingsValue) =>
      apiPut<unknown>('/settings/invoice.reminders', { value: JSON.stringify(settings) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REMINDER_SETTINGS_KEY });
    },
  });
}
