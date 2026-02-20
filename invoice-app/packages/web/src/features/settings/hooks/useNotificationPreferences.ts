import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPut } from '../../../lib/api-helpers';

export interface NotificationPreferences {
  overdueReminders: boolean;
  overdueReminderDays: number;
  paymentConfirmations: boolean;
  quoteExpiryAlerts: boolean;
  quoteExpiryDaysBefore: number;
  billDueAlerts: boolean;
  billDueDaysBefore: number;
  bankFeedUpdates: boolean;
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ['settings', 'notification-preferences'],
    queryFn: () => apiFetch<NotificationPreferences>('/notification-preferences'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (prefs: NotificationPreferences) =>
      apiPut<NotificationPreferences>('/notification-preferences', prefs),
    onSuccess: (data) => {
      queryClient.setQueryData(['settings', 'notification-preferences'], data);
    },
  });
}
